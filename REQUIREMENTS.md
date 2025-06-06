# FamilyTasks - Web Application Requirements (Updated)

## Project Overview
A comprehensive web-based family task management application that engages kids in completing household tasks through a gamified points system. Parents create and assign tasks, kids complete them, and points can be exchanged for real-world rewards through the integrated reward shop.

## Core Features

### User Management
- Simple registration with email/password (no email verification)
- Family structure: One family per parent, multiple parents allowed
- Roles: Admin Parent, Parent, Child (no age restrictions)
- Family invite system: First registered family member gets a family code, others join using this code during registration
- **✅ Family member management**: Edit names, remove members (parent/admin only)

### Task Management
- Parents create tasks and assign to children
- **✅ Children can create tasks** with restrictions (zero points, no bonus tasks)
- **✅ Bonus Tasks system**: Unassigned tasks available for self-assignment by any family member
- Task properties: title, description, points (default: 1), due date, tags
- Workflow: Child completes → Parent verifies → Points awarded
- Support for recurring tasks
- **✅ Single task view**: Detailed task page with role-based actions
- **✅ Task completion**: Complete, verify, decline functionality
- **✅ Task deletion**: Parents/admins can delete any task with proper points reversal
- **✅ Overdue detection**: Visual indicators for past-due tasks
- **✅ Self-assignment**: "Assign to Me" button for available bonus tasks

### Points System
- Points earned for verified task completion
- Points accumulate (no monthly reset)
- **✅ Reward Shop**: Parents can deduct points for real-world rewards
- **✅ Points history**: Complete transaction log with running balance
- **✅ Balance tracking**: Before/after amounts for all transactions
- Hall of Fame leaderboard for all family children

### Notifications
- **✅ Enhanced in-app notifications** with mobile-responsive popup positioning
- **✅ SMS notifications** for task events (when Twilio configured)
- Real-time updates for task assignments, completions, verifications, bonus task creation
- **✅ Notification bell with unread count**
- **✅ Clickable task notifications**: Navigate directly to task details
- **✅ Individual notification management**: Mark read, delete individual notifications
- **✅ Bulk actions**: Clear all notifications
- **✅ Bonus task notifications**: All family members notified when bonus tasks are created

### Core Pages
- **✅ Dashboard with dual styles**: Classic and Enhanced dashboards with bonus tasks prominently displayed
- **✅ Task management** (list, create, details, edit) with bonus task support
- **✅ Points overview and history with reward shop**
- Hall of Fame leaderboard
- **✅ Enhanced family management** with family code display and member management
- **✅ Settings page** with profile management, family member controls, and SMS settings
- Basic analytics for parents

## Technical Stack

**Frontend & Backend**: Next.js 15 + TypeScript
**Database**: PostgreSQL + Prisma ORM
**Authentication**: NextAuth.js (credentials provider only)
**Styling**: Tailwind CSS + Shadcn/ui
**UI Components**: Radix UI primitives
**Deployment**: Vercel

## Database Schema

```sql
Users {
  id: UUID (PK)
  email: String (unique)
  name: String
  password_hash: String
  role: Enum(PARENT, CHILD)
  avatar_url: String?
  dashboard_style: Enum(STYLE1, STYLE2) (default: STYLE1)
  phone_number: String?
  sms_notifications_enabled: Boolean (default: false)
  created_at: DateTime
  updated_at: DateTime
}

Families {
  id: UUID (PK)
  name: String
  family_code: String (unique, 8-character code)
  created_at: DateTime
  updated_at: DateTime
}

FamilyMembers {
  id: UUID (PK)
  family_id: UUID (FK)
  user_id: UUID (FK)
  role: Enum(ADMIN_PARENT, PARENT, CHILD)
  joined_at: DateTime
}

Tasks {
  id: UUID (PK)
  title: String
  description: String?
  points: Integer (default: 1, minimum: 0)
  due_date: DateTime
  status: Enum(PENDING, AVAILABLE, COMPLETED, VERIFIED, OVERDUE)
  created_by: UUID (FK)
  assigned_to: UUID? (FK) - nullable for bonus tasks
  family_id: UUID (FK)
  completed_at: DateTime?
  verified_at: DateTime?
  verified_by: UUID? (FK)
  is_recurring: Boolean (default: false)
  recurrence_pattern: String? (DAILY, WEEKLY, MONTHLY)
  is_bonus_task: Boolean (default: false)
  created_at: DateTime
  updated_at: DateTime
}

TaskTags {
  id: UUID (PK)
  name: String
  color: String (hex color)
  family_id: UUID (FK)
  created_at: DateTime
}

TaskTagRelations {
  task_id: UUID (FK)
  tag_id: UUID (FK)
}

PointsHistory {
  id: UUID (PK)
  user_id: UUID (FK)
  family_id: UUID (FK)
  points: Integer (can be negative for deductions)
  reason: String
  task_id: UUID? (FK) - null for reward shop deductions
  created_by: UUID (FK)
  created_at: DateTime
}

Notifications {
  id: UUID (PK)
  user_id: UUID (FK)
  title: String
  message: String
  type: Enum(TASK_ASSIGNED, TASK_COMPLETED, TASK_VERIFIED, TASK_DECLINED, TASK_DELETED, BONUS_TASK_SELF_ASSIGNED, POINTS_EARNED, POINTS_DEDUCTED)
  read: Boolean (default: false)
  related_task_id: UUID? (FK)
  created_at: DateTime
}
```

## Pages Structure

```
/                         # Landing page
/login                   # Login
/register                # Registration with family code option
/dashboard               # Role-specific dashboard
/dashboard/ai            # 🤖 AI-powered kids dashboard (children only)
/dashboard/ai-parent     # 🤖 AI analytics dashboard (parents only)
/tasks                   # Task list with filters and bonus task section
/tasks/new               # Create task (parents) or request task (kids with restrictions)
/tasks/new/ai            # 🤖 AI-assisted task creation (parents only)
/tasks/[id]              # ✅ Single task view with actions including self-assignment
/tasks/[id]/edit         # Edit task
/points                  # ✅ Points overview with reward shop
/settings                # ✅ Profile and family management
/notifications           # Notification center (if needed)
```

## API Documentation

### Authentication
```typescript
POST /api/auth/register
Body: {
  email: string;
  password: string;
  name: string;
  role: "PARENT" | "CHILD";
  familyCode?: string;
  familyName?: string;
}

POST /api/auth/login
Body: { email: string; password: string; }
```

### Family Management
```typescript
GET /api/families/my
Response: {
  success: boolean;
  data: {
    family: { id: string; name: string; familyCode: string; };
    members: Array<{
      id: string;
      role: "ADMIN_PARENT" | "PARENT" | "CHILD";
      user: { id: string; name: string; email: string; role: string; };
    }>;
    userRole: "ADMIN_PARENT" | "PARENT" | "CHILD";
  }
}

PATCH /api/families/members/[id]
Body: { name: string; }
Purpose: Update family member name (parents only)

DELETE /api/families/members/[id]
Purpose: Remove family member (parents only)

POST /api/families/regenerate
Purpose: Regenerate family code (admin only)
```

### Tasks
```typescript
GET /api/tasks
Query: { status?: string; assignedTo?: string; }
Response: Array of tasks with creator, assignee, tags

POST /api/tasks
Body: {
  title: string;
  description?: string;
  points: number; // 0+ for kids, 1+ for parents
  dueDate: string;
  assignedTo?: string; // optional for bonus tasks
  tagIds?: string[];
  isBonusTask?: boolean; // parent-only feature
}

GET /api/tasks/[id]
Response: Full task details with relationships

PUT /api/tasks/[id]
Body: Same as POST /api/tasks

POST /api/tasks/[id]/complete
Purpose: Mark task as completed (assignee only)

POST /api/tasks/[id]/verify
Purpose: Verify completed task (parents only)

POST /api/tasks/[id]/decline
Purpose: Decline completed task, reset to pending (parents only)

POST /api/tasks/[id]/assign
Purpose: Self-assign available bonus task (any family member)
Body: {} // No body required
Response: { success: boolean; data: { message: string; } }

DELETE /api/tasks/[id]
Purpose: Delete task with proper cleanup (parents/admins only)
Response: {
  success: boolean;
  data: {
    message: string;
    taskTitle: string;
    taskStatus: string;
    pointsAdjustment?: {
      userId: string;
      pointsReversed: number;
    };
  }
}

GET /api/tasks/weekly
Response: Tasks organized by week for calendar view
```

### Points & Reward Shop
```typescript
GET /api/user/points
Response: { success: boolean; points: number; }

POST /api/points/deduct
Body: {
  userId: string;
  points: number;
  reason: string;
}
Purpose: Deduct points for rewards (parents only)
Response: {
  success: boolean;
  data: {
    balanceBefore: number;
    balanceAfter: number;
    // ... transaction details
  }
}

GET /api/points/history
Query: { userId?: string; }
Response: {
  success: boolean;
  data: {
    history: Array<{
      id: string;
      points: number;
      reason: string;
      createdAt: string;
      createdBy: string;
      balanceBefore: number;
      balanceAfter: number;
      isDeduction: boolean;
    }>;
    currentBalance: number;
  }
}
```

### Notifications
```typescript
GET /api/notifications
Response: {
  success: boolean;
  data: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
    relatedTask?: { id: string; title: string; };
  }>
}

PATCH /api/notifications
Body: { 
  notificationId?: string;  // For single notification
  action?: "clear_all";     // For bulk mark as read
}
Purpose: Mark notification(s) as read

DELETE /api/notifications
Body: {
  notificationId?: string;  // For single deletion
  action?: "delete_all";    // For bulk deletion
}

GET /api/notifications/unread-count
Response: { success: boolean; count: number; }
```

### Tags
```typescript
GET /api/tags
Response: Array of family tags

POST /api/tags
Body: { name: string; color: string; }

PUT /api/tags/[id]
Body: { name: string; color: string; }

DELETE /api/tags/[id]
```

### User Management
```typescript
POST /api/user/change-email
Body: { newEmail: string; password: string; }

POST /api/user/change-password
Body: { currentPassword: string; newPassword: string; }
```

### 🤖 AI Features APIs

```typescript
POST /api/ai/parse-tasks
Body: {
  input: string;              // Natural language input
  targetDate?: string;        // Optional default due date
  defaultPoints?: number;     // Optional default points
}
Response: {
  success: boolean;
  data: {
    parsedTasks: Array<{
      title: string;
      description?: string;
      suggestedPoints: number;
      suggestedAssignee?: string;
      suggestedDueDate: string;
      confidence: number;       // AI confidence in parsing
    }>;
    clarificationQuestions?: Array<{
      question: string;
      taskIndex: number;
      field: string;
    }>;
  }
}

POST /api/ai/clarify-tasks
Body: {
  sessionId: string;          // Parsing session ID
  answers: Array<{
    questionId: string;
    answer: string;
  }>;
}
Response: {
  success: boolean;
  data: {
    finalizedTasks: Array<TaskCreationData>;
    needsMoreClarification: boolean;
    additionalQuestions?: Array<ClarificationQuestion>;
  }
}

GET /api/ai/insights/child
Query: { timeframe?: "week" | "month" }
Response: {
  success: boolean;
  data: {
    taskPriorities: Array<{
      taskId: string;
      priority: number;
      reasoning: string;
    }>;
    motivationalMessage: string;
    achievements: Array<{
      type: string;
      description: string;
      points: number;
    }>;
    weeklyPlan: Array<{
      date: string;
      tasks: Array<TaskSummary>;
      suggestedFocus: string;
    }>;
  }
}

GET /api/ai/insights/parent
Query: { timeframe?: "week" | "month" }
Response: {
  success: boolean;
  data: {
    familyAnalytics: {
      completionRate: number;
      trendDirection: "up" | "down" | "stable";
      alerts: Array<{
        type: "overdue" | "low_engagement" | "imbalanced_workload";
        message: string;
        actionable: boolean;
      }>;
    };
    childrenInsights: Array<{
      childId: string;
      childName: string;
      completionRate: number;
      strengths: string[];
      improvementAreas: string[];
      recommendedActions: string[];
    }>;
    workloadBalance: {
      isBalanced: boolean;
      suggestions: string[];
    };
  }
}
```

## User Roles & Permissions

### Admin Parent
- Create family and get family code
- Regenerate family code
- Remove family members
- All parent permissions

### Parent
- Create/assign tasks to children
- Verify task completions
- Decline task completions
- **Delete any task** (with proper points reversal)
- Edit family member names
- Remove family members (except admins)
- Deduct points through reward shop
- View all family points history

### Child
- Complete assigned tasks
- **Create tasks with restrictions** (zero points, no bonus tasks, cannot assign to others)
- **Self-assign available bonus tasks**
- View own points and transaction history
- View family leaderboard
- Read-only access to family member list

## Role-Based UI Features

### Points Page (/points)
**For Parents:**
- Current points display
- Family leaderboard
- **Reward Shop section** with kid selection and point deduction
- Full points history for all family members

**For Kids:**
- Current points display
- Family leaderboard  
- Points history (own transactions only)
- **No reward shop section** (hidden for better UX)

### Settings Page (/settings)
**For All Users:**
- Profile information display
- Change email/password functionality
- Family information display

**For Parents/Admins:**
- **Family Members Management section**
- Edit member names
- Remove members (with proper restrictions)

**For Kids:**
- Read-only family members list

### Task Details (/tasks/[id])
**For Assignees:**
- "Complete Task" button (when pending)

**For Parents:**
- "Verify Task" button (when completed)
- "Decline Task" button (when completed)

**For Creators:**
- "Edit Task" link (when pending)

### Notifications
**For All Users:**
- Mark individual notifications as read
- Delete individual notifications with X button
- Clear all notifications
- **Clickable task notifications** that navigate to task details

## Development Commands

```bash
npm install                    # Install dependencies
npm run dev                   # Development server
npm run build                 # Build production
npm run lint                  # Lint code
npx prisma generate          # Generate Prisma client
npx prisma db push           # Push schema to database
npx prisma studio            # Database GUI

# Deployment
vercel                        # Deploy to preview
vercel --prod                # Deploy to production
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/familytasks

# Authentication
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=http://localhost:3000

# Optional: For production
NODE_ENV=production
```

## Project Structure

```
src/
├── app/                 # Next.js 15 app directory
│   ├── (auth)/         # Auth pages (login, register)
│   ├── dashboard/      # Dashboard
│   ├── tasks/          # Task management
│   │   ├── [id]/       # Single task view and edit
│   │   ├── new/        # Create task
│   │   └── page.tsx    # Task list
│   ├── points/         # Points and reward shop
│   ├── settings/       # Settings and family management
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication
│   │   ├── families/   # Family management
│   │   ├── tasks/      # Task CRUD and actions
│   │   ├── points/     # Points and reward shop
│   │   ├── notifications/ # Notification management
│   │   ├── tags/       # Tag management
│   │   └── user/       # User profile updates
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Landing page
├── components/         # React components
│   ├── ui/            # Shadcn/ui components
│   ├── forms/         # Form components
│   ├── layout/        # Layout components (AppHeader, etc.)
│   ├── features/      # Feature-specific components
│   ├── settings/      # Settings page components
│   ├── points/        # Points and reward shop components
│   └── tasks/         # Task-related components
├── lib/               # Utilities
│   ├── db.ts          # Prisma client
│   ├── auth.ts        # NextAuth config
│   ├── utils.ts       # Helper functions
│   └── validations.ts # Zod schemas
├── types/             # TypeScript types
├── hooks/             # Custom React hooks
└── prisma/            # Database schema
    └── schema.prisma
```

## Feature Implementation Status

### ✅ Completed Features
- **User Authentication & Registration**
- **Family Management with Invite Codes**
- **Task CRUD Operations** with bonus task support
- **Bonus Tasks System** (unassigned tasks with self-assignment)
- **Kids Can Create Tasks** (with zero points restriction)
- **Task Workflow** (Create → Assign → Complete → Verify)
- **Points System with History Tracking**
- **Reward Shop** for point deductions
- **Enhanced Notifications** with SMS support and mobile-responsive popup
- **Single Task View** with role-based actions and self-assignment
- **Family Member Management**
- **Role-Based UI** (different views for parents/kids)
- **Settings Page** with profile management and SMS settings
- **Dual Dashboard Styles** (Classic and Enhanced with bonus tasks at top)
- **Responsive Design** with proper navigation

### 🤖 AI Features (v2.0+)

#### AI Task Creation (Parents)
- **Natural Language Task Input**: Parents type sentences like "Tomorrow Johnny needs to clean room, do homework, read for 1 hour and wash dishes"
- **AI Task Parser**: Converts natural language to structured task objects
- **Interactive Clarification**: AI asks follow-up questions (points per task, specific assignments, due times)
- **Batch Task Generation**: Creates multiple tasks from single input with proper assignments and scheduling
- **Smart Defaults**: AI suggests reasonable points, due dates based on task complexity and family history

#### AI Kids Dashboard (`/dashboard/ai`)
- **Smart Daily/Weekly Planning**: AI-powered view showing optimized task scheduling
- **Progress Visualization**: Interactive charts showing completion trends and achievements
- **Task Prioritization**: AI ranks tasks by urgency, points, and difficulty
- **Motivational Insights**: Personalized encouragement based on progress patterns
- **Achievement Tracking**: AI-generated milestones and celebration of progress

#### AI Parent Dashboard (`/dashboard/ai-parent`)
- **Completion Analytics**: Advanced insights into family task completion rates and trends
- **Smart Alerts**: Proactive notifications when children fall behind on tasks
- **Performance Insights**: AI analysis of optimal task assignment patterns
- **Family Productivity Reports**: Automated weekly/monthly progress summaries
- **Workload Balancing**: AI suggestions for fair task distribution among children

#### Technical Implementation
- **MCP Postgres Server**: Direct AI access to family database for context-aware responses
- **Streaming AI Responses**: Real-time conversational interface for task creation
- **Context Preservation**: AI maintains family context (members, preferences, history)
- **Role-Based AI**: Different AI personalities/capabilities for parents vs children
- **Privacy-First**: All AI processing respects family data isolation

### 🔄 In Progress / Future Enhancements
- Advanced recurring task patterns
- Bulk task operations
- Enhanced analytics dashboard
- Task templates
- Photo attachments for task verification

## Security & Permissions

### Data Access Control
- Users can only access their own family's data
- Family isolation enforced at API level
- Role-based permissions for sensitive operations
- Proper authorization checks on all endpoints

### Family Member Management Rules
- Only parents/admins can edit member names
- Only parents/admins can remove members
- Users cannot remove themselves
- Only admins can remove other admins
- Admins cannot be removed by non-admins

### Points & Reward Shop Rules
- Only parents can deduct points
- Cannot deduct more points than available
- All point transactions are logged
- Cannot deduct from zero balance
- Reason required for all deductions

This comprehensive system provides a complete family task management solution with proper role separation, reward mechanisms, and user-friendly interfaces for all family members.