/**
 * Tick Math utilities for Concentrated Liquidity calculations
 * Based on Uniswap V3 / Aerodrome Slipstream math
 */

const Q96 = BigInt(2) ** BigInt(96)
const Q192 = BigInt(2) ** BigInt(192)

// Min/Max ticks for full range
export const MIN_TICK = -887272
export const MAX_TICK = 887272

/**
 * Convert tick to price (token1 per token0)
 * price = 1.0001^tick * 10^(decimals0 - decimals1)
 */
export function tickToPrice(tick: number, decimals0: number, decimals1: number): number {
  const price = Math.pow(1.0001, tick)
  const decimalAdjustment = Math.pow(10, decimals0 - decimals1)
  return price * decimalAdjustment
}

/**
 * Convert price to tick
 * tick = log(price / 10^(decimals0 - decimals1)) / log(1.0001)
 */
export function priceToTick(price: number, decimals0: number, decimals1: number): number {
  const decimalAdjustment = Math.pow(10, decimals0 - decimals1)
  const adjustedPrice = price / decimalAdjustment
  const tick = Math.log(adjustedPrice) / Math.log(1.0001)
  return Math.round(tick)
}

/**
 * Round tick to nearest valid tick based on tick spacing
 */
export function roundTickToSpacing(tick: number, tickSpacing: number): number {
  return Math.round(tick / tickSpacing) * tickSpacing
}

/**
 * Convert sqrtPriceX96 to price
 */
export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, decimals0: number, decimals1: number): number {
  const sqrtPrice = Number(sqrtPriceX96) / Number(Q96)
  const price = sqrtPrice * sqrtPrice
  const decimalAdjustment = Math.pow(10, decimals0 - decimals1)
  return price * decimalAdjustment
}

/**
 * Convert price to sqrtPriceX96
 */
export function priceToSqrtPriceX96(price: number, decimals0: number, decimals1: number): bigint {
  const decimalAdjustment = Math.pow(10, decimals0 - decimals1)
  const adjustedPrice = price / decimalAdjustment
  const sqrtPrice = Math.sqrt(adjustedPrice)
  return BigInt(Math.floor(sqrtPrice * Number(Q96)))
}

/**
 * Get sqrtPriceX96 at a given tick
 */
export function getSqrtRatioAtTick(tick: number): bigint {
  const absTick = Math.abs(tick)
  if (absTick > MAX_TICK) {
    throw new Error('Tick out of range')
  }

  let ratio = BigInt('0x100000000000000000000000000000000')

  if ((absTick & 0x1) !== 0) ratio = (ratio * BigInt('0xfffcb933bd6fad37aa2d162d1a594001')) >> BigInt(128)
  if ((absTick & 0x2) !== 0) ratio = (ratio * BigInt('0xfff97272373d413259a46990580e213a')) >> BigInt(128)
  if ((absTick & 0x4) !== 0) ratio = (ratio * BigInt('0xfff2e50f5f656932ef12357cf3c7fdcc')) >> BigInt(128)
  if ((absTick & 0x8) !== 0) ratio = (ratio * BigInt('0xffe5caca7e10e4e61c3624eaa0941cd0')) >> BigInt(128)
  if ((absTick & 0x10) !== 0) ratio = (ratio * BigInt('0xffcb9843d60f6159c9db58835c926644')) >> BigInt(128)
  if ((absTick & 0x20) !== 0) ratio = (ratio * BigInt('0xff973b41fa98c081472e6896dfb254c0')) >> BigInt(128)
  if ((absTick & 0x40) !== 0) ratio = (ratio * BigInt('0xff2ea16466c96a3843ec78b326b52861')) >> BigInt(128)
  if ((absTick & 0x80) !== 0) ratio = (ratio * BigInt('0xfe5dee046a99a2a811c461f1969c3053')) >> BigInt(128)
  if ((absTick & 0x100) !== 0) ratio = (ratio * BigInt('0xfcbe86c7900a88aedcffc83b479aa3a4')) >> BigInt(128)
  if ((absTick & 0x200) !== 0) ratio = (ratio * BigInt('0xf987a7253ac413176f2b074cf7815e54')) >> BigInt(128)
  if ((absTick & 0x400) !== 0) ratio = (ratio * BigInt('0xf3392b0822b70005940c7a398e4b70f3')) >> BigInt(128)
  if ((absTick & 0x800) !== 0) ratio = (ratio * BigInt('0xe7159475a2c29b7443b29c7fa6e889d9')) >> BigInt(128)
  if ((absTick & 0x1000) !== 0) ratio = (ratio * BigInt('0xd097f3bdfd2022b8845ad8f792aa5825')) >> BigInt(128)
  if ((absTick & 0x2000) !== 0) ratio = (ratio * BigInt('0xa9f746462d870fdf8a65dc1f90e061e5')) >> BigInt(128)
  if ((absTick & 0x4000) !== 0) ratio = (ratio * BigInt('0x70d869a156d2a1b890bb3df62baf32f7')) >> BigInt(128)
  if ((absTick & 0x8000) !== 0) ratio = (ratio * BigInt('0x31be135f97d08fd981231505542fcfa6')) >> BigInt(128)
  if ((absTick & 0x10000) !== 0) ratio = (ratio * BigInt('0x9aa508b5b7a84e1c677de54f3e99bc9')) >> BigInt(128)
  if ((absTick & 0x20000) !== 0) ratio = (ratio * BigInt('0x5d6af8dedb81196699c329225ee604')) >> BigInt(128)
  if ((absTick & 0x40000) !== 0) ratio = (ratio * BigInt('0x2216e584f5fa1ea926041bedfe98')) >> BigInt(128)
  if ((absTick & 0x80000) !== 0) ratio = (ratio * BigInt('0x48a170391f7dc42444e8fa2')) >> BigInt(128)

  if (tick > 0) ratio = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') / ratio

  return (ratio >> BigInt(32)) + (ratio % (BigInt(1) << BigInt(32)) === BigInt(0) ? BigInt(0) : BigInt(1))
}

/**
 * Get tick at a given sqrtPriceX96
 */
export function getTickAtSqrtRatio(sqrtPriceX96: bigint): number {
  const sqrtPrice = Number(sqrtPriceX96) / Number(Q96)
  const tick = Math.log(sqrtPrice * sqrtPrice) / Math.log(1.0001)
  return Math.floor(tick)
}

/**
 * Calculate amount of token0 for a given liquidity and price range
 */
export function getAmount0ForLiquidity(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
  }
  return (liquidity * Q96 * (sqrtRatioBX96 - sqrtRatioAX96)) / (sqrtRatioBX96 * sqrtRatioAX96)
}

/**
 * Calculate amount of token1 for a given liquidity and price range
 */
export function getAmount1ForLiquidity(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
  }
  return (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / Q96
}

/**
 * Calculate liquidity for a given amount of token0
 */
export function getLiquidityForAmount0(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  amount0: bigint
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
  }
  const intermediate = (sqrtRatioAX96 * sqrtRatioBX96) / Q96
  return (amount0 * intermediate) / (sqrtRatioBX96 - sqrtRatioAX96)
}

/**
 * Calculate liquidity for a given amount of token1
 */
export function getLiquidityForAmount1(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  amount1: bigint
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
  }
  return (amount1 * Q96) / (sqrtRatioBX96 - sqrtRatioAX96)
}
