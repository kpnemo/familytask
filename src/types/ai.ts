export interface ParsedTask {
  title: string;
  description?: string;
  suggestedPoints: number;
  suggestedAssignee?: string;
  suggestedDueDate: string;
  confidence: number; // 0-1, how confident the AI is in the parsing
  // Task type and options
  isBonusTask?: boolean;
  isRecurring?: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  dueDateOnly?: boolean;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  taskIndex: number;
  field: 'points' | 'assignee' | 'dueDate' | 'description';
  suggestedAnswers?: string[];
}

export interface AIParseTasksRequest {
  input: string;
  targetDate?: string;
  defaultPoints?: number;
}

export interface AIParseTasksResponse {
  success: boolean;
  data?: {
    parsedTasks: ParsedTask[];
    clarificationQuestions?: ClarificationQuestion[];
    sessionId?: string; // For multi-turn clarification
  };
  error?: string;
}

export interface AIClarifyTasksRequest {
  sessionId: string;
  answers: Array<{
    questionId: string;
    answer: string;
  }>;
}

export interface TaskCreationData {
  title: string;
  description?: string;
  points: number;
  dueDate: string;
  assignedTo?: string;
  isBonusTask?: boolean;
}

export interface AIClarifyTasksResponse {
  success: boolean;
  data?: {
    finalizedTasks: TaskCreationData[];
    needsMoreClarification: boolean;
    additionalQuestions?: ClarificationQuestion[];
  };
  error?: string;
}

// Child-specific AI insights
export interface TaskPriority {
  taskId: string;
  priority: number; // 1-10, 10 being highest priority
  reasoning: string;
}

export interface Achievement {
  type: 'streak' | 'points_milestone' | 'task_completion' | 'improvement';
  description: string;
  points: number;
  earnedAt?: string;
}

export interface DailyPlan {
  date: string;
  tasks: Array<{
    taskId: string;
    title: string;
    points: number;
    estimatedTime?: string;
    priority: number;
  }>;
  suggestedFocus: string;
  motivationalMessage: string;
}

export interface AIChildInsightsResponse {
  success: boolean;
  data?: {
    taskPriorities: TaskPriority[];
    motivationalMessage: string;
    achievements: Achievement[];
    weeklyPlan: DailyPlan[];
    streakInfo?: {
      currentStreak: number;
      longestStreak: number;
      streakType: 'daily' | 'weekly';
    };
  };
  error?: string;
}

// Parent-specific AI insights
export interface FamilyAlert {
  type: 'overdue' | 'low_engagement' | 'imbalanced_workload' | 'streak_broken';
  message: string;
  actionable: boolean;
  childId?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ChildInsight {
  childId: string;
  childName: string;
  completionRate: number; // 0-1
  trendDirection: 'improving' | 'declining' | 'stable';
  strengths: string[];
  improvementAreas: string[];
  recommendedActions: string[];
  recentActivity: {
    tasksCompleted: number;
    pointsEarned: number;
    averageCompletionTime: string;
  };
}

export interface WorkloadBalance {
  isBalanced: boolean;
  imbalanceScore: number; // 0-1, 0 being perfectly balanced
  suggestions: string[];
  childWorkloads: Array<{
    childId: string;
    childName: string;
    activeTasks: number;
    totalPoints: number;
    workloadScore: number; // relative to family average
  }>;
}

export interface AIParentInsightsResponse {
  success: boolean;
  data?: {
    familyAnalytics: {
      completionRate: number;
      trendDirection: 'up' | 'down' | 'stable';
      alerts: FamilyAlert[];
      weeklyProgress: {
        tasksCompleted: number;
        tasksAssigned: number;
        pointsAwarded: number;
      };
    };
    childrenInsights: ChildInsight[];
    workloadBalance: WorkloadBalance;
    recommendations: {
      taskAssignment: string[];
      pointAdjustments: string[];
      engagementTips: string[];
    };
  };
  error?: string;
}

// AI configuration and settings
export interface AIConfig {
  model: 'claude-3-haiku' | 'claude-3-sonnet' | 'gpt-3.5-turbo' | 'gpt-4';
  temperature: number;
  maxTokens: number;
  confidenceThreshold: number; // Minimum confidence for auto-task creation
}

export interface AISession {
  id: string;
  familyId: string;
  userId: string;
  type: 'task_parsing' | 'insights' | 'clarification';
  data: Record<string, unknown>;
  expiresAt: Date;
  createdAt: Date;
}

// Rate limiting
export interface AIRateLimit {
  familyId: string;
  endpoint: string;
  requestCount: number;
  windowStart: Date;
  maxRequests: number;
  windowDuration: number; // in minutes
}

export interface AIUsageMetrics {
  familyId: string;
  date: string;
  taskParsingRequests: number;
  insightRequests: number;
  tokensUsed: number;
  estimatedCost: number;
}