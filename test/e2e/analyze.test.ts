import { test, expect } from '@playwright/test'

test('Pool Analysis page functionality', async ({ page }) => {
  test.setTimeout(60000)

  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('http://localhost:4000/analyze')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  console.log('=== Pool Analysis Page Test ===\n')

  // Check summary stats loaded
  const totalTVL = await page.locator('text=Total TVL').isVisible()
  const dailyEmissions = await page.locator('text=Daily Emissions').isVisible()
  const aeroPrice = await page.locator('text=AERO Price').isVisible()

  console.log('Summary Stats:')
  console.log(`  Total TVL: ${totalTVL ? '✅' : '❌'}`)
  console.log(`  Daily Emissions: ${dailyEmissions ? '✅' : '❌'}`)
  console.log(`  AERO Price: ${aeroPrice ? '✅' : '❌'}`)

  // Check pool table
  const poolRows = await page.locator('tbody tr').count()
  console.log(`\nPool Table: ${poolRows} pools loaded`)

  // Get top 3 pool data
  const poolData = await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody tr')
    const data: any[] = []
    rows.forEach((row, i) => {
      if (i < 3) {
        const cells = row.querySelectorAll('td')
        data.push({
          symbol: cells[0]?.querySelector('.font-medium')?.textContent || '',
          tvl: cells[1]?.textContent || '',
          feeAPR: cells[2]?.textContent || '',
          emissionAPR: cells[3]?.textContent || '',
          totalAPR: cells[4]?.textContent || '',
          aeroPerDay: cells[5]?.textContent?.split('\n')[0] || '',
        })
      }
    })
    return data
  })

  console.log('\nTop 3 Pools:')
  poolData.forEach((pool, i) => {
    console.log(`  ${i + 1}. ${pool.symbol}`)
    console.log(`     TVL: ${pool.tvl}`)
    console.log(`     Fee APR: ${pool.feeAPR} | Emission APR: ${pool.emissionAPR}`)
    console.log(`     Total APR: ${pool.totalAPR}`)
    console.log(`     AERO/Day: ${pool.aeroPerDay}`)
  })

  // Click on first pool
  await page.locator('tbody tr').first().click()
  await page.waitForTimeout(2000)

  // Check simulator loaded
  const simulatorVisible = await page.locator('text=Investment Simulator').isVisible()
  console.log(`\nSimulator Panel: ${simulatorVisible ? '✅' : '❌'}`)

  // Check expected returns
  const dailyReturn = await page.locator('text=Daily').first().isVisible()
  const weeklyReturn = await page.locator('text=Weekly').first().isVisible()
  const monthlyReturn = await page.locator('text=Monthly').first().isVisible()

  console.log('Expected Returns:')
  console.log(`  Daily: ${dailyReturn ? '✅' : '❌'}`)
  console.log(`  Weekly: ${weeklyReturn ? '✅' : '❌'}`)
  console.log(`  Monthly: ${monthlyReturn ? '✅' : '❌'}`)

  // Change investment amount
  await page.fill('input[placeholder="10000"]', '50000')
  await page.waitForTimeout(2000)

  // Get simulation results
  const simResults = await page.evaluate(() => {
    const expectedReturns = document.querySelector('.bg-emerald-500\\/10')
    const returns = expectedReturns?.querySelectorAll('.font-bold.text-emerald-400')
    const aeroRewards = document.querySelector('.bg-blue-500\\/10')?.querySelectorAll('.font-bold')

    return {
      daily: returns?.[0]?.textContent || '',
      weekly: returns?.[1]?.textContent || '',
      monthly: returns?.[2]?.textContent || '',
      dailyAero: aeroRewards?.[0]?.textContent || '',
    }
  })

  console.log('\nSimulation Results ($50,000 investment):')
  console.log(`  Daily Return: ${simResults.daily}`)
  console.log(`  Weekly Return: ${simResults.weekly}`)
  console.log(`  Monthly Return: ${simResults.monthly}`)
  console.log(`  Daily AERO: ${simResults.dailyAero}`)

  // Take screenshot
  await page.screenshot({ path: 'test/e2e/screenshots/analyze-page.png', fullPage: true })
  console.log('\n📸 Screenshot saved to test/e2e/screenshots/analyze-page.png')

  // Assertions
  expect(totalTVL).toBe(true)
  expect(poolRows).toBeGreaterThan(0)
  expect(simulatorVisible).toBe(true)

  console.log('\n✅ All tests passed!')
})
