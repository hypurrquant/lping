import { test, expect } from '@playwright/test'

test('Pool Explorer Summary Test', async ({ page }) => {
  test.setTimeout(120000)

  const errors: string[] = []
  page.on('pageerror', err => errors.push(err.message))

  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // Select WETH/USDC pool
  await page.locator('button').filter({ hasText: 'WETH/USDC' }).first().click()
  await page.waitForTimeout(20000)

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║           POOL EXPLORER VERIFICATION SUMMARY                 ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')

  // Check all critical elements
  const results = {
    'Pool List Loaded': await page.locator('text=Available Pools').isVisible(),
    'WETH/USDC Pool Header': await page.locator('h2').filter({ hasText: 'WETH/USDC' }).isVisible(),
    'Tick Spacing Info': await page.locator('text=Tick Spacing: 100').isVisible(),
    'Total APR Display': await page.locator('text=Total APR').first().isVisible(),
    'Liquidity Distribution Chart': await page.locator('h3').filter({ hasText: 'Liquidity Distribution' }).isVisible(),
    'Current Price': await page.locator('text=Current Price').first().isVisible(),
    'Emission Range': await page.locator('text=Emission Range').first().isVisible(),
    'Liquidity in Range Stat': await page.locator('text=Liquidity in Range').isVisible(),
    'Active Ticks Stat': await page.locator('text=Active Ticks').isVisible(),
    'Recharts Component': (await page.locator('[class*="recharts"]').count()) > 0,
    'Create Position Button': await page.locator('button').filter({ hasText: 'Create Position' }).isVisible(),
  }

  let allPassed = true
  for (const [check, passed] of Object.entries(results)) {
    const status = passed ? '✅' : '❌'
    if (!passed) allPassed = false
    console.log(`║  ${status} ${check.padEnd(40)}${passed ? 'PASS' : 'FAIL'}    ║`)
  }

  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log(`║  Page Errors: ${errors.length.toString().padEnd(46)}║`)
  console.log('╠══════════════════════════════════════════════════════════════╣')

  if (allPassed && errors.length === 0) {
    console.log('║  🎉 ALL VERIFICATIONS PASSED - NO ERRORS DETECTED            ║')
  } else {
    console.log('║  ⚠️  SOME CHECKS FAILED                                       ║')
  }

  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  expect(allPassed).toBe(true)
  expect(errors.length).toBe(0)
})
