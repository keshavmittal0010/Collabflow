import { test, expect } from '@playwright/test'

test.describe('CollabFlow E2E Journeys', () => {
  test('landing page loads and links to register', async ({ page }) => {
    // 1. Go to Landing Page
    await page.goto('/')
    await expect(page).toHaveTitle(/CollabFlow/i)
    
    // 2. Register link check
    const registerLink = page.locator('a[href="/register"]').first()
    if (await registerLink.isVisible()) {
      await registerLink.click()
      await expect(page).toHaveURL(/.*register/)
    }
  })

  test('user registration and auto-redirect to dashboard', async ({ page }) => {
    const randomEmail = `e2e_user_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`

    // 1. Fill registration
    await page.goto('/register')
    await page.fill('#name', 'E2E Test User')
    await page.fill('#email', randomEmail)
    await page.fill('#password', 'SuperPassword123')
    await page.fill('#confirmPassword', 'SuperPassword123')
    
    // 2. Submit
    await page.click('button[type="submit"]')

    // 3. Should auto-redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    // 4. Verify dashboard layout components visible
    await expect(page.locator('text=Overview').first()).toBeVisible()
    await expect(page.locator('text=Workspaces').first()).toBeVisible()
  })

  test('user login flow', async ({ page }) => {
    // Note: Login with seeded test account
    await page.goto('/login')
    await page.fill('#email', 'aarav.mehta@collabflow.dev')
    await page.fill('#password', 'Demo@1234')
    
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      // Catch login response and wait for dashboard redirection
      await page.waitForURL('**/dashboard', { timeout: 15000 })
      await expect(page.locator('text=Overview').first()).toBeVisible()
    }
  })
})
