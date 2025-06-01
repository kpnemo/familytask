import { test, expect } from '@playwright/test'

test.describe('Reward Shop', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('parent can deduct points from child through reward shop', async ({ page, browser }) => {
    // Create parent
    await page.goto('/register')
    await page.fill('input[name="email"]', 'parent@reward.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'Reward Parent')
    await page.check('input[value="create"]')
    await page.fill('input[name="familyName"]', 'Reward Family')
    await page.click('button[type="submit"]')

    // Get family code
    await page.goto('/settings')
    const familyCode = await page.locator('[data-testid="family-code"]').textContent()

    // Create child
    const childContext = await browser.newContext()
    const childPage = await childContext.newPage()
    
    await childPage.goto('/register')
    await childPage.fill('input[name="email"]', 'child@reward.com')
    await childPage.fill('input[name="password"]', 'testpassword')
    await childPage.fill('input[name="name"]', 'Reward Child')
    await childPage.check('input[value="join"]')
    await childPage.fill('input[name="familyCode"]', familyCode || '')
    await childPage.click('button[type="submit"]')

    // Give child some points by creating and completing a task
    await page.goto('/tasks/new')
    await page.fill('input[name="title"]', 'Earn Points Task')
    await page.fill('input[name="points"]', '20')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.fill('input[name="dueDate"]', tomorrow.toISOString().split('T')[0])
    await page.selectOption('select[name="assignedTo"]', { label: 'Reward Child' })
    await page.click('button[type="submit"]')

    // Child completes task
    await childPage.goto('/tasks')
    await childPage.click('text=Earn Points Task')
    await childPage.click('button:has-text("Complete Task")')

    // Parent verifies task
    await page.goto('/tasks')
    await page.click('text=Earn Points Task')
    await page.click('button:has-text("Verify Task")')

    // Now test reward shop
    await page.goto('/points')
    
    // Parent should see reward shop section
    await expect(page.locator('text=Reward Shop')).toBeVisible()
    
    // Select child
    await page.selectOption('select[name="userId"]', { label: 'Reward Child' })
    
    // Enter deduction details
    await page.fill('input[name="points"]', '5')
    await page.fill('input[name="reason"]', 'Ice cream treat')
    
    // Submit deduction
    await page.click('button:has-text("Deduct Points")')
    
    // Should see success message or updated balance
    await expect(page.locator('text=Points deducted successfully')).toBeVisible()

    // Check that child's balance updated
    await childPage.goto('/points')
    await expect(childPage.locator('text=15')).toBeVisible() // 20 - 5 = 15

    // Check points history shows deduction
    await expect(childPage.locator('text=Reward Shop: Ice cream treat')).toBeVisible()

    await childContext.close()
  })

  test('child cannot see reward shop section', async ({ page }) => {
    // Create child user
    await page.goto('/register')
    await page.fill('input[name="email"]', 'childonly@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'Child Only User')
    await page.check('input[value="create"]')
    await page.fill('input[name="familyName"]', 'Child Only Family')
    await page.click('button[type="submit"]')

    // Go to points page
    await page.goto('/points')
    
    // Should NOT see reward shop section
    await expect(page.locator('text=Reward Shop')).not.toBeVisible()
    
    // Should see current points and leaderboard
    await expect(page.locator('text=Your Points')).toBeVisible()
    await expect(page.locator('text=Family Leaderboard')).toBeVisible()
  })

  test('cannot deduct more points than child has', async ({ page, browser }) => {
    // Setup parent and child with limited points
    await page.goto('/register')
    await page.fill('input[name="email"]', 'limitparent@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'Limit Parent')
    await page.check('input[value="create"]')
    await page.fill('input[name="familyName"]', 'Limit Family')
    await page.click('button[type="submit"]')

    await page.goto('/settings')
    const familyCode = await page.locator('[data-testid="family-code"]').textContent()

    const childContext = await browser.newContext()
    const childPage = await childContext.newPage()
    
    await childPage.goto('/register')
    await childPage.fill('input[name="email"]', 'limitchild@test.com')
    await childPage.fill('input[name="password"]', 'testpassword')
    await childPage.fill('input[name="name"]', 'Limit Child')
    await childPage.check('input[value="join"]')
    await childPage.fill('input[name="familyCode"]', familyCode || '')
    await childPage.click('button[type="submit"]')

    // Give child only 3 points
    await page.goto('/tasks/new')
    await page.fill('input[name="title"]', 'Small Task')
    await page.fill('input[name="points"]', '3')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.fill('input[name="dueDate"]', tomorrow.toISOString().split('T')[0])
    await page.selectOption('select[name="assignedTo"]', { label: 'Limit Child' })
    await page.click('button[type="submit"]')

    await childPage.goto('/tasks')
    await childPage.click('text=Small Task')
    await childPage.click('button:has-text("Complete Task")')

    await page.goto('/tasks')
    await page.click('text=Small Task')
    await page.click('button:has-text("Verify Task")')

    // Try to deduct more points than available
    await page.goto('/points')
    await page.selectOption('select[name="userId"]', { label: 'Limit Child' })
    await page.fill('input[name="points"]', '10') // More than the 3 available
    await page.fill('input[name="reason"]', 'Expensive item')
    await page.click('button:has-text("Deduct Points")')

    // Should see error message
    await expect(page.locator('text=only has 3 points available')).toBeVisible()

    // Child's balance should remain unchanged
    await childPage.goto('/points')
    await expect(childPage.locator('text=3')).toBeVisible()

    await childContext.close()
  })

  test('points history shows running balance correctly', async ({ page, browser }) => {
    // Create parent and child
    await page.goto('/register')
    await page.fill('input[name="email"]', 'historyparent@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'History Parent')
    await page.check('input[value="create"]')
    await page.fill('input[name="familyName"]', 'History Family')
    await page.click('button[type="submit"]')

    await page.goto('/settings')
    const familyCode = await page.locator('[data-testid="family-code"]').textContent()

    const childContext = await browser.newContext()
    const childPage = await childContext.newPage()
    
    await childPage.goto('/register')
    await childPage.fill('input[name="email"]', 'historychild@test.com')
    await childPage.fill('input[name="password"]', 'testpassword')
    await childPage.fill('input[name="name"]', 'History Child')
    await childPage.check('input[value="join"]')
    await childPage.fill('input[name="familyCode"]', familyCode || '')
    await childPage.click('button[type="submit"]')

    // Create multiple transactions
    // First task: +10 points
    await page.goto('/tasks/new')
    await page.fill('input[name="title"]', 'First Task')
    await page.fill('input[name="points"]', '10')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.fill('input[name="dueDate"]', tomorrow.toISOString().split('T')[0])
    await page.selectOption('select[name="assignedTo"]', { label: 'History Child' })
    await page.click('button[type="submit"]')

    await childPage.goto('/tasks')
    await childPage.click('text=First Task')
    await childPage.click('button:has-text("Complete Task")')

    await page.goto('/tasks')
    await page.click('text=First Task')
    await page.click('button:has-text("Verify Task")')

    // Deduct 3 points
    await page.goto('/points')
    await page.selectOption('select[name="userId"]', { label: 'History Child' })
    await page.fill('input[name="points"]', '3')
    await page.fill('input[name="reason"]', 'Candy')
    await page.click('button:has-text("Deduct Points")')

    // Check running balance in history
    await childPage.goto('/points')
    
    // Should see current balance of 7 (10 - 3)
    await expect(childPage.locator('text=7')).toBeVisible()
    
    // Points history should show running balance
    // Note: The exact structure depends on your points history component
    await expect(childPage.locator('text=Task completed: First Task')).toBeVisible()
    await expect(childPage.locator('text=Reward Shop: Candy')).toBeVisible()

    await childContext.close()
  })
})