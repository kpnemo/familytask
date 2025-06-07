import OpenAI from 'openai';
import { FamilyContext } from '../mcp/family-context';
import { ParsedTask, ClarificationQuestion } from '../../types/ai';

export class OpenAITaskParser {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Language detection utility
  private detectLanguage(text: string): 'en' | 'ru' | 'unknown' {
    // Simple language detection based on Cyrillic characters
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const hasRussian = cyrillicPattern.test(text);
    
    // Check for common Russian task words
    const russianTaskWords = /\b(убрать|сделать|выполнить|помыть|почистить|постирать|делать|завтра|сегодня|вчера|неделя|недели|комната|дом|посуда|уборка|белье|уроки|урок|должен|должна|каждый|день|домашн[иеяю]|задан[иеяю]|баллов?|очков?|до|конца|следующей|слещующей)\b/i;
    
    if (hasRussian || russianTaskWords.test(text)) {
      return 'ru';
    }
    
    // Check for common English task words
    const englishTaskWords = /\b(clean|do|complete|wash|tomorrow|today|yesterday|week|room|home|dishes|homework|task|point|chore)\b/i;
    
    if (englishTaskWords.test(text)) {
      return 'en';
    }
    
    return 'unknown';
  }

  private getSystemPrompt(language: 'en' | 'ru' | 'unknown'): string {
    if (language === 'ru') {
      return `Вы - эксперт ИИ по анализу семейных задач. Анализируйте описания задач на естественном языке (русском) и извлекайте структурированную информацию о задачах.

Возможности:
- Понимание русских команд и запросов
- Извлечение нескольких задач из одного сообщения
- Распознавание дат (завтра, понедельник, через неделю, 15 января и т.д.)
- Назначение задач членам семьи по именам
- Определение повторяющихся задач (ежедневно, еженедельно, ежемесячно)
- Создание бонусных задач (никому не назначенных)
- Оценка сложности для определения баллов

Форматы дат:
- Завтра: следующий день
- Понедельник, вторник и т.д.: ближайший такой день недели
- Через неделю: +7 дней
- 15 января: конкретная дата
- Сегодня: текущий день

ФОРМАТ ОТВЕТА (только JSON):
{
  "parsedTasks": [
    {
      "title": "Название задачи",
      "description": "Описание (опционально)",
      "assignedTo": "id_member_or_null",
      "dueDate": "YYYY-MM-DD",
      "points": number_1_to_10,
      "isRecurring": boolean,
      "recurrencePattern": "DAILY|WEEKLY|MONTHLY|null",
      "isBonusTask": boolean,
      "dueDateOnly": boolean,
      "confidence": 0.95
    }
  ],
  "clarificationQuestions": []
}`;
    }
    
    return `You are an expert family task parsing AI. Analyze natural language task descriptions (in English) and extract structured task information.

Capabilities:
- Understanding English commands and requests
- Extracting multiple tasks from a single message
- Recognizing dates (tomorrow, Monday, next week, January 15th, etc.)
- Assigning tasks to family members by name
- Identifying recurring tasks (daily, weekly, monthly)
- Creating bonus tasks (unassigned for anyone to claim)
- Estimating complexity for point values

Date formats:
- Tomorrow: next day
- Monday, Tuesday, etc.: next occurrence of that weekday
- Next week: +7 days
- January 15th: specific date
- Today: current day

RESPONSE FORMAT (JSON only):
{
  "parsedTasks": [
    {
      "title": "Task name",
      "description": "Description (optional)",
      "assignedTo": "member_id_or_null",
      "dueDate": "YYYY-MM-DD",
      "points": number_1_to_10,
      "isRecurring": boolean,
      "recurrencePattern": "DAILY|WEEKLY|MONTHLY|null",
      "isBonusTask": boolean,
      "dueDateOnly": boolean,
      "confidence": 0.95
    }
  ],
  "clarificationQuestions": []
}`;
  }

  async parseNaturalLanguage(
    input: string, 
    familyContext: FamilyContext,
    targetDate?: string,
    defaultPoints?: number,
    retryCount: number = 0
  ): Promise<{
    parsedTasks: ParsedTask[];
    clarificationQuestions: ClarificationQuestion[];
    detectedLanguage?: string;
  }> {
    try {
      // Detect language
      const detectedLanguage = this.detectLanguage(input);
      
      const prompt = this.buildParsingPrompt(input, familyContext, targetDate, defaultPoints, detectedLanguage);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Latest GPT-4o model for best multilingual understanding
        max_tokens: 1500,
        temperature: 0.1, // Low temperature for consistent parsing
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(detectedLanguage)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      const result = this.parseAIResponse(content);
      return {
        ...result,
        detectedLanguage: detectedLanguage === 'unknown' ? 'en' : detectedLanguage
      };
    } catch (error) {
      console.error(`Error parsing natural language (attempt ${retryCount + 1}):`, error);
      
      // Retry once if this is the first attempt and the error is parsing-related
      if (retryCount === 0 && (error instanceof SyntaxError || error.message.includes('JSON'))) {
        console.log('Retrying parsing request due to parsing error...');
        return this.parseNaturalLanguage(input, familyContext, targetDate, defaultPoints, 1);
      }
      
      // Return empty result with error handling
      return {
        parsedTasks: [],
        clarificationQuestions: [],
        detectedLanguage: this.detectLanguage(input) === 'unknown' ? 'en' : this.detectLanguage(input)
      };
    }
  }

  private buildParsingPrompt(
    input: string, 
    familyContext: FamilyContext, 
    targetDate?: string, 
    defaultPoints?: number,
    language: 'en' | 'ru' | 'unknown' = 'en'
  ): string {
    const familyMembers = familyContext.members.map(m => ({
      name: m.name,
      role: m.role,
      id: m.id
    }));

    const currentDate = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (language === 'ru') {
      console.log('Russian parsing with family members:', familyMembers);
      return `КОНТЕКСТ СЕМЬИ:
Члены семьи: ${JSON.stringify(familyMembers, null, 2)}
Текущая дата: ${currentDate}
Завтра: ${tomorrow}
${targetDate ? `Целевая дата: ${targetDate}` : ''}
${defaultPoints ? `Баллы по умолчанию: ${defaultPoints}` : ''}

ПОЛЬЗОВАТЕЛЬСКИЙ ВВОД: "${input}"

ВНИМАНИЕ: ОБЯЗАТЕЛЬНО найдите Erik в списке members выше и используйте его ТОЧНЫЙ ID для assignedTo!

ИНСТРУКЦИИ ПО ПАРСИНГУ:
1. Извлеките ВСЕ задачи из пользовательского ввода
2. Для каждой задачи определите:
   - title: четкое название задачи
   - description: дополнительные детали (если есть)
   - assignedTo: ID члена семьи (если упоминается имя) или null для бонусных задач
   - dueDate: дата в формате YYYY-MM-DD
   - points: баллы на основе сложности (1-10)
   - isRecurring: true если задача повторяющаяся
   - recurrencePattern: DAILY, WEEKLY, или MONTHLY
   - isBonusTask: true если никому не назначена
   - dueDateOnly: true если нужно выполнить строго в указанную дату
3. Создавайте вопросы уточнения только при необходимости
4. Используйте контекст семьи для назначения задач
5. Будьте умными в интерпретации дат и повторений

ПРАВИЛА НАЗНАЧЕНИЯ:
- Если имя упоминается явно → назначьте этому человеку
- Если сказано "бонусная задача" → isBonusTask: true, assignedTo: null
- Если неясно → создайте вопрос уточнения

ВАЖНЫЕ РУССКИЕ КОНСТРУКЦИИ:
- "Erik должен" = assign to Erik (найти Erik в family members и использовать его ID)
- "Саша должна" = assign to Саша (найти Саша в family members и использовать его ID)
- "каждый день" = isRecurring: true, recurrencePattern: "DAILY"
- "каждую неделю" = isRecurring: true, recurrencePattern: "WEEKLY"
- "до конца недели" = end of current week (Friday)
- "до конца следующей недели" = end of next week
- "делать уроки" = do homework (средняя сложность, ~3 балла)

КРИТИЧЕСКИ ВАЖНО - НАЗНАЧЕНИЕ ЗАДАЧ:
1. ВСЕГДА ищите имена в списке family members
2. ТОЧНО сопоставляйте имя из ввода с member.name
3. Используйте member.id для assignedTo
4. Если имя не найдено - создайте clarification question

ПРИМЕРЫ ДНЕЙ НЕДЕЛИ НА РУССКОМ:
понедельник, вторник, среда, четверг, пятница, суббота, воскресенье

ПРИМЕРЫ ПРАВИЛЬНОГО ПАРСИНГА:
Ввод: "Erik должен делать уроки каждый день"
Результат: {
  title: "Делать уроки",
  assignedTo: "ТОЧНЫЙ_ID_Erik_ИЗ_FAMILY_MEMBERS",
  dueDate: "2025-01-07", // today or tomorrow
  points: 3,
  isRecurring: true,
  recurrencePattern: "DAILY",
  isBonusTask: false,
  confidence: 0.95
}`;
    }

    return `FAMILY CONTEXT:
Family Members: ${JSON.stringify(familyMembers, null, 2)}
Current Date: ${currentDate}
Tomorrow: ${tomorrow}
${targetDate ? `Target Date: ${targetDate}` : ''}
${defaultPoints ? `Default Points: ${defaultPoints}` : ''}

USER INPUT: "${input}"

PARSING INSTRUCTIONS:
1. Extract ALL tasks from the user input
2. For each task, determine:
   - title: clear task name
   - description: additional details (if any)
   - assignedTo: family member ID (if name mentioned) or null for bonus tasks
   - dueDate: date in YYYY-MM-DD format
   - points: points based on complexity (1-10)
   - isRecurring: true if task repeats
   - recurrencePattern: DAILY, WEEKLY, or MONTHLY
   - isBonusTask: true if unassigned
   - dueDateOnly: true if must be done on specific date
3. Create clarification questions only when necessary
4. Use family context for task assignment
5. Be smart about interpreting dates and recurrence

ASSIGNMENT RULES:
- If name explicitly mentioned → assign to that person
- If "bonus task" mentioned → isBonusTask: true, assignedTo: null
- If unclear → create clarification question

EXAMPLE WEEKDAYS:
Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday`;
  }

  private parseAIResponse(response: string): {
    parsedTasks: ParsedTask[];
    clarificationQuestions: ClarificationQuestion[];
  } {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in task parsing response');
      }

      // Clean up JSON
      const cleanedJson = jsonMatch[0]
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');

      const parsed = JSON.parse(cleanedJson);
      console.log('Parsed AI response:', parsed);

      // Ensure each parsed task has valid confidence value
      const parsedTasks = (parsed.parsedTasks || []).map((task: any) => ({
        ...task,
        confidence: typeof task.confidence === 'number' && !isNaN(task.confidence) ? task.confidence : 0.8
      }));

      console.log('Final parsed tasks with confidence:', parsedTasks);

      return {
        parsedTasks,
        clarificationQuestions: parsed.clarificationQuestions || []
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', response);
      
      // Return empty result if parsing fails
      return {
        parsedTasks: [],
        clarificationQuestions: []
      };
    }
  }
}