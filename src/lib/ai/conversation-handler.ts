import { FamilyContext } from '../mcp/family-context';
import { ConversationRouter, ConversationIntent } from './conversation-router';
import { TaskParser } from './task-parser';
import { AnalyticsEngine, AnalyticsQuery } from './analytics-engine';
import { ParsedTask, ClarificationQuestion } from '@/types/ai';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: ConversationIntent;
  data?: {
    tasks?: ParsedTask[];
    analytics?: any;
    clarificationQuestions?: ClarificationQuestion[];
  };
}

export interface ConversationResponse {
  message: string;
  intent: ConversationIntent;
  data?: {
    tasks?: ParsedTask[];
    analytics?: any;
    clarificationQuestions?: ClarificationQuestion[];
    quickStats?: any;
  };
  followUpActions?: string[];
  confidence: number;
}

export class ConversationHandler {
  private router: ConversationRouter;
  private taskParser: TaskParser;
  private analyticsEngine: AnalyticsEngine;

  constructor() {
    this.router = new ConversationRouter();
    this.taskParser = new TaskParser();
    this.analyticsEngine = new AnalyticsEngine();
  }

  async handleConversation(
    userInput: string,
    familyContext: FamilyContext,
    conversationHistory: ConversationMessage[] = []
  ): Promise<ConversationResponse> {
    try {
      // Step 1: Analyze user intent
      const intentAnalysis = await this.router.analyzeIntent(
        userInput, 
        familyContext, 
        conversationHistory.slice(-4) // Last 4 messages for context
      );

      console.log(`Intent analysis: ${intentAnalysis.intent} (${intentAnalysis.confidence})`);

      // Step 2: Route to appropriate handler based on intent
      switch (intentAnalysis.intent) {
        case 'CREATE_TASKS':
          return await this.handleTaskCreation(userInput, familyContext, intentAnalysis);

        case 'ANALYZE_DATA':
        case 'QUERY_TASKS':
          return await this.handleDataAnalysis(userInput, familyContext, intentAnalysis);

        case 'CLARIFICATION':
          return await this.handleClarification(userInput, familyContext, intentAnalysis);

        case 'GENERAL_CHAT':
          return await this.handleGeneralChat(userInput, familyContext, intentAnalysis);

        default:
          return await this.handleClarification(userInput, familyContext, intentAnalysis);
      }
    } catch (error) {
      console.error('Error in conversation handler:', error);
      return {
        message: "I'm having trouble understanding that. Could you try asking in a different way?",
        intent: 'CLARIFICATION',
        confidence: 0.0
      };
    }
  }

  private async handleTaskCreation(
    userInput: string,
    familyContext: FamilyContext,
    intentAnalysis: any
  ): Promise<ConversationResponse> {
    try {
      const result = await this.taskParser.parseNaturalLanguage(
        userInput,
        familyContext
      );

      const tasksCount = result.parsedTasks.length;
      const hasQuestions = result.clarificationQuestions.length > 0;

      let message = '';
      if (tasksCount > 0) {
        message = `Great! I found ${tasksCount} task${tasksCount > 1 ? 's' : ''} from your message. `;
        
        if (hasQuestions) {
          message += `I have a few questions to make sure I get the details right.`;
        } else {
          message += `The tasks look ready to create! Review them below and click "Create Tasks" when you're satisfied.`;
        }
      } else {
        message = `I couldn't find any clear tasks in your message. Could you try being more specific? For example: "Tomorrow Johnny needs to clean his room and do homework"`;
      }

      return {
        message,
        intent: 'CREATE_TASKS',
        data: {
          tasks: result.parsedTasks,
          clarificationQuestions: result.clarificationQuestions
        },
        confidence: intentAnalysis.confidence,
        followUpActions: hasQuestions 
          ? ['Answer clarification questions', 'Edit tasks manually', 'Create tasks as-is']
          : ['Review and create tasks', 'Edit tasks', 'Cancel']
      };
    } catch (error) {
      console.error('Error in task creation:', error);
      return {
        message: "I had trouble parsing those tasks. Could you try describing them one at a time?",
        intent: 'CREATE_TASKS',
        confidence: 0.3
      };
    }
  }

  private async handleDataAnalysis(
    userInput: string,
    familyContext: FamilyContext,
    intentAnalysis: any
  ): Promise<ConversationResponse> {
    try {
      // Extract query parameters
      const query: AnalyticsQuery = {
        question: userInput,
        timeframe: this.extractTimeframe(userInput),
        targetMember: this.extractTargetMember(userInput, familyContext)
      };

      // Get quick stats for immediate display
      const quickStats = this.analyticsEngine.getQuickStats(familyContext);

      // Get detailed AI analysis
      const analytics = await this.analyticsEngine.analyzeFamily(query, familyContext);

      return {
        message: analytics.answer,
        intent: intentAnalysis.intent,
        data: {
          analytics: analytics.data,
          quickStats
        },
        confidence: Math.min(intentAnalysis.confidence, analytics.confidence),
        followUpActions: [
          'Ask for more details',
          'Get recommendations',
          'View charts',
          'Check specific member'
        ]
      };
    } catch (error) {
      console.error('Error in data analysis:', error);
      return {
        message: "I had trouble analyzing that data. Could you try asking about something specific, like 'How is Erik doing this week?'",
        intent: 'ANALYZE_DATA',
        confidence: 0.3
      };
    }
  }

  private async handleClarification(
    userInput: string,
    familyContext: FamilyContext,
    intentAnalysis: any
  ): Promise<ConversationResponse> {
    const familyMemberNames = familyContext.members
      .filter(m => m.role === 'CHILD')
      .map(m => m.name)
      .join(', ');

    const quickStats = this.analyticsEngine.getQuickStats(familyContext);
    
    const capabilities = [
      "📝 **Create tasks**: Say things like 'Tomorrow Johnny needs to clean his room'",
      "📊 **Check progress**: Ask 'How is Erik doing this week?' or 'Show me family stats'",
      "🔍 **Check tasks**: Ask 'What tasks does Sarah have?' or 'What's overdue?'",
      "🎯 **Get insights**: Ask 'Who needs more encouragement?' or 'How are we doing?'"
    ];

    const contextInfo = quickStats.totalActiveTasks > 0 
      ? `\n\n**Current status**: ${quickStats.totalActiveTasks} active tasks, ${quickStats.overdueTasks} overdue${quickStats.topPerformer ? `, ${quickStats.topPerformer} is doing great!` : ''}`
      : '';

    const message = `Hi! I'm your AI assistant for family tasks. I can help you with:

${capabilities.join('\n')}

**Your family**: ${familyMemberNames}${contextInfo}

What would you like me to help you with?`;

    return {
      message,
      intent: 'CLARIFICATION',
      data: { quickStats },
      confidence: intentAnalysis.confidence,
      followUpActions: [
        'Create new tasks',
        'Check family progress', 
        'View task status',
        'Get recommendations'
      ]
    };
  }

  private async handleGeneralChat(
    userInput: string,
    familyContext: FamilyContext,
    intentAnalysis: any
  ): Promise<ConversationResponse> {
    const message = "I'm focused on helping with family tasks! I can help you create tasks, check progress, or analyze how everyone's doing. What would you like to work on?";

    return {
      message,
      intent: 'GENERAL_CHAT',
      confidence: intentAnalysis.confidence,
      followUpActions: [
        'Create tasks',
        'Check progress',
        'Get family insights'
      ]
    };
  }

  private extractTimeframe(input: string): string | undefined {
    const timeframes = [
      { patterns: ['today', 'this day'], value: 'today' },
      { patterns: ['yesterday'], value: 'yesterday' },
      { patterns: ['this week', 'week'], value: 'this_week' },
      { patterns: ['last week'], value: 'last_week' },
      { patterns: ['this month', 'month'], value: 'this_month' },
      { patterns: ['last month'], value: 'last_month' },
      { patterns: ['last 3 days', 'past 3 days'], value: 'last_3_days' },
      { patterns: ['last 7 days', 'past week'], value: 'last_7_days' },
    ];

    const lowerInput = input.toLowerCase();
    for (const timeframe of timeframes) {
      if (timeframe.patterns.some(pattern => lowerInput.includes(pattern))) {
        return timeframe.value;
      }
    }
    return undefined;
  }

  private extractTargetMember(input: string, familyContext: FamilyContext): string | undefined {
    const lowerInput = input.toLowerCase();
    
    for (const member of familyContext.members) {
      if (lowerInput.includes(member.name.toLowerCase())) {
        return member.name;
      }
    }
    return undefined;
  }
}