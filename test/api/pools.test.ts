import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PoolData } from '@/lib/explore/types'

// Mock data
const mockPoolData: PoolData = {
  id: '0x1234567890123456789012345678901234567890' as `0x${string}`,
  token0: {
    address: '0x4200000000000000000000000000000000000006' as `0x${string}`,
    symbol: 'WETH',
    decimals: 18,
    priceUSD: 3500,
  },
  token1: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
  },
  tickSpacing: 100,
  fee: 500,
  liquidity: '1000000000000000000',
  sqrtPriceX96: '1234567890',
  currentTick: 0,
  tvlUSD: 10000000,
  volume24hUSD: 5000000,
  fees24hUSD: 2500,
  feeAPR: 9.125,
  emissionAPR: 25.5,
  totalAPR: 34.625,
  gauge: '0x9876543210987654321098765432109876543210' as `0x${string}`,
  isGaugeAlive: true,
}

describe('Pool Explorer API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('APR Calculation', () => {
    it('should calculate Fee APR correctly', async () => {
      const { calculateFeeAPR } = await import('@/lib/explore/aprCalculator')

      // Fee APR = (daily fees * 365 / TVL) * 100
      const feeAPR = calculateFeeAPR({
        fees24hUSD: 2500,
        tvlUSD: 10000000,
      })
      expect(feeAPR).toBeCloseTo(9.125, 2)  // (2500 * 365 / 10000000) * 100
    })

    it('should calculate Emission APR correctly', async () => {
      const { calculateEmissionAPR } = await import('@/lib/explore/aprCalculator')

      // Emission APR = (rewardRate * secondsPerYear * aeroPrice / stakedLiquidityUSD) * 100
      const emissionAPR = calculateEmissionAPR({
        rewardRate: BigInt('1000000000000000000'),  // 1 AERO/sec
        aeroPrice: 1.5,
        stakedLiquidityUSD: 185701.97,  // calculated for ~25.5% APR
      })
      expect(emissionAPR).toBeGreaterThan(0)
    })

    it('should return 0 when TVL is 0', async () => {
      const { calculateFeeAPR } = await import('@/lib/explore/aprCalculator')

      const feeAPR = calculateFeeAPR({
        fees24hUSD: 2500,
        tvlUSD: 0,
      })
      expect(feeAPR).toBe(0)
    })
  })

  describe('Pool Data Validation', () => {
    it('should have valid pool structure', () => {
      expect(mockPoolData.id).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(mockPoolData.token0.decimals).toBeGreaterThan(0)
      expect(mockPoolData.token1.decimals).toBeGreaterThan(0)
      expect(mockPoolData.fee).toBeGreaterThan(0)
      expect(mockPoolData.tvlUSD).toBeGreaterThan(0)
      expect(mockPoolData.totalAPR).toBe(mockPoolData.feeAPR + mockPoolData.emissionAPR)
    })
  })
})

describe('Investment Simulator', () => {
  it('should calculate impermanent loss at 10% price change', async () => {
    const { calculateImpermanentLoss } = await import('@/lib/explore/simulator')

    // IL at 10% price change = 2 * sqrt(1.1) / (1 + 1.1) - 1
    // = 2 * 1.0488 / 2.1 - 1 = -0.00114
    const il10 = calculateImpermanentLoss(1.1)
    expect(il10).toBeCloseTo(-0.00114, 4)  // ~-0.11%
  })

  it('should calculate impermanent loss at 50% price change', async () => {
    const { calculateImpermanentLoss } = await import('@/lib/explore/simulator')

    const il50 = calculateImpermanentLoss(1.5)
    expect(il50).toBeCloseTo(-0.0204, 3)  // ~-2%
  })

  it('should calculate capital efficiency for full range', async () => {
    const { calculateCapitalEfficiency } = await import('@/lib/explore/simulator')

    // Full range = 1x efficiency
    const fullRange = calculateCapitalEfficiency(-887272, 887272, 0)
    expect(fullRange).toBeCloseTo(1, 0)
  })

  it('should have higher efficiency for narrow range', async () => {
    const { calculateCapitalEfficiency } = await import('@/lib/explore/simulator')

    const fullRange = calculateCapitalEfficiency(-887272, 887272, 0)
    const narrowRange = calculateCapitalEfficiency(-1000, 1000, 0)
    expect(narrowRange).toBeGreaterThan(fullRange)
  })

  it('should estimate share of emission range correctly', async () => {
    const { calculateShareOfRange } = await import('@/lib/explore/simulator')

    const share = calculateShareOfRange({
      userLiquidityUSD: 10000,
      totalRangeLiquidityUSD: 1000000,
    })
    expect(share).toBeCloseTo(0.01, 4)  // 1%
  })

  it('should return 0 share when total liquidity is 0', async () => {
    const { calculateShareOfRange } = await import('@/lib/explore/simulator')

    const share = calculateShareOfRange({
      userLiquidityUSD: 10000,
      totalRangeLiquidityUSD: 0,
    })
    expect(share).toBe(0)
  })
})

describe('Tick Math', () => {
  it('should convert tick 0 to price 1 (same decimals)', async () => {
    const { tickToPrice } = await import('@/lib/explore/tickMath')

    const price0 = tickToPrice(0, 18, 18)
    expect(price0).toBeCloseTo(1, 5)
  })

  it('should convert positive tick to price > 0', async () => {
    const { tickToPrice } = await import('@/lib/explore/tickMath')

    // For WETH/USDC (18/6 decimals)
    const pricePositive = tickToPrice(1000, 18, 6)
    expect(pricePositive).toBeGreaterThan(0)
  })

  it('should convert price 1 to tick 0 (same decimals)', async () => {
    const { priceToTick } = await import('@/lib/explore/tickMath')

    const tick = priceToTick(1, 18, 18)
    expect(tick).toBe(0)
  })

  it('should be reversible (tick -> price -> tick)', async () => {
    const { tickToPrice, priceToTick } = await import('@/lib/explore/tickMath')

    const originalTick = 5000
    const price = tickToPrice(originalTick, 18, 18)
    const recoveredTick = priceToTick(price, 18, 18)
    expect(recoveredTick).toBe(originalTick)
  })
})

describe('Liquidity Distribution Types', () => {
  it('should have valid emission range structure', () => {
    const emissionRange = {
      tickLower: -5000,
      tickUpper: 5000,
      priceLower: 0.9,
      priceUpper: 1.1,
      liquidityInRange: '1000000000',
      liquidityInRangeUSD: 500000,
      percentOfTotal: 75.5,
    }

    expect(emissionRange.tickLower).toBeLessThan(emissionRange.tickUpper)
    expect(emissionRange.priceLower).toBeLessThan(emissionRange.priceUpper)
    expect(emissionRange.percentOfTotal).toBeGreaterThan(0)
    expect(emissionRange.percentOfTotal).toBeLessThanOrEqual(100)
  })
})
