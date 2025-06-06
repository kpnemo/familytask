import Anthropic from '@anthropic-ai/sdk';
import { FamilyContext } from '../mcp/family-context';
import { isTaskOverdue } from '../utils';

export interface AnalyticsQuery {
  question: string;
  timeframe?: string;
  targetMember?: string;
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
}

export class AnalyticsEngine {
  private anthropic: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyzeFamily(
    query: AnalyticsQuery,
    familyContext: FamilyContext,
    retryCount: number = 0
  ): Promise<AnalyticsResponse> {
    try {
      const prompt = this.buildAnalyticsPrompt(query, familyContext);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from AI');
      }

      return this.parseAnalyticsResponse(content.text);
    } catch (error) {
      console.error(`Error analyzing family data (attempt ${retryCount + 1}):`, error);
      
      // Retry once if this is the first attempt and the error is parsing-related
      if (retryCount === 0 && (error instanceof SyntaxError || error.message.includes('JSON'))) {
        console.log('Retrying analytics request due to parsing error...');
        return this.analyzeFamily(query, familyContext, 1);
      }
      
      return {
        answer: "I'm having trouble analyzing the data right now. Please try again.",
        data: {},
        confidence: 0.0
      };
    }
  }

  private buildAnalyticsPrompt(query: AnalyticsQuery, familyContext: FamilyContext): string {
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

    return `You are a family task analytics AI. Analyze the family data and answer the user's question with insights and recommendations.

FAMILY DATA SUMMARY:
- Family Members: ${JSON.stringify(familyMembers, null, 2)}
- Total Active Tasks: ${totalActiveTasks}
- Completed Tasks (recent): ${completedTasks}
- Overdue Tasks: ${overdueTasks}

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
1. Answer the user's specific question directly
2. Provide relevant metrics and insights
3. Include actionable recommendations
4. Suggest data visualizations if helpful
5. Be encouraging and family-focused
6. Use specific numbers and percentages
7. Compare family members fairly and constructively

EXAMPLE RESPONSES:
- "Erik completed 8 out of 10 tasks this week (80% completion rate)"
- "Sarah has been on a 5-day completion streak!"
- "The family completed 85% of tasks this week, up from 70% last week"
- "Johnny seems to struggle with chores on weekdays - consider moving some to weekends"

OUTPUT FORMAT (JSON only, no line breaks in strings):
{
  "answer": "Direct answer to the user's question with specific insights",
  "data": {
    "metrics": {
      "completionRate": 0.85,
      "totalTasks": 25,
      "familyPoints": 150
    },
    "insights": [
      "Erik has the highest completion rate at 90%",
      "Weekend tasks are completed more often than weekday tasks"
    ],
    "recommendations": [
      "Consider giving Erik more challenging tasks",
      "Move some weekday chores to weekends"
    ],
    "charts": [
      {
        "type": "bar",
        "title": "Completion Rate by Child",
        "data": [
          {"name": "Erik", "value": 90},
          {"name": "Sarah", "value": 75}
        ]
      }
    ]
  },
  "confidence": 0.9
}

IMPORTANT: Use only valid JSON characters. No line breaks, tabs, or control characters inside string values.`;
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