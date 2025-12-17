import { test, expect } from '@playwright/test'

test('Analyze page full verification', async ({ page }) => {
  test.setTimeout(60000)

  const errors: string[] = []
  page.on('pageerror', err => errors.push(err.message))

  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('http://localhost:4000/analyze')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║              ANALYZE PAGE VERIFICATION                       ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')

  // 1. Check header elements
  const checks = {
    'Page Title (Pool Analysis)': await page.locator('h1').filter({ hasText: 'Pool Analysis' }).isVisible(),
    'AERO Price Display': await page.locator('text=AERO:').isVisible(),
    'Total TVL Card': await page.locator('text=Total TVL').isVisible(),
    'Daily Emissions Card': await page.locator('text=Daily Emissions').isVisible(),
    'Sort Buttons': await page.locator('text=APR').first().isVisible(),
  }

  // 2. Check table
  const poolCount = await page.locator('tbody tr').count()
  checks['Pool Table Loaded'] = poolCount > 0

  // 3. Select a pool and check simulator
  if (poolCount > 0) {
    await page.locator('tbody tr').first().click()
    await page.waitForTimeout(2000)

    checks['Pool Details Panel'] = await page.locator('text=APR Breakdown').isVisible()
    checks['Investment Simulator'] = await page.locator('text=Investment Simulator').isVisible()
    checks['Expected Returns Section'] = await page.locator('text=Expected Returns').isVisible()
    checks['AERO Rewards Section'] = await page.locator('text=AERO Rewards').isVisible()
  }

  // Print results
  let allPassed = true
  for (const [check, passed] of Object.entries(checks)) {
    const status = passed ? '✅' : '❌'
    if (!passed) allPassed = false
    console.log(`║  ${status} ${check.padEnd(45)}║`)
  }

  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log(`║  Pools Loaded: ${poolCount.toString().padEnd(44)}║`)
  console.log(`║  Page Errors: ${errors.length.toString().padEnd(45)}║`)
  console.log('╠══════════════════════════════════════════════════════════════╣')

  if (allPassed && errors.length === 0) {
    console.log('║  🎉 ALL VERIFICATIONS PASSED - NO ERRORS                     ║')
  } else {
    console.log('║  ⚠️  SOME CHECKS FAILED                                       ║')
  }
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  expect(allPassed).toBe(true)
  expect(errors.length).toBe(0)
})
