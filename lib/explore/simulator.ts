/**
 * Investment Simulator for Aerodrome CL positions
 */

import { Address } from 'viem'
import { SimulationInput, SimulationResult, PoolData } from './types'
import { tickToPrice, getSqrtRatioAtTick, getLiquidityForAmount0, getLiquidityForAmount1, MIN_TICK, MAX_TICK } from './tickMath'
import { calculateFeeAPR, calculateEmissionAPR, calculateEarnings, adjustAPRForRange } from './aprCalculator'

/**
 * Calculate Impermanent Loss for a given price ratio
 * IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
 */
export function calculateImpermanentLoss(priceRatio: number): number {
  if (priceRatio <= 0) return 0
  return 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1
}

/**
 * Calculate capital efficiency compared to full range
 * Higher efficiency = more capital working in current price range
 */
export function calculateCapitalEfficiency(
  tickLower: number,
  tickUpper: number,
  currentTick: number
): number {
  const fullRangeWidth = MAX_TICK - MIN_TICK
  const positionWidth = tickUpper - tickLower

  if (positionWidth <= 0) return 1

  // Basic efficiency = fullRange / positionRange
  const basicEfficiency = fullRangeWidth / positionWidth

  // Adjust for position being in range
  const isInRange = currentTick >= tickLower && currentTick <= tickUpper
  if (!isInRange) return 0

  return basicEfficiency
}

/**
 * Calculate share of emission range liquidity
 */
export function calculateShareOfRange({
  userLiquidityUSD,
  totalRangeLiquidityUSD,
}: {
  userLiquidityUSD: number
  totalRangeLiquidityUSD: number
}): number {
  if (totalRangeLiquidityUSD <= 0) return 0
  return userLiquidityUSD / totalRangeLiquidityUSD
}

/**
 * Estimate in-range probability based on range width
 * Wider range = higher probability of staying in range
 */
export function estimateInRangeProbability(
  tickLower: number,
  tickUpper: number,
  volatility: number = 0.15  // Daily volatility, default 15%
): number {
  const rangeWidth = tickUpper - tickLower
  const rangePercent = (Math.pow(1.0001, rangeWidth / 2) - 1) * 100

  // Simple heuristic based on range vs volatility
  // If range is 2x daily volatility, ~95% chance of staying in range
  const volatilityPercent = volatility * 100
  const ratio = rangePercent / volatilityPercent

  if (ratio >= 4) return 98
  if (ratio >= 2) return 92
  if (ratio >= 1) return 75
  if (ratio >= 0.5) return 55
  return 35
}

/**
 * Simulate investment in a pool
 */
export async function simulateInvestment(input: SimulationInput): Promise<SimulationResult> {
  const { poolAddress, investmentUSD, tickLower, tickUpper, durationDays } = input

  // For testing, use mock data
  // In production, this would fetch real pool data
  const mockPool: PoolData = {
    id: poolAddress,
    token0: {
      address: '0x4200000000000000000000000000000000000006' as Address,
      symbol: 'WETH',
      decimals: 18,
      priceUSD: 3500,
    },
    token1: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
      symbol: 'USDC',
      decimals: 6,
      priceUSD: 1,
    },
    tickSpacing: 100,
    fee: 500,
    liquidity: '1000000000000000000000',
    sqrtPriceX96: '79228162514264337593543950336',  // ~1:1 ratio
    currentTick: 0,
    tvlUSD: 10000000,
    volume24hUSD: 5000000,
    fees24hUSD: 2500,
    feeAPR: 9.125,
    emissionAPR: 25.5,
    totalAPR: 34.625,
    gauge: '0x9876543210987654321098765432109876543210' as Address,
    isGaugeAlive: true,
  }

  // Calculate prices
  const priceLower = tickToPrice(tickLower, mockPool.token0.decimals, mockPool.token1.decimals)
  const priceUpper = tickToPrice(tickUpper, mockPool.token0.decimals, mockPool.token1.decimals)
  const currentPrice = tickToPrice(mockPool.currentTick, mockPool.token0.decimals, mockPool.token1.decimals)

  // Estimate token amounts (simplified)
  const sqrtRatioLower = getSqrtRatioAtTick(tickLower)
  const sqrtRatioUpper = getSqrtRatioAtTick(tickUpper)
  const sqrtRatioCurrent = getSqrtRatioAtTick(mockPool.currentTick)

  // Split investment 50/50 for simplicity
  const halfInvestment = investmentUSD / 2
  const token0Amount = (halfInvestment / mockPool.token0.priceUSD).toFixed(mockPool.token0.decimals)
  const token1Amount = (halfInvestment / mockPool.token1.priceUSD).toFixed(mockPool.token1.decimals)

  // Calculate liquidity (simplified)
  const liquidity0 = getLiquidityForAmount0(
    sqrtRatioCurrent,
    sqrtRatioUpper,
    BigInt(Math.floor(parseFloat(token0Amount) * 10 ** mockPool.token0.decimals))
  )
  const liquidity1 = getLiquidityForAmount1(
    sqrtRatioLower,
    sqrtRatioCurrent,
    BigInt(Math.floor(parseFloat(token1Amount) * 10 ** mockPool.token1.decimals))
  )
  const estimatedLiquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1

  // Calculate capital efficiency
  const capitalEfficiency = calculateCapitalEfficiency(tickLower, tickUpper, mockPool.currentTick)

  // Adjust APRs for position range
  const emissionRange = {
    tickLower: -5000,
    tickUpper: 5000,
  }
  const adjustedFeeAPR = mockPool.feeAPR * Math.min(capitalEfficiency, 10)
  const adjustedEmissionAPR = adjustAPRForRange(
    mockPool.emissionAPR,
    tickLower,
    tickUpper,
    emissionRange.tickLower,
    emissionRange.tickUpper
  )

  // Calculate earnings
  const feeEarnings = calculateEarnings(investmentUSD, adjustedFeeAPR)
  const emissionEarnings = calculateEarnings(investmentUSD, adjustedEmissionAPR)
  const totalEarnings = calculateEarnings(investmentUSD, adjustedFeeAPR + adjustedEmissionAPR)

  // Calculate AERO amount from emissions
  const aeroPrice = 1.5  // Mock price
  const aeroAmount = emissionEarnings.yearly / aeroPrice

  // Calculate IL scenarios
  const impermanentLoss = {
    at5PercentMove: calculateImpermanentLoss(1.05) * 100,
    at10PercentMove: calculateImpermanentLoss(1.1) * 100,
    at20PercentMove: calculateImpermanentLoss(1.2) * 100,
  }

  // Estimate in-range probability
  const inRangeProbability = estimateInRangeProbability(tickLower, tickUpper)

  // Calculate shares
  const emissionRangeLiquidity = 5000000  // Mock
  const shareOfEmissionRange = calculateShareOfRange({
    userLiquidityUSD: investmentUSD,
    totalRangeLiquidityUSD: emissionRangeLiquidity,
  })
  const shareOfTotalPool = calculateShareOfRange({
    userLiquidityUSD: investmentUSD,
    totalRangeLiquidityUSD: mockPool.tvlUSD,
  })

  return {
    poolAddress,
    investmentUSD,
    tickLower,
    tickUpper,
    priceLower,
    priceUpper,
    estimatedLiquidity: estimatedLiquidity.toString(),
    token0Amount,
    token1Amount,
    feeEarnings,
    emissionEarnings: {
      ...emissionEarnings,
      aeroAmount,
    },
    totalEarnings,
    impermanentLoss,
    inRangeProbability,
    capitalEfficiency,
    shareOfEmissionRange,
    shareOfTotalPool,
  }
}
