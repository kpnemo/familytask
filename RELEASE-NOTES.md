# FamilyTasks Release Notes

## [1.0.24] - 2025-06-04

### 🚨 Critical Hotfix - Comprehensive Date Logic Overhaul
- **CRITICAL FIX:** All dashboard styles now correctly display tasks under proper date sections
- **Enhanced Dashboard:** Fixed timeline grouping to show today's tasks under "Today", tomorrow's under "Tomorrow"
- **Classic Dashboard:** Fixed "Next 7 Days" section date filtering and color coding
- **Kids Dashboard:** Fixed today-only filtering to prevent tomorrow's tasks from appearing
- Eliminated all timezone-related date comparison issues across the application

### 🐛 Major Bug Fixes
- Fixed date object mutation causing incorrect date classifications throughout app
- Replaced problematic toISOString().split('T')[0] with direct date part comparisons
- Fixed getDateLabel(), getDaysLeft(), and getDateColor() functions across all components
- Eliminated date.setHours() mutations that caused timezone confusion
- Fixed task grouping logic to align with filtering logic for consistency

### 🛠️ Technical Improvements
- Implemented consistent date comparison using year/month/day parts directly
- Removed all UTC timezone dependencies in favor of local date logic
- Applied uniform date handling across Enhanced, Classic, and Kids dashboard styles
- Enhanced date-only comparison logic that completely ignores time components
- Improved WeeklyView, Dashboard2Unified, and KidsStyleDashboard date consistency

### 📋 Components Updated
- `dashboard2-unified.tsx` - Fixed Enhanced dashboard timeline and task grouping
- `weekly-view.tsx` - Fixed Classic dashboard Next 7 Days section
- `dashboard-kids-style.tsx` - Fixed today-only task filtering and completion logic
- All dashboard styles now use identical, timezone-independent date logic

## [1.0.22] - 2025-06-04

### ✨ New Features
- **NEW:** Kids dashboard now displays task due dates with calendar icons for better clarity
- **NEW:** Decline task dialog added to single task view (/tasks/[id]) matching /tasks page functionality
- Task decline reason is now optional - parents can decline tasks with or without providing a reason

### 🐛 Bug Fixes
- **FIXED:** Enhanced dashboard timeline logic now properly handles date-only comparisons
- Fixed issue where tasks due today could incorrectly appear as tomorrow's tasks
- Improved date normalization to prevent time-based comparison issues
- Enhanced "Today" task detection to be more reliable and timezone-independent

### 🔧 Improvements
- Simplified decline task workflow - reason field is now optional across all interfaces
- Enhanced task view experience with consistent decline functionality between list and detail views
- Improved date handling consistency across all dashboard styles
- Better visual feedback with calendar emoji (📅) for task dates in kids dashboard

### 🛠️ Technical
- Updated validation schema to make decline reason optional
- Enhanced decline task dialog to work without required reason
- Improved date comparison logic in Enhanced dashboard timeline
- Fixed database schema migration for compact dashboard style compatibility

## [1.0.21] - 2025-06-04

### ✨ New Features
- **NEW:** Family Points History - Parents can now view comprehensive points activity for all family members
- Added family-wide points log showing all earnings and deductions across the family
- Current balance summary for each family member at a glance
- Detailed activity timeline with timestamps, reasons, and transaction creators
- Visual indicators for earnings (💰) and deductions (💸)
- Parent-only access with proper permission controls

### 🔧 Improvements
- Fixed database switching scripts for development environment
- Corrected PostgreSQL connection strings for local development
- Enhanced development workflow with proper .env.local configuration
- Updated script messaging to accurately reflect database connections

### 🛠️ Technical
- Created new `/api/points/family-history` endpoint for parent access
- Built `FamilyPointsHistory` React component with real-time updates
- Added family points history section to points page (parents only)
- Integrated with existing refresh triggers from reward shop

## [1.0.20] - 2025-06-04

### 🔧 Internal Updates
- Version bump without user-facing changes

## [1.0.19] - 2025-06-04

### 🐛 Bug Fixes
- **FIXED:** Tasks due today incorrectly appearing as overdue across all dashboard views
- Corrected date comparison logic to use date-only comparison instead of timestamp comparison
- Fixed overdue task filtering in task list page, compact dashboard, and unified dashboard
- Tasks are now only marked overdue if their due date is actually before today's date

### 🧹 Code Cleanup
- Removed unused dashboard2-parent.tsx component file
- Consolidated dashboard components to use only dashboard2-unified.tsx

## [1.0.18] - 2025-06-04

### ✨ New Features
- **NEW:** Compact Dashboard style for mobile-optimized task management
- Added new dashboard style option "Compact" in user settings
- Single-line task display with title, points, assignee, and due date
- Clickable task titles that navigate to task detail pages
- Complete filtering system matching Enhanced dashboard (All, Overdue, Next, Awaiting, Done, Bonus)
- "Only Mine" toggle for family task filtering
- Role-based Complete/Verify buttons with proper permissions
- Visual indicators for overdue tasks and completion status
- Enhanced onboarding banner with anchor links and navigation from registration to settings

### 🎨 UI/UX
- Mobile-first design with compact filter buttons and smaller spacing
- Touch-friendly interface elements optimized for mobile devices
- Color-coded status indicators (overdue, awaiting verification, completed)
- Responsive single-line task layout for better mobile experience
- Proper task status badges and action buttons

### 🔧 Improvements
- Database schema updated to support COMPACT dashboard style
- Enhanced task permission logic matching existing TaskCard component
- Improved mobile responsiveness across all dashboard styles
- Added proper session-based role checking for task actions

## [1.0.17] - 2025-06-04

### ✨ New Features
- **NEW:** Elegant landing page with Anthropic-inspired design
- **NEW:** Comprehensive "How it Works" page explaining all features
- Added navigation between landing page and how-it-works guide
- Detailed explanations of family setup, dashboard styles, and task types
- Kid-friendly feature descriptions with visual examples

### 🎨 UI/UX
- Complete landing page redesign with clean, modern aesthetics
- Professional navigation with backdrop blur effects
- Responsive design optimized for all devices
- Enhanced typography and color scheme using slate palette
- Improved call-to-action sections and feature highlights

### 📚 Documentation
- Added comprehensive guide covering family codes, dashboard options, and task workflows
- Explained three types of tasks: Regular, Bonus, and Due Date Only
- Highlighted kid-friendly features and family management tools
- Visual mockups showing actual interface elements

## [1.0.16] - 2025-06-04

### 🐛 Bug Fixes
- **CRITICAL FIX:** Enhanced dashboard now shows all family tasks for parents instead of only user's own tasks
- Fixed Enhanced dashboard "Next Up" section to display all pending tasks instead of just 1
- Fixed React state timing issue causing task calculations during empty state
- Resolved timezone issues in task creation form showing wrong default date
- Fixed "due date only" task completion logic to allow completion on or after due date
- Fixed backend API validation for overdue "due date only" tasks

### 🔧 Improvements
- Enhanced date handling consistency between frontend and backend
- Improved timezone-aware date calculations for task creation
- Moved task filtering calculations into useMemo to prevent race conditions
- Added timezone API endpoint to properly fetch user's stored timezone
- Better error messages for due date constraint violations

## [1.0.15] - 2025-06-03

### ✨ New Features
- Unified Enhanced dashboard (merged parent and kid versions into single adaptive component)
- Added "Only Mine" button for both parents and kids with smart visibility logic
- Added 30-day filtering for completed/verified tasks with Show More functionality

### 🔧 Improvements
- Improved completed task display with recent filtering
- Enhanced dashboard responsiveness and user experience

## [1.0.14] - 2025-06-02

### ✨ New Features
- Make dashboard styles available to all users
- Kids Style dashboard for simplified child-friendly interface
- 'Due Date Only' constraint for tasks (perfect for daily routines)
- Onboarding notifications for new admin parents
- Enhanced SMS templates for urgent bonus tasks

### 🐛 Bug Fixes
- Fixed recurring tasks and various UI issues
- Improved notification delivery system

## [1.0.13] - 2025-06-01

### ✨ New Features
- Enhanced SMS templates for urgent bonus tasks
- Improved notification delivery system

### 🔧 Improvements
- Better SMS formatting and delivery
- Enhanced bonus task workflows
- Improved notification reliability

## [1.0.12] - 2025-05-31

### ✨ New Features
- Enhanced notifications with SMS support
- Onboarding notifications for new admin parents
- Bonus task notifications for all family members

### 🔧 Improvements
- Improved notification system reliability
- Better error handling for SMS delivery
- Enhanced family setup experience

## [1.0.11] - 2025-05-30

### ✨ New Features
- Added "Due Date Only" constraint for tasks - perfect for daily routines like "do the dishes"
- Added Kids Style dashboard - simplified view showing only today's tasks for young children
- Added timezone support with user settings
- Added automatic release notes system

### 🔧 Improvements
- Improved recurring task logic - next tasks only created after verification (not completion)
- Fixed default due date to today instead of tomorrow in task creation
- Enhanced task cards with visual indicators for due-date-only tasks (⏰)
- Complete button now hidden for due-date-only tasks when not due yet
- Better date handling to avoid timezone confusion

### 🐛 Bug Fixes
- Fixed hydration errors in timezone settings
- Fixed recurring tasks preserving dueDateOnly constraint
- Fixed task completion validation for date-restricted tasks
- Improved error messages for early completion attempts

### 🎨 UI/UX
- Added visual indicators for due-date-only and recurring tasks
- Improved task cards with better status displays
- Enhanced settings page with timezone selection
- Better messaging for blocked task completion

## [1.0.10] - 2025-05-29

### ✨ New Features
- Initial release with core task management
- Family-based user system
- Points and reward shop
- Dual dashboard styles
- Bonus tasks system
- Recurring tasks
- Role-based permissions

### 🎯 Core Features
- Task creation, assignment, and verification
- Points system with history tracking
- Family member management
- Responsive design for mobile and desktop
- Real-time notifications