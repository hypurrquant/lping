import { test } from '@playwright/test'

test('Layout screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('http://localhost:4000/analyze')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Click first pool
  await page.locator('tbody tr').first().click()
  await page.waitForTimeout(2000)

  await page.screenshot({ path: 'test/e2e/screenshots/analyze-layout.png' })
  console.log('Screenshot saved')
})
