# FamilyTasks Release Notes

## [1.0.29] - 2025-06-05

### ✨ New Features
- **NEW:** Task Reassignment functionality for parents
- Parents can now reassign PENDING tasks to any family member through task edit form
- Smart assignment dropdown shows all family members with roles
- Real-time notifications for both previous and new assignees
- Role-based task navigation: parents get edit access, children get view-only access

### 🔔 Enhanced Notifications
- **TASK_REASSIGNED**: New notification type for task reassignment events
- Previous assignee gets: "Task 'X' was reassigned from you to Y by Z"
- New assignee gets: "Task 'X' was assigned to you by Z"
- Auto-refresh notifications every 30 seconds + manual refresh button
- SMS support for reassignment notifications with proper formatting

### 🎯 Smart UI Navigation
- **Compact Dashboard**: Task titles link to edit (parents) or view (children)
- **Single Task View**: Dynamic "Edit Task" / "View Task" button based on role
- **Edit Form**: Assignment dropdown only visible for parents with PENDING tasks
- Clear messaging when reassignment is not available (status/permission reasons)

### 🔒 Security & Validation
- **Parent-Only Reassignment**: Only parents/admin parents can reassign tasks
- **PENDING Status Requirement**: Only pending tasks can be reassigned
- **Family Member Validation**: Can only reassign to members of same family
- **Comprehensive API Validation**: Prevents unauthorized reassignment attempts

### 🛠️ Technical Implementation
- Enhanced `PUT /api/tasks/[id]` with reassignment detection and notifications
- Updated `updateTaskSchema` to include `assignedTo` field validation
- **Database Schema**: Added `TASK_REASSIGNED` to `NotificationType` enum
- Improved notification polling system with automatic background refresh
- Enhanced debug logging for troubleshooting notification delivery

### 📋 User Experience
- Parents can easily reassign tasks when family schedules change
- Children receive clear notifications about task reassignments
- Seamless role-based navigation preserves appropriate access levels
- Complete audit trail maintains transparency for all reassignment activity
- Responsive design works perfectly on mobile and desktop devices

## [1.0.28] - 2025-06-05

### ✨ New Features
- **NEW:** Add Points functionality in Rewards Shop for parents
- Parents can now both ADD and DEDUCT points for any family member
- Action toggle with visual icons: 💰 Add Points / 🎁 Deduct Points
- Smart filtering shows all family members for both add and deduct actions
- Dynamic button styling: green for add, red for deduct operations

### 🔧 Improvements
- **Enhanced Rewards Shop**: Complete redesign with dual add/deduct functionality
- **Visual Indicators**: Clear icons and color coding for different point actions
- **Smart Balance Preview**: Shows "total" vs "remaining" points based on action
- **All Family Members**: Dropdown now includes parents and children (not just kids)
- **Full Audit Trail**: All add/deduct transactions visible in Family Points History

### 🛠️ Technical Changes
- Created new `/api/points/add` endpoint for positive point transactions
- Updated RewardShop component with action state management
- Enhanced UI with conditional styling and dynamic form validation
- Improved balance calculation logic for both add and deduct scenarios
- Added "Bonus Points: {reason}" format for add transactions in audit trail

### 📋 User Experience
- Parents can reward good behavior, extra chores, birthdays with bonus points
- Comprehensive family point management for all members regardless of role
- Real-time balance preview shows expected outcome before submission
- Clear distinction between earning points (add) and spending points (deduct)
- Maintains existing validation: cannot deduct more points than available

## [1.0.27] - 2025-06-04

### 🚨 Critical Hotfix - Family Points History Audit Trail
- **CRITICAL FIX:** Restored visibility of deleted tasks in Family Points History
- Parents can now see complete audit trail when verified tasks are deleted
- Fixed issue where task deletions disappeared entirely from family transaction history
- **Enhanced Display**: Clear labeling distinguishes original task completion from deletion transactions

### 🐛 Bug Fix Details
- **Root Cause**: Previous fix correctly solved points math but eliminated audit trail visibility
- **Solution**: Preserve both original transaction and reversal entry with proper labeling
- **Audit Trail**: Original entry shows "(task deleted)", reversal entry shows "(task deletion)"
- **Math Maintained**: Net balance still correctly returns to original state (0 change)

### 🔧 Improvements
- Enhanced Family Points History component to clearly label deleted task transactions
- Improved individual points history display for task deletion entries
- Better visual indicators: gray italic for deleted tasks, red for deletion transactions
- Comprehensive transaction history preserves all family financial activity

### 🛠️ Technical Changes
- Create reversal entry without taskId to preserve for audit trail
- Update original entry to remove task reference while preserving transaction
- Enhanced UI components to handle both transaction types elegantly
- Updated unit tests to verify complete audit trail preservation

## [1.0.26] - 2025-06-04

### 🚨 Critical Hotfix - Points Calculation Bug
- **CRITICAL FIX:** Fixed incorrect points calculation when deleting verified tasks
- Users no longer lose extra points when tasks are deleted after verification
- Resolved double-deduction issue where points were incorrectly subtracted twice
- **Example**: Deleting a verified 5-point task now correctly returns balance to original state instead of -5 points

### 🐛 Bug Fix Details
- **Root Cause**: Task deletion created reversal entry (-5) then deleted original entry (+5), leaving user with net -5
- **Solution**: Enhanced logic to preserve complete audit trail while maintaining correct math
- **Math Fixed**: 0 + 5 (verify) - 5 (delete) = 0 ✅ (was previously = -5 ❌)
- Complete audit trail with proper transaction labeling

### 🛠️ Technical Changes
- Updated `/src/app/api/tasks/[id]/route.ts` deletion logic
- Implemented proper reversal entry creation with audit trail preservation
- Updated unit tests to match new expected behavior
- Maintains proper points tracking and family-based authorization

## [1.0.25] - 2025-06-04

### ✨ New Features
- **NEW:** Family member dropdown filter for Compact dashboard view
- Parents can now filter tasks by specific family members using dropdown selector
- Shows "All Members", "My Tasks", and individual family members with their roles
- Children do not see the dropdown (parent-only feature for family management)

### 🔧 Improvements
- Enhanced Compact dashboard filtering with granular family member selection
- Improved task visibility and organization for parents managing family tasks
- Smart UI that hides "Only Mine" toggle when specific family member is selected
- Seamless integration with existing Compact dashboard filter system

### 🛠️ Technical
- Reuses existing `/api/families/members` endpoint for efficiency
- TypeScript interfaces for type-safe family member data handling
- Optimized rendering with proper memoization and dependency management
- Clean code with no lint errors and proper error handling

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