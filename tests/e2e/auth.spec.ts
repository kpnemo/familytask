import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.context().clearCookies()
  })

  test('should register new user and create family', async ({ page }) => {
    await page.goto('/register')

    // Fill registration form
    await page.fill('input[name="email"]', 'newuser@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'New Test User')
    
    // Select create new family
    await page.check('input[value="create"]')
    await page.fill('input[name="familyName"]', 'Test Family')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Should see welcome message
    await expect(page.locator('text=Welcome')).toBeVisible()
  })

  test('should login existing user', async ({ page }) => {
    // First register a user (this could be done in beforeEach if we had test data setup)
    await page.goto('/register')
    await page.fill('input[name="email"]', 'testlogin@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'Test Login User')
    await page.check('input[value="create"]')
    await page.fill('input[name="familyName"]', 'Login Test Family')
    await page.click('button[type="submit"]')
    
    // Logout
    await page.click('[data-testid="user-menu-trigger"]')
    await page.click('text=Logout')

    // Now test login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'testlogin@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Test Login User')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'invalid@test.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should redirect to login when accessing protected page', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('should join existing family with family code', async ({ page }) => {
    // First create a family
    await page.goto('/register')
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'Admin User')
    await page.check('input[value="create"]')
    await page.fill('input[name="familyName"]', 'Join Test Family')
    await page.click('button[type="submit"]')

    // Get family code from settings
    await page.goto('/settings')
    const familyCode = await page.locator('[data-testid="family-code"]').textContent()
    
    // Logout
    await page.click('[data-testid="user-menu-trigger"]')
    await page.click('text=Logout')

    // Register new user to join family
    await page.goto('/register')
    await page.fill('input[name="email"]', 'child@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.fill('input[name="name"]', 'Child User')
    await page.check('input[value="join"]')
    await page.fill('input[name="familyCode"]', familyCode || '')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Verify joined the right family
    await page.goto('/settings')
    await expect(page.locator('text=Join Test Family')).toBeVisible()
  })
})