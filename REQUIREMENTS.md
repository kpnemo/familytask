# FamilyTasks - Web Application Requirements (MVP)

## Project Overview
A simplified web-based family task management application that engages kids in completing household tasks through a gamified points system. Parents create and assign tasks, kids complete them, and points can be exchanged for real-world rewards.

## Core Features

### User Management
- Simple registration with email/password (no email verification)
- Family structure: One family per parent, multiple parents allowed
- Roles: Admin Parent, Parent, Child (no age restrictions)
- Family invite system: First registered family member gets a family code, others join using this code during registration

### Task Management
- Parents create tasks and assign to children
- Children can create personal tasks
- Task properties: title, description, points (default: 1), due date, tags
- Workflow: Child completes → Parent verifies → Points awarded
- Support for recurring tasks

### Points System
- Points earned for verified task completion
- Points accumulate (no monthly reset)
- Parents can deduct points for real-world rewards
- Hall of Fame leaderboard for all family children

### Notifications
- **In-app notifications only** (no email)
- Real-time updates for task assignments, completions, verifications
- Notification bell with unread count

### Core Pages
- Dashboard (role-specific views)
- Task management (list, create, details)
- Points overview and history
- Hall of Fame leaderboard
- Family management with family code display
- Basic analytics for parents

## Technical Stack

**Frontend & Backend**: Next.js 14 + TypeScript
**Database**: PostgreSQL + Prisma ORM
**Authentication**: NextAuth.js (credentials provider only)
**Styling**: Tailwind CSS + Shadcn/ui
**Real-time**: Server-Sent Events for notifications
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
  points: Integer (default: 1)
  due_date: DateTime
  status: Enum(PENDING, COMPLETED, VERIFIED, OVERDUE)
  created_by: UUID (FK)
  assigned_to: UUID (FK)
  family_id: UUID (FK)
  completed_at: DateTime?
  verified_at: DateTime?
  verified_by: UUID? (FK)
  is_recurring: Boolean (default: false)
  recurrence_pattern: String? (DAILY, WEEKLY, MONTHLY)
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
  points: Integer (can be negative)
  reason: String
  task_id: UUID? (FK)
  created_by: UUID (FK)
  created_at: DateTime
}

Notifications {
  id: UUID (PK)
  user_id: UUID (FK)
  title: String
  message: String
  type: Enum(TASK_ASSIGNED, TASK_COMPLETED, TASK_VERIFIED, POINTS_EARNED, POINTS_DEDUCTED)
  read: Boolean (default: false)
  related_task_id: UUID? (FK)
  created_at: DateTime
}
```

## Registration & Family Setup Flow

### Option 1: First Family Member (Creates Family)
1. User registers with email/password
2. Selects "Create new family"
3. System generates unique 8-character family code
4. User becomes Admin Parent
5. Family code displayed for sharing

### Option 2: Joining Existing Family
1. User registers with email/password
2. Enters family code during registration
3. System validates code and adds user to family
4. Role assigned based on user selection (Parent/Child)

## API Endpoints

### Authentication
```typescript
// Register with optional family code
POST /api/auth/register
Body: {
  email: string;
  password: string;
  name: string;
  role: "PARENT" | "CHILD";
  familyCode?: string; // If joining existing family
  familyName?: string; // If creating new family
}

POST /api/auth/login
Body: { email: string; password: string; }

GET /api/auth/me
```

### Family Management
```typescript
GET /api/families/my           // Get user's family with code
GET /api/families/members      // Get family members
POST /api/families/regenerate  // Regenerate family code (admin only)
```

### Tasks
```typescript
GET /api/tasks                 // Get tasks (filtered by role)
POST /api/tasks               // Create task
PUT /api/tasks/:id            // Update task
DELETE /api/tasks/:id         // Delete task
POST /api/tasks/:id/complete  // Mark as completed
POST /api/tasks/:id/verify    // Verify completion
```

### Tags
```typescript
GET /api/tags                 // Get family tags
POST /api/tags               // Create tag
PUT /api/tags/:id            // Update tag
DELETE /api/tags/:id         // Delete tag
```

### Points
```typescript
GET /api/points/balance/:userId     // Get points balance
GET /api/points/history/:userId     // Get points history
POST /api/points/deduct            // Deduct points (parent only)
GET /api/points/leaderboard        // Get hall of fame
```

### Analytics (Basic)
```typescript
GET /api/analytics/overview        // Family stats (parent only)
GET /api/analytics/child/:id       // Child stats (parent only)
```

### Notifications
```typescript
GET /api/notifications             // Get user notifications
PUT /api/notifications/:id/read    // Mark as read
DELETE /api/notifications/:id      // Delete notification
GET /api/notifications/sse         // Server-sent events for real-time
```

## Pages Structure

```
/                    # Landing page
/register           # Registration with family code option
/login              # Login
/dashboard          # Role-specific dashboard
/tasks              # Task list
/tasks/new          # Create task
/tasks/[id]         # Task details
/points             # Points overview
/leaderboard        # Hall of Fame
/points/deduct      # Deduct points (parent only)
/analytics          # Basic analytics (parent only)
/family             # Family code display and member management
/profile            # User profile
/notifications      # Notification center
```

## User Roles & Permissions

**Admin Parent**: 
- Create family and get family code
- Regenerate family code
- All parent permissions

**Parent**: 
- Create/assign tasks to children
- Verify task completions
- Deduct points
- View basic analytics

**Child**: 
- Complete assigned tasks
- Create personal tasks
- View points and leaderboard

## MVP Simplifications

✅ **Included in MVP:**
- Basic task creation and assignment
- Points system with manual deduction
- In-app notifications only
- Simple family code sharing
- Basic analytics
- Hall of fame leaderboard

❌ **NOT in MVP:**
- Email notifications or verification
- Advanced recurring patterns
- Photo attachments
- Reward catalog
- Advanced analytics
- Bulk operations
- Task templates

## Development Commands

```bash
npm install                    # Install dependencies
npm run dev                   # Development server
npm run build                 # Build production
npm run lint                  # Lint code
npx prisma generate          # Generate Prisma client
npx prisma db push           # Push schema to database
npx prisma studio            # Database GUI
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
├── app/                 # Next.js 14 app directory
│   ├── (auth)/         # Auth pages (login, register)
│   ├── dashboard/      # Dashboard
│   ├── tasks/          # Task management
│   ├── points/         # Points and leaderboard
│   ├── family/         # Family management
│   ├── api/            # API routes
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Landing page
├── components/         # React components
│   ├── ui/            # Shadcn/ui components
│   ├── forms/         # Form components
│   ├── layout/        # Layout components
│   └── features/      # Feature-specific components
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

## Family Code System

- **Code Generation**: 8-character alphanumeric code (e.g., "ABC12XYZ")
- **Code Display**: Shown prominently in family settings
- **Code Regeneration**: Admin can regenerate if compromised
- **Code Validation**: Checked during registration
- **Single Use**: Multiple people can use same code to join family

This MVP approach removes email complexity while maintaining core family task management functionality.