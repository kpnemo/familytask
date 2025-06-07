# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev                    # Start development server with Turbopack
npm run build                  # Build production app (includes Prisma generate)
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run postinstall           # Generate Prisma client (auto-runs after npm install)

# Testing
npm run test                   # Interactive test runner CLI
npm run test:smoke            # Quick validation (build + unit + basic E2E)
npm run test:unit             # Unit tests only
npm run test:unit:watch       # Unit tests in watch mode
npm run test:unit:coverage    # Unit tests with coverage report
npm run test:e2e              # End-to-end tests with Playwright
npm run test:e2e:ui           # E2E tests with interactive UI
npm run test:setup            # Setup test database
npm run test:clean            # Clean test database

# Database
npx prisma generate           # Generate Prisma client
npx prisma db push            # Push schema changes to database
npx prisma migrate deploy     # Deploy pending migrations
npx prisma studio             # Open database GUI

# Deployment
npm run deploy                # Automated deployment with version bump
```

## 🚨 CRITICAL DATABASE SAFETY RULE 🚨

**NEVER run ANY database modification command without creating a backup first!**

### MANDATORY Database Backup Process:
1. **ALWAYS backup before ANY database changes** - Use `/scripts/backup-db.js` or `/scripts/simple-backup.js`
2. **NEVER use `prisma migrate reset`** - This DELETES ALL DATA permanently
3. **NEVER use `prisma db push --force-reset`** - This also DELETES ALL DATA
4. **NEVER use destructive commands** without explicit user approval and verified backup

### Safe Database Commands Only:
- `npx prisma generate` ✅ (Safe - only generates client)
- `npx prisma migrate dev --name [name]` ✅ (Safe - additive migrations only)
- `npx prisma db push` ✅ (Safe - schema sync without reset)
- `npx prisma studio` ✅ (Safe - read-only GUI)

### FORBIDDEN Database Commands:
- `npx prisma migrate reset` ❌ **DELETES ALL DATA**
- `npx prisma db push --force-reset` ❌ **DELETES ALL DATA**
- `npx prisma db seed --reset` ❌ **DELETES ALL DATA**

## Pre-Deployment Checklist

Always run these commands before deploying:
1. `npm run test:smoke` - Must pass ✅
2. `npm run lint` - Must pass ✅  
3. `npm run build` - Must succeed ✅

For database schema changes, always backup production data first using the scripts in `/scripts/`.

## Project Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (credentials only)
- **UI**: Tailwind CSS + Shadcn/ui components
- **Deployment**: Vercel

### Core Domain Models
- **Users**: Parents and children with role-based permissions
- **Families**: Groups linked by 8-character family codes
- **Tasks**: Assignable work items with points and status workflow
- **Bonus Tasks**: Unassigned tasks available for self-assignment
- **Points System**: Gamified rewards with deduction capability
- **Notifications**: Real-time updates with SMS support

### Authentication & Authorization
- NextAuth.js with JWT sessions stored in `session.user`:
  - `id`, `email`, `name`, `role` (PARENT/CHILD)
  - `familyId`, `familyRole` (ADMIN_PARENT/PARENT/CHILD)
- Family-isolated data access enforced at API level
- Role-based UI and permissions throughout

### Database Architecture
- Prisma schema in `/prisma/schema.prisma`
- PostgreSQL with connection pooling via Vercel
- Family isolation via `familyId` foreign keys
- Audit trails in `PointsHistory` and `Notification` tables

### API Patterns
All API routes follow consistent patterns:
- Authentication check via `getServerSession(authOptions)`
- Family membership validation
- Role-based permission checks
- Standardized response format: `{ success: boolean, data: any, error?: string }`

### Points Management APIs
- `/api/points/add` - Add bonus points to family members (parents only)
- `/api/points/deduct` - Deduct points from family members (parents only)
- `/api/points/history` - Individual user's points transaction history
- `/api/points/family-history` - Family-wide points transaction history (parents only)
- **Transaction Formats**:
  - Task completion: "Task completed: {taskTitle}"
  - Bonus points: "Bonus Points: {reason}"
  - Reward shop: "Reward Shop: {reason}"
  - Task deletion: "Task deleted: {taskTitle} (points reversed)"

### Task Workflow
1. **PENDING**: Created and assigned
2. **AVAILABLE**: Bonus tasks ready for self-assignment
3. **COMPLETED**: Marked done by assignee
4. **VERIFIED**: Approved by parent (points awarded)
5. **OVERDUE**: Past due date

### Points System
- Earned on task verification
- Tracked with running balance in `PointsHistory`
- **Add/Deduct functionality**: Parents can both add bonus points and deduct points through reward shop
- **Comprehensive Audit Trail**: All transactions logged with before/after amounts and detailed reasons
- **Task Deletion Logic**: Verified task deletions create reversal entries while preserving audit trail
- **Family-wide Management**: Parents can manage points for all family members (parents and children)

### Component Organization
```
src/components/
├── ui/           # Shadcn/ui base components
├── forms/        # Form components with react-hook-form + Zod
├── features/     # Feature-specific components
├── layout/       # App-wide layout components  
├── settings/     # Settings page components
├── points/       # Points and reward shop components
└── tasks/        # Task-related components
```

### Key Utilities
- `src/lib/auth.ts` - NextAuth configuration
- `src/lib/db.ts` - Prisma client with connection optimization
- `src/lib/utils.ts` - Shared utilities and Tailwind helpers
- `src/lib/validations.ts` - Zod schemas for API validation
- `src/lib/sms.ts` - Twilio SMS notifications
- `src/lib/notification-helpers.ts` - Notification creation utilities

### File Naming Conventions
- Pages: kebab-case (`task-list.tsx`)
- Components: PascalCase files, kebab-case exports
- API routes: RESTful structure in `/app/api/`
- Use TypeScript for all new files

### State Management
- Server state via Next.js API routes and React Server Components
- Client state with React hooks (useState, useEffect)
- Form state with react-hook-form
- No global client state library needed

### Mobile Responsiveness
- Mobile-first design with Tailwind CSS
- Touch-friendly interface elements
- Responsive navigation and notifications
- Optimized for family use on various devices

### Testing Strategy
- Unit tests with Jest for API routes and utilities
- E2E tests with Playwright for critical user journeys
- Separate SQLite database for testing
- Interactive test runner CLI for developer experience

### Environment Configuration
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection (Neon/Vercel)
- `NEXTAUTH_SECRET` - Authentication signing key
- `NEXTAUTH_URL` - Application base URL
- `TWILIO_*` - SMS notification credentials (optional)

### Deployment Process
The project includes automated deployment scripts:
1. Version bumping with semantic versioning
2. Automated git commits and pushes
3. Vercel deployment with health checks
4. Production database migration support

### Role-Based Feature Access
**Parents/Admin Parents:**
- Create and manage all tasks
- Verify task completions
- Manage family members
- **Add bonus points** to any family member for good behavior, extra chores, birthdays
- **Deduct points** from any family member through reward shop
- **Family Points History** - view all family transactions with complete audit trail
- **Compact Dashboard Filtering** - filter tasks by specific family members
- Access all family data

**Children:**
- Complete assigned tasks
- Create tasks (zero points, no assignment)
- Self-assign bonus tasks
- View own points and history
- Limited family member visibility

## Recent Major Updates (v1.0.35-1.0.36)

### 🤖 OpenAI Multilingual AI Enhancement (v1.0.35)
**Major AI System Upgrade**: Complete migration from Anthropic to OpenAI GPT-4o with multilingual support.

**🌍 Multilingual Capabilities:**
- **Language Detection**: Automatic detection of Russian vs English input using Cyrillic patterns
- **Intelligent Responses**: AI responds in the same language it was approached
- **Cultural Context**: Russian prompts include culturally appropriate examples and grammar patterns
- **Enhanced Parsing**: Better natural language understanding for task creation in both languages

**🎯 Technical Implementation:**
- **OpenAI Integration**: Four new AI modules using GPT-4o model
  - `OpenAIAnalyticsEngine` - Family insights with multilingual analytics
  - `OpenAITaskParser` - Natural language task creation (Russian/English)
  - `OpenAIConversationRouter` - Intent analysis with language detection
  - `OpenAIConversationHandler` - Main orchestration with cultural context
- **API Updates**: Both `/api/ai/chat` and `/api/ai/parse-tasks` now use OpenAI
- **Data Transformation**: Fixed frontend assignee display by converting IDs to names
- **Error Handling**: Resolved SVG path errors and date comparison issues

**🔧 Bug Fixes Included:**
- Fixed `[object Object]` display in analytics (now shows formatted metrics)
- Fixed task assignment display showing "Unassigned" instead of names
- Fixed date comparison errors in task queries
- Fixed SVG path syntax causing browser console warnings

### 🎯 Kids Dashboard Enhancements (v1.0.36)
**Major UX Improvement**: Complete overhaul of children's dashboard experience.

**📋 Overdue Task Visibility:**
- **Previously Hidden**: Kids couldn't see overdue tasks in their dashboard
- **Now Visible**: Overdue tasks appear prominently with red styling and warning icons
- **Priority Ordering**: Overdue tasks show first, then today's tasks
- **Visual Distinction**: "🚨 Overdue Tasks" section with urgent "Complete Now!" buttons

**💰 Bonus Task Integration:**
- **Full Access**: Kids can see all available bonus tasks in their dashboard
- **Self-Assignment**: "Take Task!" button allows immediate bonus task claiming
- **Visual Identification**: Bonus tasks show 💰 icon and "Bonus Task" badge
- **Parallel Fetching**: Dashboard fetches both assigned tasks and bonus tasks simultaneously

**🎨 Enhanced Organization:**
- **Clear Sections**: Overdue → Today's (Assigned + Bonus) → Future Locked
- **Color Coding**: Red (overdue), Green (today), Amber (locked/bonus actions)
- **Child-Friendly**: Maintains encouraging interface with clear visual hierarchy

**⚙️ Technical Improvements:**
- **Dual API Calls**: Parallel fetching of assigned and bonus tasks
- **Date-Only Logic**: Consistent date comparison ignoring time across all task filtering
- **Task Categorization**: Sophisticated sorting by type (assigned/bonus) and timing (overdue/today)
- **State Management**: Proper refresh after task completion or assignment

## Previous Updates (v1.0.25-1.0.28)

### 🚨 Task Deletion Points Bug Fix (v1.0.26-1.0.27)
**Critical Issue**: Deleting verified tasks caused double-deduction, leaving users with negative points.
- **Example**: Child had 0 points → completed 5-point task → deleted task → ended with -5 points ❌
- **Root Cause**: Deletion created reversal entry (-5) then deleted original entry (+5) = net -5
- **Solution**: Preserve both original and reversal entries while removing task references
- **Result**: 0 + 5 (verify) - 5 (delete) = 0 ✅ with complete audit trail

### 🎯 Family Member Dropdown Filter (v1.0.25)
**Enhancement**: Added family member filtering to Compact dashboard for parents.
- Dropdown shows "All Members", "My Tasks", and individual family members
- Parent-only feature (children don't see dropdown)
- Reuses existing `/api/families/members` endpoint
- Smart UI hides "Only Mine" toggle when specific member selected

### 💰 Add Points Feature (v1.0.28)
**Major Enhancement**: Parents can now ADD points (not just deduct) through Rewards Shop.
- **Action Toggle**: Switch between Add Points 💰 and Deduct Points 🎁
- **Visual Design**: Green styling for add, red for deduct, with emoji icons
- **All Family Members**: Dropdown includes parents and children (not role-restricted)
- **Smart Validation**: Prevents deducting more than available, allows unlimited adding
- **Audit Trail**: "Bonus Points: {reason}" format for add transactions
- **Use Cases**: Reward good behavior, extra chores, birthdays, achievements

### 🔧 Key Technical Learnings
1. **Points Math**: Always ensure net-zero when reversing transactions
2. **Audit Trail Preservation**: Never delete historical data, only remove references
3. **Browser Caching**: Hard refresh needed when updating React components
4. **Family Filtering**: Role-based filtering can be limiting - consider showing all members
5. **API Design**: Consistent patterns across add/deduct endpoints with proper validation
6. **Language Detection**: Cyrillic character patterns + keyword matching for reliable detection
7. **Data Transformation**: Always convert backend IDs to frontend display names
8. **Kids UX**: Children need simple, encouraging interfaces with clear visual priority