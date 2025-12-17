/**
 * APR Calculator for Aerodrome CL Pools
 */

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60

interface FeeAPRInput {
  fees24hUSD: number
  tvlUSD: number
}

interface EmissionAPRInput {
  rewardRate: bigint  // AERO per second (wei)
  aeroPrice: number
  stakedLiquidityUSD: number
}

/**
 * Calculate Fee APR
 * Formula: (dailyFees * 365 / TVL) * 100
 */
export function calculateFeeAPR({ fees24hUSD, tvlUSD }: FeeAPRInput): number {
  if (tvlUSD <= 0) return 0
  return (fees24hUSD * 365 / tvlUSD) * 100
}

/**
 * Calculate Emission APR (AERO rewards)
 * Formula: (rewardRate * secondsPerYear * aeroPrice / stakedLiquidity) * 100
 */
export function calculateEmissionAPR({ rewardRate, aeroPrice, stakedLiquidityUSD }: EmissionAPRInput): number {
  if (stakedLiquidityUSD <= 0) return 0
  const annualRewardsWei = rewardRate * BigInt(SECONDS_PER_YEAR)
  const annualRewardsAERO = Number(annualRewardsWei) / 1e18
  const annualRewardsUSD = annualRewardsAERO * aeroPrice
  return (annualRewardsUSD / stakedLiquidityUSD) * 100
}

/**
 * Calculate total APR
 */
export function calculateTotalAPR(feeAPR: number, emissionAPR: number): number {
  return feeAPR + emissionAPR
}

/**
 * Calculate expected daily earnings
 */
export function calculateDailyEarnings(
  investmentUSD: number,
  apr: number
): number {
  return investmentUSD * (apr / 100) / 365
}

/**
 * Calculate expected earnings for different periods
 */
export function calculateEarnings(investmentUSD: number, apr: number) {
  const daily = calculateDailyEarnings(investmentUSD, apr)
  return {
    daily,
    weekly: daily * 7,
    monthly: daily * 30,
    yearly: daily * 365,
    apr,
  }
}

/**
 * Adjust APR based on position range vs emission range
 * If position is narrower than emission range, APR is higher proportionally
 */
export function adjustAPRForRange(
  baseAPR: number,
  positionTickLower: number,
  positionTickUpper: number,
  emissionTickLower: number,
  emissionTickUpper: number
): number {
  const positionWidth = positionTickUpper - positionTickLower
  const emissionWidth = emissionTickUpper - emissionTickLower

  // Calculate overlap
  const overlapLower = Math.max(positionTickLower, emissionTickLower)
  const overlapUpper = Math.min(positionTickUpper, emissionTickUpper)

  if (overlapLower >= overlapUpper) {
    // No overlap - no emission APR
    return 0
  }

  const overlapWidth = overlapUpper - overlapLower
  const positionInEmission = overlapWidth / positionWidth

  // If position is entirely in emission range and narrower, APR is concentrated
  if (positionWidth < emissionWidth && positionInEmission === 1) {
    return baseAPR * (emissionWidth / positionWidth)
  }

  // Otherwise, proportional to overlap
  return baseAPR * positionInEmission
}

/**
 * Calculate effective APR considering in-range probability
 */
export function calculateEffectiveAPR(apr: number, inRangeProbability: number): number {
  return apr * (inRangeProbability / 100)
}
