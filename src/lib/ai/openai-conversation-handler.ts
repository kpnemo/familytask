import { FamilyContext } from '../mcp/family-context';
import { OpenAIConversationRouter, ConversationIntent } from './openai-conversation-router';
import { OpenAITaskParser } from './openai-task-parser';
import { OpenAIAnalyticsEngine, AnalyticsQuery } from './openai-analytics-engine';
import { ParsedTask, ClarificationQuestion } from '@/types/ai';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: ConversationIntent;
  language?: string;
  data?: {
    tasks?: ParsedTask[];
    analytics?: any;
    clarificationQuestions?: ClarificationQuestion[];
  };
}

export interface ConversationResponse {
  message: string;
  intent: ConversationIntent;
  language: string;
  data?: {
    tasks?: ParsedTask[];
    analytics?: any;
    clarificationQuestions?: ClarificationQuestion[];
    quickStats?: any;
  };
  followUpActions?: string[];
  confidence: number;
}

export class OpenAIConversationHandler {
  private router: OpenAIConversationRouter;
  private taskParser: OpenAITaskParser;
  private analyticsEngine: OpenAIAnalyticsEngine;

  constructor() {
    this.router = new OpenAIConversationRouter();
    this.taskParser = new OpenAITaskParser();
    this.analyticsEngine = new OpenAIAnalyticsEngine();
  }

  async handleConversation(
    userInput: string,
    familyContext: FamilyContext,
    conversationHistory: ConversationMessage[] = []
  ): Promise<ConversationResponse> {
    try {
      // Step 1: Analyze user intent with language detection
      const recentHistory = conversationHistory.slice(-5).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const intentAnalysis = await this.router.analyzeIntent(
        userInput, 
        familyContext, 
        recentHistory
      );

      console.log('Intent analysis:', intentAnalysis);

      // Step 2: Route to appropriate handler based on intent
      switch (intentAnalysis.intent) {
        case 'CREATE_TASKS':
          return await this.handleTaskCreation(userInput, familyContext, intentAnalysis.detectedLanguage || 'en', conversationHistory);

        case 'ANALYZE_DATA':
          return await this.handleDataAnalysis(userInput, familyContext, intentAnalysis.detectedLanguage || 'en');

        case 'QUERY_TASKS':
          return await this.handleTaskQuery(userInput, familyContext, intentAnalysis.detectedLanguage || 'en');

        case 'GENERAL_CHAT':
          return await this.handleGeneralChat(userInput, familyContext, intentAnalysis.detectedLanguage || 'en');

        case 'CLARIFICATION':
        default:
          return await this.handleClarification(userInput, familyContext, intentAnalysis.detectedLanguage || 'en');
      }

    } catch (error) {
      console.error('Error in conversation handling:', error);
      
      // Detect language for error message
      const language = this.detectLanguage(userInput);
      const errorMessage = language === 'ru' 
        ? "Извините, произошла ошибка. Пожалуйста, попробуйте еще раз."
        : "Sorry, there was an error. Please try again.";

      return {
        message: errorMessage,
        intent: 'GENERAL_CHAT',
        language,
        confidence: 0.0
      };
    }
  }

  private detectLanguage(text: string): string {
    const cyrillicPattern = /[\u0400-\u04FF]/;
    return cyrillicPattern.test(text) ? 'ru' : 'en';
  }

  private async handleTaskCreation(
    userInput: string, 
    familyContext: FamilyContext, 
    language: string,
    conversationHistory: ConversationMessage[] = []
  ): Promise<ConversationResponse> {
    try {
      // Convert conversation history to format expected by task parser
      const recentHistory = conversationHistory.slice(-3).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const parseResult = await this.taskParser.parseNaturalLanguage(
        userInput, 
        familyContext,
        undefined, // targetDate
        undefined, // defaultPoints
        recentHistory
      );

      if (parseResult.clarificationQuestions.length > 0) {
        const message = language === 'ru'
          ? `Я понял, что вы хотите создать задачи, но мне нужны уточнения:`
          : `I understand you want to create tasks, but I need some clarification:`;

        return {
          message,
          intent: 'CLARIFICATION',
          language,
          data: {
            clarificationQuestions: parseResult.clarificationQuestions
          },
          confidence: 0.8
        };
      }

      if (parseResult.parsedTasks.length === 0) {
        const message = language === 'ru'
          ? "Я не смог извлечь задачи из вашего сообщения. Можете ли вы быть более конкретными?"
          : "I couldn't extract any tasks from your message. Could you be more specific?";

        return {
          message,
          intent: 'CLARIFICATION',
          language,
          confidence: 0.3
        };
      }

      // Success response
      const taskCount = parseResult.parsedTasks.length;
      const message = language === 'ru'
        ? `Отлично! Я создал ${taskCount} ${taskCount === 1 ? 'задачу' : taskCount < 5 ? 'задачи' : 'задач'} для вашей семьи.`
        : `Great! I've created ${taskCount} task${taskCount === 1 ? '' : 's'} for your family.`;

      const followUpActions = language === 'ru' 
        ? [
          "Просмотреть созданные задачи",
          "Создать еще задачи",
          "Посмотреть семейную статистику"
        ]
        : [
          "View created tasks",
          "Create more tasks", 
          "Check family stats"
        ];

      // Transform tasks to frontend format with assignee names instead of IDs
      const transformedTasks = parseResult.parsedTasks.map(task => {
        const assigneeMember = task.assignedTo 
          ? familyContext.members.find(m => m.id === task.assignedTo)
          : null;

        return {
          title: task.title,
          description: task.description || '',
          suggestedAssignee: assigneeMember ? assigneeMember.name : (task.isBonusTask ? '' : 'Unknown'),
          suggestedPoints: task.points,
          suggestedDueDate: task.dueDate,
          isRecurring: task.isRecurring || false,
          recurrencePattern: task.recurrencePattern || null,
          isBonusTask: task.isBonusTask || false,
          dueDateOnly: task.dueDateOnly || false,
          confidence: task.confidence || 0.8
        };
      });

      return {
        message,
        intent: 'CREATE_TASKS',
        language,
        data: {
          tasks: transformedTasks
        },
        followUpActions,
        confidence: 0.9
      };

    } catch (error) {
      console.error('Error in task creation:', error);
      
      const message = language === 'ru'
        ? "Извините, не удалось создать задачи. Попробуйте еще раз."
        : "Sorry, I couldn't create the tasks. Please try again.";

      return {
        message,
        intent: 'CREATE_TASKS',
        language,
        confidence: 0.0
      };
    }
  }

  private async handleDataAnalysis(
    userInput: string, 
    familyContext: FamilyContext, 
    language: string
  ): Promise<ConversationResponse> {
    try {
      const analyticsQuery: AnalyticsQuery = {
        question: userInput,
        language: language as 'en' | 'ru'
      };

      const analyticsResult = await this.analyticsEngine.analyzeFamily(
        analyticsQuery, 
        familyContext
      );

      const quickStats = this.analyticsEngine.getQuickStats(familyContext);

      const followUpActions = language === 'ru'
        ? [
          "Посмотреть подробную статистику",
          "Создать новые задачи",
          "Проверить просроченные задачи"
        ]
        : [
          "View detailed statistics",
          "Create new tasks",
          "Check overdue tasks"
        ];

      return {
        message: analyticsResult.answer,
        intent: 'ANALYZE_DATA',
        language,
        data: {
          analytics: analyticsResult.data,
          quickStats
        },
        followUpActions,
        confidence: analyticsResult.confidence
      };

    } catch (error) {
      console.error('Error in data analysis:', error);
      
      const message = language === 'ru'
        ? "Извините, не удалось проанализировать данные. Попробуйте переформулировать ваш вопрос."
        : "Sorry, I couldn't analyze the data. Please try rephrasing your question.";

      return {
        message,
        intent: 'ANALYZE_DATA',
        language,
        confidence: 0.0
      };
    }
  }

  private async handleTaskQuery(
    userInput: string, 
    familyContext: FamilyContext, 
    language: string
  ): Promise<ConversationResponse> {
    try {
      const quickStats = this.analyticsEngine.getQuickStats(familyContext);
      
      // Basic task information
      const { activeTasks, completionHistory } = familyContext;
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = activeTasks.filter(task => {
        const taskDate = task.dueDate instanceof Date 
          ? task.dueDate.toISOString().split('T')[0]
          : new Date(task.dueDate).toISOString().split('T')[0];
        return taskDate === today;
      });

      let message: string;
      if (language === 'ru') {
        message = `📋 Вот краткий обзор задач:

• Всего активных задач: ${quickStats.totalActiveTasks}
• Задач на сегодня: ${todayTasks.length}
• Просроченных задач: ${quickStats.overdueTasks}
• Выполнено на этой неделе: ${quickStats.completedThisWeek}
${quickStats.topPerformer ? `• Лучший исполнитель: ${quickStats.topPerformer}` : ''}

Нужна более подробная информация?`;
      } else {
        message = `📋 Here's a quick overview of your tasks:

• Total active tasks: ${quickStats.totalActiveTasks}
• Tasks for today: ${todayTasks.length}
• Overdue tasks: ${quickStats.overdueTasks}
• Completed this week: ${quickStats.completedThisWeek}
${quickStats.topPerformer ? `• Top performer: ${quickStats.topPerformer}` : ''}

Need more detailed information?`;
      }

      const followUpActions = language === 'ru'
        ? [
          "Показать задачи на сегодня",
          "Показать просроченные задачи", 
          "Создать новую задачу"
        ]
        : [
          "Show today's tasks",
          "Show overdue tasks",
          "Create new task"
        ];

      return {
        message,
        intent: 'QUERY_TASKS',
        language,
        data: {
          quickStats
        },
        followUpActions,
        confidence: 0.8
      };

    } catch (error) {
      console.error('Error in task query:', error);
      
      const message = language === 'ru'
        ? "Извините, не удалось получить информацию о задачах."
        : "Sorry, I couldn't retrieve task information.";

      return {
        message,
        intent: 'QUERY_TASKS',
        language,
        confidence: 0.0
      };
    }
  }

  private async handleGeneralChat(
    userInput: string, 
    familyContext: FamilyContext, 
    language: string
  ): Promise<ConversationResponse> {
    const input = userInput.toLowerCase();
    
    let message: string;
    let followUpActions: string[];

    if (language === 'ru') {
      if (input.includes('привет') || input.includes('здравствуй')) {
        message = "Привет! Я ваш семейный ИИ-помощник. Я могу помочь создать задачи, проанализировать прогресс семьи или ответить на вопросы о задачах. Чем могу помочь?";
      } else if (input.includes('спасибо')) {
        message = "Пожалуйста! Всегда рад помочь вашей семье. Есть еще что-то, с чем я могу помочь?";
      } else if (input.includes('пока') || input.includes('до свидания')) {
        message = "До свидания! Удачи с выполнением задач!";
      } else {
        message = "Я здесь, чтобы помочь с управлением семейными задачами. Могу создать задачи, показать статистику или ответить на вопросы. Что вас интересует?";
      }
      
      followUpActions = [
        "Создать новые задачи",
        "Посмотреть статистику семьи",
        "Проверить сегодняшние задачи"
      ];
    } else {
      if (input.includes('hello') || input.includes('hi')) {
        message = "Hello! I'm your family AI assistant. I can help create tasks, analyze family progress, or answer questions about tasks. How can I help you?";
      } else if (input.includes('thank')) {
        message = "You're welcome! I'm always happy to help your family. Is there anything else I can assist with?";
      } else if (input.includes('bye') || input.includes('goodbye')) {
        message = "Goodbye! Good luck with your tasks!";
      } else {
        message = "I'm here to help with family task management. I can create tasks, show statistics, or answer questions. What would you like to know?";
      }
      
      followUpActions = [
        "Create new tasks",
        "Check family stats",
        "View today's tasks"
      ];
    }

    return {
      message,
      intent: 'GENERAL_CHAT',
      language,
      followUpActions,
      confidence: 0.9
    };
  }

  private async handleClarification(
    userInput: string, 
    familyContext: FamilyContext, 
    language: string
  ): Promise<ConversationResponse> {
    const message = language === 'ru'
      ? `Извините, я не совсем понял ваш запрос. Я могу помочь с:

• Созданием задач (например: "завтра Саша убери комнату")
• Анализом семейной статистики (например: "как дела у детей?")
• Информацией о задачах (например: "что нужно сделать сегодня?")

Попробуйте переформулировать ваш запрос.`
      : `Sorry, I didn't quite understand your request. I can help with:

• Creating tasks (e.g., "tomorrow Sarah clean room")
• Analyzing family statistics (e.g., "how are the kids doing?")
• Task information (e.g., "what needs to be done today?")

Please try rephrasing your request.`;

    const followUpActions = language === 'ru'
      ? [
        "Создать задачу",
        "Посмотреть статистику",
        "Показать сегодняшние задачи"
      ]
      : [
        "Create a task",
        "View statistics", 
        "Show today's tasks"
      ];

    return {
      message,
      intent: 'CLARIFICATION',
      language,
      followUpActions,
      confidence: 0.5
    };
  }
}