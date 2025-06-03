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

### Task Workflow
1. **PENDING**: Created and assigned
2. **AVAILABLE**: Bonus tasks ready for self-assignment
3. **COMPLETED**: Marked done by assignee
4. **VERIFIED**: Approved by parent (points awarded)
5. **OVERDUE**: Past due date

### Points System
- Earned on task verification
- Tracked with running balance in `PointsHistory`
- Deductible by parents through reward shop
- All transactions logged with before/after amounts

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
- Deduct points through reward shop
- Access all family data

**Children:**
- Complete assigned tasks
- Create tasks (zero points, no assignment)
- Self-assign bonus tasks
- View own points and history
- Limited family member visibility