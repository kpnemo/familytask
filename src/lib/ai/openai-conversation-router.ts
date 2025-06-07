import OpenAI from 'openai';
import { FamilyContext } from '../mcp/family-context';

export type ConversationIntent = 
  | 'CREATE_TASKS'     // User wants to create new tasks
  | 'ANALYZE_DATA'     // User wants insights/analytics
  | 'QUERY_TASKS'      // User wants to check existing tasks
  | 'CLARIFICATION'    // Need more info to determine intent
  | 'GENERAL_CHAT';    // General conversation

export interface ConversationAnalysis {
  intent: ConversationIntent;
  confidence: number;
  reasoning: string;
  suggestedAction: string;
  detectedLanguage?: string;
}

export class OpenAIConversationRouter {
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
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const hasRussian = cyrillicPattern.test(text);
    
    // Russian conversation patterns
    const russianPatterns = /\b(как дела|что происходит|покажи|расскажи|сделать|создать|анализ|статистика|задач[аеиоуыэяё]|семь[яеёю]|дом[ауе]|ребен[окк]|баллов?|очков?)\b/i;
    
    if (hasRussian || russianPatterns.test(text)) {
      return 'ru';
    }
    
    // English conversation patterns
    const englishPatterns = /\b(how|what|show|tell|create|make|analysis|stats|task|family|home|child|point)\b/i;
    
    if (englishPatterns.test(text)) {
      return 'en';
    }
    
    return 'unknown';
  }

  private getSystemPrompt(language: 'en' | 'ru' | 'unknown'): string {
    if (language === 'ru') {
      return `Вы - эксперт ИИ по анализу намерений в системе управления семейными задачами. Анализируйте сообщения пользователей на русском языке и определяйте их намерения.

ТИПЫ НАМЕРЕНИЙ:
1. CREATE_TASKS - пользователь хочет создать новые задачи
   Примеры: "завтра Саша убери комнату", "создай задачу помыть посуду", "Пете сделать домашку"

2. ANALYZE_DATA - пользователь хочет получить аналитику и insights
   Примеры: "как дела у детей?", "покажи статистику", "кто лучше всех выполняет задачи?"

3. QUERY_TASKS - пользователь хочет узнать о существующих задачах
   Примеры: "какие задачи на сегодня?", "что нужно сделать?", "покажи просроченные задачи"

4. CLARIFICATION - нужна дополнительная информация
   Примеры: неясные или двусмысленные сообщения

5. GENERAL_CHAT - общий разговор
   Примеры: "привет", "как дела?", "спасибо"

Ответьте в формате JSON с полями: intent, confidence, reasoning, suggestedAction.`;
    }
    
    return `You are an expert AI intent analyzer for a family task management system. Analyze user messages in English and determine their intentions.

INTENT TYPES:
1. CREATE_TASKS - user wants to create new tasks
   Examples: "tomorrow Sarah clean room", "create task wash dishes", "Peter do homework"

2. ANALYZE_DATA - user wants analytics and insights
   Examples: "how are the kids doing?", "show me stats", "who's performing best?"

3. QUERY_TASKS - user wants to check existing tasks
   Examples: "what tasks for today?", "what needs to be done?", "show overdue tasks"

4. CLARIFICATION - need more information
   Examples: unclear or ambiguous messages

5. GENERAL_CHAT - general conversation
   Examples: "hello", "how are you?", "thank you"

Respond in JSON format with fields: intent, confidence, reasoning, suggestedAction.`;
  }

  async analyzeIntent(
    userInput: string, 
    familyContext: FamilyContext,
    conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>,
    retryCount: number = 0
  ): Promise<ConversationAnalysis> {
    try {
      // Detect language
      const detectedLanguage = this.detectLanguage(userInput);
      
      const prompt = this.buildIntentPrompt(userInput, familyContext, conversationHistory, detectedLanguage);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Latest model for best intent understanding
        max_tokens: 500,
        temperature: 0.1, // Low temperature for consistent analysis
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

      const result = this.parseIntentResponse(content);
      return {
        ...result,
        detectedLanguage: detectedLanguage === 'unknown' ? 'en' : detectedLanguage
      };
    } catch (error) {
      console.error(`Error analyzing intent (attempt ${retryCount + 1}):`, error);
      
      // Retry once if this is the first attempt
      if (retryCount === 0) {
        console.log('Retrying intent analysis...');
        return this.analyzeIntent(userInput, familyContext, conversationHistory, 1);
      }
      
      // Fallback to simple pattern matching
      return this.fallbackIntentAnalysis(userInput);
    }
  }

  private buildIntentPrompt(
    userInput: string, 
    familyContext: FamilyContext, 
    conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>,
    language: 'en' | 'ru' | 'unknown' = 'en'
  ): string {
    const familyMembers = familyContext.members.map(m => m.name).join(', ');
    
    if (language === 'ru') {
      return `КОНТЕКСТ СЕМЬИ:
Члены семьи: ${familyMembers}
Количество активных задач: ${familyContext.activeTasks.length}
Количество выполненных задач: ${familyContext.completionHistory.length}

${conversationHistory ? `ИСТОРИЯ РАЗГОВОРА:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` : ''}

СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ: "${userInput}"

Проанализируйте намерение пользователя и верните JSON с:
- intent: тип намерения (CREATE_TASKS, ANALYZE_DATA, QUERY_TASKS, CLARIFICATION, GENERAL_CHAT)
- confidence: уверенность от 0.0 до 1.0
- reasoning: объяснение анализа
- suggestedAction: рекомендуемое действие`;
    }

    return `FAMILY CONTEXT:
Family Members: ${familyMembers}
Active Tasks: ${familyContext.activeTasks.length}
Completed Tasks: ${familyContext.completionHistory.length}

${conversationHistory ? `CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` : ''}

USER MESSAGE: "${userInput}"

Analyze the user's intent and return JSON with:
- intent: intent type (CREATE_TASKS, ANALYZE_DATA, QUERY_TASKS, CLARIFICATION, GENERAL_CHAT)
- confidence: confidence from 0.0 to 1.0
- reasoning: explanation of analysis
- suggestedAction: recommended action`;
  }

  private parseIntentResponse(response: string): ConversationAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in intent response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        intent: parsed.intent || 'CLARIFICATION',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || 'Unable to determine intent',
        suggestedAction: parsed.suggestedAction || 'Ask for clarification'
      };
    } catch (error) {
      console.error('Error parsing intent response:', error);
      return this.fallbackIntentAnalysis('');
    }
  }

  private fallbackIntentAnalysis(userInput: string): ConversationAnalysis {
    const input = userInput.toLowerCase();
    
    // Simple pattern matching for fallback
    const createPatterns = /\b(create|make|add|tomorrow|today|task|убрать|сделать|создать|завтра|сегодня|задач)\b/i;
    const analyticsPatterns = /\b(how|stats|analysis|show|report|как дела|статистика|анализ|покажи)\b/i;
    const queryPatterns = /\b(what|which|list|tasks|какие|что|список|задач)\b/i;
    const greetingPatterns = /\b(hi|hello|thanks|bye|привет|спасибо|пока)\b/i;

    if (createPatterns.test(input)) {
      return {
        intent: 'CREATE_TASKS',
        confidence: 0.7,
        reasoning: 'Pattern matching detected task creation keywords',
        suggestedAction: 'Parse as task creation request'
      };
    }
    
    if (analyticsPatterns.test(input)) {
      return {
        intent: 'ANALYZE_DATA',
        confidence: 0.7,
        reasoning: 'Pattern matching detected analytics keywords',
        suggestedAction: 'Provide family analytics'
      };
    }
    
    if (queryPatterns.test(input)) {
      return {
        intent: 'QUERY_TASKS',
        confidence: 0.7,
        reasoning: 'Pattern matching detected task query keywords',
        suggestedAction: 'Show current tasks'
      };
    }
    
    if (greetingPatterns.test(input)) {
      return {
        intent: 'GENERAL_CHAT',
        confidence: 0.8,
        reasoning: 'Pattern matching detected greeting',
        suggestedAction: 'Respond with friendly greeting'
      };
    }

    return {
      intent: 'CLARIFICATION',
      confidence: 0.3,
      reasoning: 'Unable to determine intent from patterns',
      suggestedAction: 'Ask for clarification'
    };
  }
}