import OpenAI from 'openai';
import { FamilyContext } from '../mcp/family-context';
import { isTaskOverdue } from '../utils';

export interface AnalyticsQuery {
  question: string;
  timeframe?: string;
  targetMember?: string;
  language?: 'en' | 'ru' | 'auto'; // Add language support
}

export interface AnalyticsResponse {
  answer: string;
  data: {
    metrics?: Record<string, any>;
    insights?: string[];
    recommendations?: string[];
    charts?: Array<{
      type: 'bar' | 'line' | 'pie';
      title: string;
      data: any[];
    }>;
  };
  confidence: number;
  detectedLanguage?: string;
}

export class OpenAIAnalyticsEngine {
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
    
    // Check for common Russian words
    const russianWords = /\b(задач[аеиоуыэяю]|семь[яею]|ребен[окк]|родител[ьияе]|дом|сделать|завтра|сегодня|вчера|неделя|месяц|очки|баллы)\b/i;
    
    if (hasRussian || russianWords.test(text)) {
      return 'ru';
    }
    
    // Check for common English words
    const englishWords = /\b(task|family|child|parent|home|do|tomorrow|today|yesterday|week|month|points)\b/i;
    
    if (englishWords.test(text)) {
      return 'en';
    }
    
    return 'unknown';
  }

  async analyzeFamily(
    query: AnalyticsQuery,
    familyContext: FamilyContext,
    retryCount: number = 0
  ): Promise<AnalyticsResponse> {
    try {
      // Detect language if not specified
      const detectedLanguage = query.language === 'auto' || !query.language 
        ? this.detectLanguage(query.question)
        : query.language;

      const prompt = this.buildAnalyticsPrompt(query, familyContext, detectedLanguage);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Latest GPT-4o model - excellent for multilingual tasks
        max_tokens: 1500,
        temperature: 0.2,
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

      const result = this.parseAnalyticsResponse(content);
      return {
        ...result,
        detectedLanguage: detectedLanguage === 'unknown' ? 'en' : detectedLanguage
      };
    } catch (error) {
      console.error(`Error analyzing family data (attempt ${retryCount + 1}):`, error);
      
      // Retry once if this is the first attempt and the error is parsing-related
      if (retryCount === 0 && (error instanceof SyntaxError || error.message.includes('JSON'))) {
        console.log('Retrying analytics request due to parsing error...');
        return this.analyzeFamily(query, familyContext, 1);
      }
      
      // Return error message in detected language
      const detectedLanguage = this.detectLanguage(query.question);
      const errorMessage = detectedLanguage === 'ru' 
        ? "У меня возникли проблемы с анализом данных. Пожалуйста, попробуйте еще раз."
        : "I'm having trouble analyzing the data right now. Please try again.";
      
      return {
        answer: errorMessage,
        data: {},
        confidence: 0.0,
        detectedLanguage: detectedLanguage === 'unknown' ? 'en' : detectedLanguage
      };
    }
  }

  private getSystemPrompt(language: 'en' | 'ru' | 'unknown'): string {
    if (language === 'ru') {
      return `Вы - семейный ИИ-аналитик для системы управления семейными задачами. Анализируйте семейные данные и отвечайте на вопросы пользователя с insights и рекомендациями НА РУССКОМ ЯЗЫКЕ.

Ключевые принципы:
- Отвечайте ТОЛЬКО на русском языке
- Будьте позитивными и поддерживающими
- Фокусируйтесь на семейных ценностях
- Используйте конкретные числа и проценты
- Сравнивайте членов семьи справедливо и конструктивно
- Поощряйте хорошее поведение
- Давайте практические советы

КРИТИЧЕСКИ ВАЖНО: Отвечайте в формате JSON ТОЛЬКО с полями: answer (форматированный текст), data (пустой объект), confidence. НЕ включайте сырые объекты или массивы в поле answer - форматируйте все данные как читаемый текст с маркерами и переносами строк.`;
    }
    
    return `You are a family task analytics AI assistant for a family task management system. Analyze family data and answer user questions with insights and recommendations IN ENGLISH.

Key principles:
- Respond ONLY in English
- Be positive and encouraging
- Focus on family values
- Use specific numbers and percentages
- Compare family members fairly and constructively
- Encourage good behavior
- Provide actionable advice

CRITICAL: Respond in JSON format ONLY with fields: answer (formatted text), data (empty object), confidence. Do NOT include raw objects or arrays in the answer field - format all data as readable text with bullet points and line breaks.`;
  }

  private buildAnalyticsPrompt(query: AnalyticsQuery, familyContext: FamilyContext, language: 'en' | 'ru' | 'unknown'): string {
    const familyMembers = familyContext.members.map(m => ({
      name: m.name,
      role: m.role,
      id: m.id
    }));

    const activeTasks = familyContext.activeTasks;
    const completionHistory = familyContext.completionHistory;
    const pointsData = familyContext.pointsData;

    // Calculate basic metrics
    const totalActiveTasks = activeTasks.length;
    const completedTasks = completionHistory.length;
    const overdueTasks = activeTasks.filter(task => isTaskOverdue(new Date(task.dueDate))).length;
    
    // Per-member statistics
    const memberStats = familyMembers.map(member => {
      const memberActiveTasks = activeTasks.filter(task => task.assignedTo === member.id);
      const memberCompletions = completionHistory.filter(task => task.assignedTo === member.id);
      const memberPoints = pointsData.filter(p => p.userId === member.id);
      const totalPoints = memberPoints.reduce((sum, p) => sum + p.amount, 0);

      return {
        name: member.name,
        role: member.role,
        activeTasks: memberActiveTasks.length,
        completedTasks: memberCompletions.length,
        totalPoints,
        averagePoints: memberCompletions.length > 0 ? totalPoints / memberCompletions.length : 0,
        overdueTasks: memberActiveTasks.filter(task => isTaskOverdue(new Date(task.dueDate))).length,
        completionRate: (memberActiveTasks.length + memberCompletions.length) > 0 
          ? memberCompletions.length / (memberActiveTasks.length + memberCompletions.length) 
          : 0
      };
    });

    if (language === 'ru') {
      return `АНАЛИЗ СЕМЕЙНЫХ ДАННЫХ:

Члены семьи: ${JSON.stringify(familyMembers, null, 2)}
Всего активных задач: ${totalActiveTasks}
Выполненных задач (недавно): ${completedTasks}
Просроченных задач: ${overdueTasks}

СТАТИСТИКА ПО ЧЛЕНАМ СЕМЬИ:
${JSON.stringify(memberStats, null, 2)}

НЕДАВНИЕ ВЫПОЛНЕННЫЕ ЗАДАЧИ:
${JSON.stringify(completionHistory.slice(-10), null, 2)}

АКТИВНЫЕ ЗАДАЧИ:
${JSON.stringify(activeTasks, null, 2)}

ДАННЫЕ О БАЛЛАХ:
${JSON.stringify(pointsData.slice(-20), null, 2)}

ВОПРОС ПОЛЬЗОВАТЕЛЯ: "${query.question}"
${query.timeframe ? `ВРЕМЕННЫЕ РАМКИ: ${query.timeframe}` : ''}
${query.targetMember ? `ФОКУС НА: ${query.targetMember}` : ''}

ИНСТРУКЦИИ ПО АНАЛИЗУ:
1. Ответьте на конкретный вопрос пользователя прямо на РУССКОМ языке
2. Предоставьте релевантные метрики и insights
3. Включите практические рекомендации
4. Предложите визуализацию данных если полезно
5. Будьте поощрительными и семейно-ориентированными
6. Используйте конкретные числа и проценты
7. Сравнивайте членов семьи справедливо и конструктивно
8. ВАЖНО: НЕ включайте объекты или JSON в ответ - только форматированный текст!

ФОРМАТ ОТВЕТА (JSON):
{
  "answer": "Ключевые метрики:\nKid1:\n• Выполнено задач: 8\n• Заработано баллов: 33\n• Активных задач: 3\n\nErik:\n• Выполнено задач: 2\n• Заработано баллов: 13\n• Активных задач: 1\n\n💡 Инсайты:\nОстальной анализ...",
  "data": {},
  "confidence": 0.9
}

ПРИМЕРЫ ФОРМАТИРОВАННЫХ ОТВЕТОВ:
- "Эрик выполнил 8 из 10 задач на этой неделе (80% выполнения)"
- "У Сары серия из 5 дней подряд выполненных задач!"
- "Семья выполнила 85% задач на этой неделе, что больше чем 70% на прошлой неделе"
- "Джонни трудно даются задачи в будни - стоит перенести некоторые на выходные"`;
    }

    return `FAMILY DATA ANALYSIS:

Family Members: ${JSON.stringify(familyMembers, null, 2)}
Total Active Tasks: ${totalActiveTasks}
Completed Tasks (recent): ${completedTasks}
Overdue Tasks: ${overdueTasks}

MEMBER STATISTICS:
${JSON.stringify(memberStats, null, 2)}

RECENT TASK COMPLETIONS:
${JSON.stringify(completionHistory.slice(-10), null, 2)}

ACTIVE TASKS:
${JSON.stringify(activeTasks, null, 2)}

POINTS DATA:
${JSON.stringify(pointsData.slice(-20), null, 2)}

USER QUESTION: "${query.question}"
${query.timeframe ? `TIMEFRAME: ${query.timeframe}` : ''}
${query.targetMember ? `FOCUS ON: ${query.targetMember}` : ''}

ANALYSIS INSTRUCTIONS:
1. Answer the user's specific question directly in ENGLISH
2. Provide relevant metrics and insights
3. Include actionable recommendations
4. Suggest data visualizations if helpful
5. Be encouraging and family-focused
6. Use specific numbers and percentages
7. Compare family members fairly and constructively
8. IMPORTANT: Do NOT include objects or JSON in response - only formatted text!

RESPONSE FORMAT (JSON):
{
  "answer": "Key Metrics:\nKid1:\n• Tasks completed: 8\n• Points earned: 33\n• Active tasks: 3\n\nErik:\n• Tasks completed: 2\n• Points earned: 13\n• Active tasks: 1\n\n💡 Insights:\nRest of analysis...",
  "data": {},
  "confidence": 0.9
}

EXAMPLE FORMATTED RESPONSES:
- "Erik completed 8 out of 10 tasks this week (80% completion rate)"
- "Sarah has been on a 5-day completion streak!"
- "The family completed 85% of tasks this week, up from 70% last week"
- "Johnny seems to struggle with chores on weekdays - consider moving some to weekends"`;
  }

  private parseAnalyticsResponse(response: string): AnalyticsResponse {
    try {
      // Clean up the response to extract JSON and remove control characters
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in analytics response');
      }

      // Clean control characters that can break JSON parsing
      const cleanedJson = jsonMatch[0]
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .replace(/\n/g, '\\n') // Escape remaining newlines
        .replace(/\r/g, '\\r') // Escape carriage returns
        .replace(/\t/g, '\\t'); // Escape tabs

      const parsed = JSON.parse(cleanedJson) as {
        answer: string;
        data?: any;
        confidence?: number;
      };

      return {
        answer: parsed.answer || "I couldn't analyze that data.",
        data: parsed.data || {},
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
      };
    } catch (error) {
      console.error('Error parsing analytics response:', error);
      throw error; // Re-throw to trigger retry if needed
    }
  }

  // Quick data retrieval without AI processing
  getQuickStats(familyContext: FamilyContext): {
    totalActiveTasks: number;
    overdueTasks: number;
    completedThisWeek: number;
    topPerformer: string | null;
    familyPoints: number;
  } {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const activeTasks = familyContext.activeTasks;
    const completionHistory = familyContext.completionHistory;
    const pointsData = familyContext.pointsData;

    const overdueTasks = activeTasks.filter(task => isTaskOverdue(new Date(task.dueDate))).length;
    const completedThisWeek = completionHistory.filter(task => 
      new Date(task.updatedAt || task.createdAt) >= oneWeekAgo
    ).length;

    // Find top performer by completion rate
    const memberPerformance = familyContext.members
      .filter(m => m.role === 'CHILD')
      .map(member => {
        const memberCompletions = completionHistory.filter(task => task.assignedTo === member.id);
        const memberActive = activeTasks.filter(task => task.assignedTo === member.id);
        const total = memberCompletions.length + memberActive.length;
        const rate = total > 0 ? memberCompletions.length / total : 0;
        return { name: member.name, rate };
      })
      .sort((a, b) => b.rate - a.rate);

    const topPerformer = memberPerformance.length > 0 ? memberPerformance[0].name : null;
    const familyPoints = pointsData.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalActiveTasks: activeTasks.length,
      overdueTasks,
      completedThisWeek,
      topPerformer,
      familyPoints
    };
  }
}