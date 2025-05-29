import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load and display main content', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads
    await expect(page).toHaveTitle(/ourStories/)

    // Check main heading
    await expect(
      page.getByRole('heading', { name: 'ourStories' })
    ).toBeVisible()

    // Check description text
    await expect(
      page.getByText('Create magical, one-of-a-kind storybooks')
    ).toBeVisible()

    // Check main CTA buttons
    await expect(
      page.getByRole('button', { name: 'Create Your Book' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'View Examples' })
    ).toBeVisible()

    // Check feature cards
    await expect(page.getByText('AI-Powered Illustrations')).toBeVisible()
    await expect(page.getByText('Unique Stories')).toBeVisible()
    await expect(page.getByText('Print & Digital')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check that content is still visible on mobile
    await expect(
      page.getByRole('heading', { name: 'ourStories' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Create Your Book' })
    ).toBeVisible()
  })

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/')

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute(
      'content',
      /Create magical, one-of-a-kind storybooks/
    )

    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /ourStories/)
  })
})
