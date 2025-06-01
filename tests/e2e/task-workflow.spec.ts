import { test, expect } from '@playwright/test'

test.describe('Task Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('complete task workflow: create → assign → complete → verify', async ({ page, browser }) => {
    // Create parent user
    await page.goto('/register')
    await page.fill('input[name="email"]', 'parent@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'Parent User')
    await page.check('input[value="create"]')
    await page.fill('input[name="familyName"]', 'Task Test Family')
    await page.click('button[type="submit"]')

    // Get family code
    await page.goto('/settings')
    const familyCode = await page.locator('[data-testid="family-code"]').textContent()

    // Create child user in new context
    const childContext = await browser.newContext()
    const childPage = await childContext.newPage()
    
    await childPage.goto('/register')
    await childPage.fill('input[name="email"]', 'child@test.com')
    await childPage.fill('input[name="password"]', 'testpassword')
    await childPage.fill('input[name="name"]', 'Child User')
    await childPage.check('input[value="join"]')
    await childPage.fill('input[name="familyCode"]', familyCode || '')
    await childPage.click('button[type="submit"]')

    // Parent creates task
    await page.goto('/tasks/new')
    await page.fill('input[name="title"]', 'Clean Your Room')
    await page.fill('textarea[name="description"]', 'Clean and organize your bedroom')
    await page.fill('input[name="points"]', '10')
    
    // Set due date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    await page.fill('input[name="dueDate"]', tomorrowStr)
    
    // Select child as assignee
    await page.selectOption('select[name="assignedTo"]', { label: 'Child User' })
    
    await page.click('button[type="submit"]')

    // Should redirect to tasks page
    await expect(page).toHaveURL('/tasks')
    await expect(page.locator('text=Clean Your Room')).toBeVisible()

    // Child should see the task and notification
    await childPage.goto('/dashboard')
    
    // Check for notification bell
    const notificationBell = childPage.locator('[data-testid="notification-bell"]')
    await expect(notificationBell).toBeVisible()
    
    // Click notification bell to see task assignment
    await notificationBell.click()
    await expect(childPage.locator('text=New Task Assigned')).toBeVisible()
    await expect(childPage.locator('text=Clean Your Room')).toBeVisible()

    // Click task link in notification to go to task details
    await childPage.click('text=📝 Task: Clean Your Room')
    
    // Child completes the task
    await expect(childPage.locator('text=Complete Task')).toBeVisible()
    await childPage.click('button:has-text("Complete Task")')

    // Should see task status changed
    await expect(childPage.locator('text=COMPLETED')).toBeVisible()
    await expect(childPage.locator('text=Complete Task')).not.toBeVisible()

    // Parent should see notification about completion
    await page.goto('/dashboard')
    const parentNotificationBell = page.locator('[data-testid="notification-bell"]')
    await expect(parentNotificationBell).toBeVisible()
    
    await parentNotificationBell.click()
    await expect(page.locator('text=Task Completed')).toBeVisible()
    
    // Click task link to go to verification
    await page.click('text=📝 Task: Clean Your Room')

    // Parent verifies the task
    await expect(page.locator('text=Verify Task')).toBeVisible()
    await expect(page.locator('text=Decline Task')).toBeVisible()
    
    await page.click('button:has-text("Verify Task")')

    // Should see task status changed to verified
    await expect(page.locator('text=VERIFIED')).toBeVisible()
    await expect(page.locator('text=Verify Task')).not.toBeVisible()

    // Child should have points added
    await childPage.goto('/points')
    await expect(childPage.locator('text=10')).toBeVisible() // Points balance
    
    // Should see points history
    await expect(childPage.locator('text=Task completed: Clean Your Room')).toBeVisible()

    await childContext.close()
  })

  test('parent can decline completed task', async ({ page, browser }) => {
    // Setup similar to above test
    await page.goto('/register')
    await page.fill('input[name="email"]', 'parent2@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'Parent User 2')
    await page.check('input[value="create"]')
    await page.fill('input[name="familyName"]', 'Decline Test Family')
    await page.click('button[type="submit"]')

    await page.goto('/settings')
    const familyCode = await page.locator('[data-testid="family-code"]').textContent()

    const childContext = await browser.newContext()
    const childPage = await childContext.newPage()
    
    await childPage.goto('/register')
    await childPage.fill('input[name="email"]', 'child2@test.com')
    await childPage.fill('input[name="password"]', 'testpassword')
    await childPage.fill('input[name="name"]', 'Child User 2')
    await childPage.check('input[value="join"]')
    await childPage.fill('input[name="familyCode"]', familyCode || '')
    await childPage.click('button[type="submit"]')

    // Create and complete task
    await page.goto('/tasks/new')
    await page.fill('input[name="title"]', 'Take Out Trash')
    await page.fill('input[name="points"]', '5')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.fill('input[name="dueDate"]', tomorrow.toISOString().split('T')[0])
    await page.selectOption('select[name="assignedTo"]', { label: 'Child User 2' })
    await page.click('button[type="submit"]')

    // Child completes task
    await childPage.goto('/tasks')
    await childPage.click('text=Take Out Trash')
    await childPage.click('button:has-text("Complete Task")')

    // Parent declines task
    await page.goto('/tasks')
    await page.click('text=Take Out Trash')
    
    await page.click('button:has-text("Decline Task")')
    
    // Confirm decline
    await page.click('button:has-text("OK")')

    // Task should be back to pending
    await expect(page.locator('text=PENDING')).toBeVisible()
    
    // Child should be able to complete again
    await childPage.reload()
    await expect(childPage.locator('text=Complete Task')).toBeVisible()

    await childContext.close()
  })

  test('only assignee can complete task', async ({ page, browser }) => {
    // Create family with two children
    await page.goto('/register')
    await page.fill('input[name="email"]', 'parent3@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'Parent User 3')
    await page.check('input[value="create"]')
    await page.fill('input[name="familyName"]', 'Permission Test Family')
    await page.click('button[type="submit"]')

    await page.goto('/settings')
    const familyCode = await page.locator('[data-testid="family-code"]').textContent()

    // Create first child
    const child1Context = await browser.newContext()
    const child1Page = await child1Context.newPage()
    
    await child1Page.goto('/register')
    await child1Page.fill('input[name="email"]', 'child1@test.com')
    await child1Page.fill('input[name="password"]', 'testpassword')
    await child1Page.fill('input[name="name"]', 'Child One')
    await child1Page.check('input[value="join"]')
    await child1Page.fill('input[name="familyCode"]', familyCode || '')
    await child1Page.click('button[type="submit"]')

    // Create second child
    const child2Context = await browser.newContext()
    const child2Page = await child2Context.newPage()
    
    await child2Page.goto('/register')
    await child2Page.fill('input[name="email"]', 'child2@test.com')
    await child2Page.fill('input[name="password"]', 'testpassword')
    await child2Page.fill('input[name="name"]', 'Child Two')
    await child2Page.check('input[value="join"]')
    await child2Page.fill('input[name="familyCode"]', familyCode || '')
    await child2Page.click('button[type="submit"]')

    // Parent assigns task to child 1
    await page.goto('/tasks/new')
    await page.fill('input[name="title"]', 'Child One Task')
    await page.fill('input[name="points"]', '5')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.fill('input[name="dueDate"]', tomorrow.toISOString().split('T')[0])
    await page.selectOption('select[name="assignedTo"]', { label: 'Child One' })
    await page.click('button[type="submit"]')

    // Child 1 should see complete button
    await child1Page.goto('/tasks')
    await child1Page.click('text=Child One Task')
    await expect(child1Page.locator('text=Complete Task')).toBeVisible()

    // Child 2 should NOT see complete button
    await child2Page.goto('/tasks')
    await child2Page.click('text=Child One Task')
    await expect(child2Page.locator('text=Complete Task')).not.toBeVisible()

    await child1Context.close()
    await child2Context.close()
  })
})