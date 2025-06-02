import { User, Family, FamilyMember, Task, TaskTag, PointsHistory, Notification } from "@prisma/client"

// Re-export Prisma types
export type { User, Family, FamilyMember, Task, TaskTag, PointsHistory, Notification }

// Extended types with relations
export type UserWithFamily = User & {
  familyMemberships: (FamilyMember & {
    family: Family
  })[]
}

export type TaskWithRelations = Task & {
  creator: User
  assignee: User
  verifier?: User
  tags: (TaskTag)[]
  family: Family
}

export type FamilyWithMembers = Family & {
  members: (FamilyMember & {
    user: User
  })[]
}

export type PointsHistoryWithRelations = PointsHistory & {
  user: User
  task?: Task
  creator: User
}

export type NotificationWithTask = Notification & {
  relatedTask?: Task
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  success: boolean
}

// Dashboard stats
export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  totalPoints: number
  completionRate: number
}

// Analytics data
export interface AnalyticsData {
  totalTasks: number
  completedTasks: number
  totalPoints: number
  activeChildren: number
  completionRate: number
  trendsData: {
    date: string
    completed: number
    created: number
  }[]
}

export interface ChildAnalytics {
  child: User
  totalTasks: number
  completedTasks: number
  totalPoints: number
  completionRate: number
  averageTaskTime: number
  trendsData: {
    date: string
    completed: number
    points: number
  }[]
  topCategories: {
    tagName: string
    count: number
  }[]
}

// Leaderboard entry
export interface LeaderboardEntry {
  userId: string
  name: string
  avatar?: string
  points: number
  rank: number
}