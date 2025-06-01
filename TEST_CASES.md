# FamilyTasks - Test Cases

## Pre-Deployment Testing Checklist

This document outlines comprehensive test cases to be executed before each deployment to ensure all functionality works correctly across different user roles and scenarios.

## Test Environment Setup

### Prerequisites
- Local development server running (`npm run dev`)
- Test database with sample data
- Multiple user accounts with different roles:
  - Admin Parent: `admin@test.com`
  - Parent: `parent@test.com`  
  - Child: `child@test.com`

### Sample Test Data
- Family: "Test Family" with code "TEST1234"
- Sample tasks in different states (PENDING, COMPLETED, VERIFIED)
- Points history with both earnings and deductions
- Notifications for different scenarios

## Test Cases by Feature

### 1. Authentication & User Management

#### TC-001: User Registration
**Steps:**
1. Navigate to `/register`
2. Fill in registration form with valid data
3. Choose "Create new family" option
4. Submit form
5. Verify redirect to dashboard
6. Check family code is generated and displayed

**Expected Results:**
- User successfully registered
- Family created with unique 8-character code
- User becomes Admin Parent
- Redirected to dashboard

#### TC-002: Family Code Join
**Steps:**
1. Register new user with existing family code
2. Choose "Join existing family" option
3. Enter valid family code
4. Submit form
5. Verify user added to family

**Expected Results:**
- User successfully joins existing family
- User appears in family member list
- Appropriate role assigned

#### TC-003: Login/Logout
**Steps:**
1. Navigate to `/login`
2. Enter valid credentials
3. Verify dashboard access
4. Click logout from user menu
5. Verify redirect to login

**Expected Results:**
- Successful authentication
- Session maintained across page refreshes
- Proper logout and session cleanup

### 2. Task Management

#### TC-004: Create Task (Parent)
**Steps:**
1. Login as parent
2. Navigate to `/tasks/new`
3. Fill task form with:
   - Title: "Test Task"
   - Description: "Test description"
   - Points: 5
   - Due date: Tomorrow
   - Assign to child
4. Submit form

**Expected Results:**
- Task created successfully
- Task appears in task list
- Child receives notification
- Task status is PENDING

#### TC-005: Complete Task (Child)
**Steps:**
1. Login as child (assignee)
2. Navigate to `/tasks/[id]` for pending task
3. Click "Complete Task" button
4. Verify status change

**Expected Results:**
- Task status changes to COMPLETED
- Parent receives notification
- Completion timestamp recorded
- "Verify Task" button appears for parent

#### TC-006: Verify Task (Parent)
**Steps:**
1. Login as parent
2. Navigate to completed task
3. Click "Verify Task" button
4. Check points history

**Expected Results:**
- Task status changes to VERIFIED
- Points added to child's balance
- Points history entry created
- Child receives notification

#### TC-007: Decline Task (Parent)
**Steps:**
1. Login as parent
2. Navigate to completed task
3. Click "Decline Task" button
4. Confirm action

**Expected Results:**
- Task status changes back to PENDING
- Child receives notification
- No points awarded
- Child can complete task again

#### TC-008: Edit Task
**Steps:**
1. Login as task creator
2. Navigate to pending task
3. Click "Edit Task" link
4. Modify task details
5. Save changes

**Expected Results:**
- Task details updated
- Changes reflected in task list
- Edit only available for pending tasks
- Only creator can edit

### 3. Points System & Reward Shop

#### TC-009: Points Calculation
**Steps:**
1. Check child's current points balance
2. Complete and verify a 5-point task
3. Check updated balance

**Expected Results:**
- Balance increases by exactly 5 points
- Transaction recorded in points history
- Leaderboard updated

#### TC-010: Reward Shop - Points Deduction (Parent)
**Steps:**
1. Login as parent
2. Navigate to `/points`
3. Select child with points
4. Enter deduction amount (less than balance)
5. Enter reason: "Ice cream reward"
6. Submit deduction

**Expected Results:**
- Points deducted from child's balance
- Transaction recorded with negative points
- Reason stored: "Reward Shop: Ice cream reward"
- Balance updated in real-time
- Points history shows before/after amounts

#### TC-011: Reward Shop - Insufficient Points
**Steps:**
1. Login as parent
2. Try to deduct more points than child has
3. Verify error handling

**Expected Results:**
- Error message: "User only has X points available"
- Deduction prevented
- No points removed

#### TC-012: Points History Display
**Steps:**
1. Navigate to `/points`
2. Check points history section
3. Verify transaction details

**Expected Results:**
- All transactions displayed chronologically
- Shows date, creator, amount, reason
- Running balance calculated correctly
- Task completions and reward shop deductions both visible

### 4. Notifications System

#### TC-013: Task Assignment Notification
**Steps:**
1. Parent creates task assigned to child
2. Login as child
3. Check notification bell

**Expected Results:**
- Notification bell shows unread count
- Notification appears with task details
- Title: "New Task Assigned"
- Can click task link to view details

#### TC-014: Task Completion Notification
**Steps:**
1. Child completes task
2. Login as parent
3. Check notifications

**Expected Results:**
- Parent receives completion notification
- Can click task link to verify/decline
- Notification shows task title

#### TC-015: Notification Management
**Steps:**
1. Click notification bell
2. Mark individual notification as read
3. Delete individual notification with X button
4. Use "Clear All" button

**Expected Results:**
- Individual mark as read works
- X button deletes notification
- Clear All removes all notifications
- Unread count updates correctly

#### TC-016: Clickable Task Notifications
**Steps:**
1. Receive task-related notification
2. Click "📝 Task: [Task Name]" link
3. Verify navigation

**Expected Results:**
- Navigates to `/tasks/[id]`
- Notification popup closes
- Task details page loads with correct task

### 5. Family Management

#### TC-017: View Family Members (All Roles)
**Steps:**
1. Navigate to `/settings`
2. Check family members section
3. Test with different user roles

**Expected Results:**
- **Kids:** Read-only list of family members
- **Parents:** Can see edit/remove buttons
- **All:** See names, roles, join dates

#### TC-018: Edit Member Name (Parent)
**Steps:**
1. Login as parent
2. Navigate to `/settings`
3. Click edit button for family member
4. Change name and save

**Expected Results:**
- Name updated across all views
- Change reflected immediately
- Only parents can edit names

#### TC-019: Remove Family Member (Parent)
**Steps:**
1. Login as parent
2. Navigate to `/settings`
3. Click remove button for member
4. Confirm removal

**Expected Results:**
- Member removed from family
- Cannot remove self
- Admin restrictions enforced
- Confirmation dialog appears

### 6. Settings & Profile Management

#### TC-020: Change Email
**Steps:**
1. Navigate to `/settings`
2. Click "Change Email" button
3. Enter new email and password
4. Submit form

**Expected Results:**
- Email updated successfully
- Can login with new email
- Old email no longer works

#### TC-021: Change Password
**Steps:**
1. Navigate to `/settings`
2. Click "Change Password" button
3. Enter current and new password
4. Submit form

**Expected Results:**
- Password updated successfully
- Can login with new password
- Old password no longer works

### 7. Role-Based UI Testing

#### TC-022: Points Page - Role Differences
**Steps:**
1. Login as parent, check `/points`
2. Login as child, check `/points`
3. Compare visible sections

**Expected Results:**
- **Parent:** Sees reward shop section
- **Child:** Reward shop section hidden
- **Both:** See current points and leaderboard
- **Both:** See points history

#### TC-023: Task Actions - Role-Based
**Steps:**
1. Navigate to same task with different roles
2. Check available actions

**Expected Results:**
- **Assignee:** "Complete Task" (if pending)
- **Parent:** "Verify/Decline Task" (if completed)
- **Creator:** "Edit Task" (if pending)
- **Others:** Read-only view

### 8. Navigation & UI

#### TC-024: Header Navigation
**Steps:**
1. Check header on all pages
2. Test notification bell
3. Test settings link
4. Test user menu

**Expected Results:**
- Header consistent across all pages
- Back button appears where appropriate
- All navigation links work
- User menu shows correct options

#### TC-025: Responsive Design
**Steps:**
1. Test application on mobile viewport
2. Test on tablet viewport
3. Test on desktop

**Expected Results:**
- Layout adapts to screen size
- All functionality accessible
- Text readable at all sizes
- Buttons properly sized for touch

### 9. Error Handling & Edge Cases

#### TC-026: Invalid Task ID
**Steps:**
1. Navigate to `/tasks/invalid-id`
2. Check error handling

**Expected Results:**
- 404 page displayed
- Graceful error handling
- User can navigate back

#### TC-027: Unauthorized Access
**Steps:**
1. Try to access admin-only functions as child
2. Try to edit other family's tasks

**Expected Results:**
- Proper permission checks
- Redirect or error message
- No data leakage

#### TC-028: Network Error Handling
**Steps:**
1. Disconnect network during form submission
2. Try various API calls

**Expected Results:**
- User-friendly error messages
- Retry mechanisms where appropriate
- No data loss on temporary failures

### 10. Performance & Load Testing

#### TC-029: Page Load Times
**Steps:**
1. Measure page load times for all routes
2. Check with various amounts of data

**Expected Results:**
- All pages load within 3 seconds
- No performance degradation with more data
- Proper loading states displayed

#### TC-030: Concurrent User Actions
**Steps:**
1. Multiple family members perform actions simultaneously
2. Check data consistency

**Expected Results:**
- No race conditions
- Data remains consistent
- All users see updates

## Testing Checklist Template

### Pre-Deployment Verification

**Build & Environment:**
- [ ] `npm run build` succeeds without errors
- [ ] Environment variables properly configured
- [ ] Database migrations applied

**Core Functionality:**
- [ ] User authentication works (TC-001, TC-003)
- [ ] Task workflow complete (TC-004, TC-005, TC-006)
- [ ] Points system accurate (TC-009, TC-010, TC-012)
- [ ] Notifications functional (TC-013, TC-014, TC-015, TC-016)

**Role-Based Features:**
- [ ] Parent reward shop access (TC-010)
- [ ] Child reward shop hidden (TC-022)
- [ ] Family member management (TC-017, TC-018, TC-019)
- [ ] Task actions by role (TC-023)

**UI & Navigation:**
- [ ] All pages load correctly (TC-024)
- [ ] Responsive design works (TC-025)
- [ ] Error handling graceful (TC-026, TC-027)

**Critical User Journeys:**
- [ ] New family creation and member invitation
- [ ] Complete task workflow (create → assign → complete → verify)
- [ ] Points earning and reward shop deduction
- [ ] Notification click-to-task navigation

### Quick Smoke Test (5 minutes)

1. **Login** as different roles
2. **Create task** as parent
3. **Complete task** as child
4. **Verify task** as parent
5. **Check points** increase
6. **Use reward shop** to deduct points
7. **Click notification** to navigate to task
8. **Edit family member** name
9. **Navigate** between all main pages

### Regression Test (15 minutes)

Run full test suite focusing on:
- Recently changed functionality
- Critical path scenarios
- Cross-role interactions
- Data integrity checks

## Test Data Setup Script

```sql
-- Sample test data for comprehensive testing

-- Users
INSERT INTO users (id, email, name, password_hash, role) VALUES
  ('admin-id', 'admin@test.com', 'Admin Parent', 'hashed-password', 'PARENT'),
  ('parent-id', 'parent@test.com', 'Test Parent', 'hashed-password', 'PARENT'),
  ('child-id', 'child@test.com', 'Test Child', 'hashed-password', 'CHILD');

-- Family
INSERT INTO families (id, name, family_code) VALUES
  ('family-id', 'Test Family', 'TEST1234');

-- Family Members
INSERT INTO family_members (id, family_id, user_id, role) VALUES
  ('admin-member-id', 'family-id', 'admin-id', 'ADMIN_PARENT'),
  ('parent-member-id', 'family-id', 'parent-id', 'PARENT'),
  ('child-member-id', 'family-id', 'child-id', 'CHILD');

-- Sample Tasks
INSERT INTO tasks (id, title, description, points, due_date, status, created_by, assigned_to, family_id) VALUES
  ('pending-task', 'Clean Room', 'Clean and organize bedroom', 5, NOW() + INTERVAL '1 day', 'PENDING', 'admin-id', 'child-id', 'family-id'),
  ('completed-task', 'Take Out Trash', 'Empty all trash bins', 3, NOW() + INTERVAL '1 day', 'COMPLETED', 'parent-id', 'child-id', 'family-id'),
  ('verified-task', 'Load Dishwasher', 'Load and start dishwasher', 4, NOW() - INTERVAL '1 day', 'VERIFIED', 'admin-id', 'child-id', 'family-id');

-- Points History
INSERT INTO points_history (id, user_id, family_id, points, reason, created_by) VALUES
  ('points-1', 'child-id', 'family-id', 4, 'Task completed: Load Dishwasher', 'admin-id'),
  ('points-2', 'child-id', 'family-id', -2, 'Reward Shop: Candy', 'parent-id');

-- Notifications
INSERT INTO notifications (id, user_id, title, message, type, related_task_id) VALUES
  ('notif-1', 'child-id', 'New Task Assigned', 'You have been assigned: Clean Room', 'TASK_ASSIGNED', 'pending-task'),
  ('notif-2', 'parent-id', 'Task Completed', 'Test Child completed: Take Out Trash', 'TASK_COMPLETED', 'completed-task');
```

## Automated Testing Integration

### GitHub Actions Workflow

```yaml
name: Pre-Deployment Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run build
        run: npm run build
      - name: Run tests
        run: npm test
      - name: Run Lighthouse CI
        run: npx lhci autorun
```

This comprehensive testing strategy ensures all functionality works correctly before deployment and helps maintain high code quality across development iterations.