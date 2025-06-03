# FamilyTasks Release Notes

## [1.0.16] - 04/06/2025

### 🐛 Bug Fixes
- **CRITICAL FIX:** Enhanced dashboard now shows all family tasks for parents instead of only user's own tasks
- Fixed Enhanced dashboard "Next Up" section to display all 12 pending tasks instead of just 1
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
- Fixed release notes versioning and date format issues

### 🔄 Other Changes
- Cleaned up release notes with proper chronological order and DD/MM/YYYY date format

## [1.0.15] - 03/06/2025

### ✨ New Features
- Unified Enhanced dashboard (merged parent and kid versions into single adaptive component)
- Added "Only Mine" button for both parents and kids with smart visibility logic
- Added 30-day filtering for completed/verified tasks with Show More functionality

### 🔧 Improvements
- Improved completed task display with recent filtering
- Enhanced dashboard responsiveness and user experience

## [1.0.14] - 02/06/2025

### ✨ New Features
- Make dashboard styles available to all users
- Kids Style dashboard and release notes system
- 'Due Date Only' constraint for tasks
- Onboarding notifications for new admin parents
- Enhanced SMS template for urgent bonus tasks

### 🐛 Bug Fixes
- Fixed recurring tasks and various UI issues

### 🔄 Other Changes
- CLAUDE.md added

## [1.0.13] - 01/06/2025

### ✨ New Features
- Enhanced SMS templates for urgent bonus tasks
- Improved notification delivery system

### 🔧 Improvements
- Better SMS formatting and delivery
- Enhanced bonus task workflows
- Improved notification reliability

## [1.0.12] - 31/05/2025

### ✨ New Features
- Enhanced notifications with SMS support
- Onboarding notifications for new admin parents
- Bonus task notifications for all family members

### 🔧 Improvements
- Improved notification system reliability
- Better error handling for SMS delivery
- Enhanced family setup experience

## [1.0.11] - 30/05/2025

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

## [1.0.10] - 29/05/2025

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