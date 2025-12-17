/**
 * Liquidity Distribution Service
 * Fetches tick-level liquidity data for visualization
 */

import { Address, createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { LiquidityDistribution, TickLiquidity } from './types'
import { tickToPrice, sqrtPriceX96ToPrice } from './tickMath'

// Contract addresses
const CL_POOL_ABI = [
  {
    name: 'slot0',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'unlocked', type: 'bool' },
    ],
  },
  {
    name: 'liquidity',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint128' }],
  },
  {
    name: 'tickSpacing',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'int24' }],
  },
  {
    name: 'ticks',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tick', type: 'int24' }],
    outputs: [
      { name: 'liquidityGross', type: 'uint128' },
      { name: 'liquidityNet', type: 'int128' },
      { name: 'stakedLiquidityNet', type: 'int128' },
      { name: 'feeGrowthOutside0X128', type: 'uint256' },
      { name: 'feeGrowthOutside1X128', type: 'uint256' },
      { name: 'rewardGrowthOutsideX128', type: 'uint256' },
      { name: 'tickCumulativeOutside', type: 'int56' },
      { name: 'secondsPerLiquidityOutsideX128', type: 'uint160' },
      { name: 'secondsOutside', type: 'uint32' },
      { name: 'initialized', type: 'bool' },
    ],
  },
  {
    name: 'token0',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'token1',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'gauge',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const

const CL_GAUGE_ABI = [
  {
    name: 'rewardRate',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  // Note: Emission range is determined by gauge's tick bounds
  // This varies by implementation - for Aerodrome, it's typically the full range
  // or set by governance
] as const

const ERC20_ABI = [
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const

// Create public client
const BASE_RPC_URL =
  process.env.NEXT_PUBLIC_BASE_RPC_URL ||
  process.env.ALCHEMY_BASE_HTTP ||
  'https://mainnet.base.org'

const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL, {
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
  }),
})

/**
 * Fetch liquidity distribution for a pool
 */
export async function fetchLiquidityDistribution(
  poolAddress: Address,
  rangeMultiplier: number = 2  // How many tick spaces around current tick to fetch
): Promise<LiquidityDistribution> {
  try {
    // Fetch pool state
    const [slot0Result, tickSpacingResult, token0Result, token1Result, gaugeResult] = await Promise.all([
      publicClient.readContract({
        address: poolAddress,
        abi: CL_POOL_ABI,
        functionName: 'slot0',
      }),
      publicClient.readContract({
        address: poolAddress,
        abi: CL_POOL_ABI,
        functionName: 'tickSpacing',
      }),
      publicClient.readContract({
        address: poolAddress,
        abi: CL_POOL_ABI,
        functionName: 'token0',
      }),
      publicClient.readContract({
        address: poolAddress,
        abi: CL_POOL_ABI,
        functionName: 'token1',
      }),
      publicClient.readContract({
        address: poolAddress,
        abi: CL_POOL_ABI,
        functionName: 'gauge',
      }).catch(() => null),
    ])

    const sqrtPriceX96 = slot0Result[0]
    const currentTick = slot0Result[1]
    const tickSpacing = tickSpacingResult

    // Fetch token decimals
    const [decimals0, decimals1] = await Promise.all([
      publicClient.readContract({
        address: token0Result,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
      publicClient.readContract({
        address: token1Result,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ])

    const currentPrice = sqrtPriceX96ToPrice(sqrtPriceX96, decimals0, decimals1)

    // Define range to scan (around current tick)
    const ticksToScan = 100 * rangeMultiplier
    const minTick = Math.floor((currentTick - ticksToScan * tickSpacing) / tickSpacing) * tickSpacing
    const maxTick = Math.ceil((currentTick + ticksToScan * tickSpacing) / tickSpacing) * tickSpacing

    // Fetch tick data in batches
    const ticks: TickLiquidity[] = []
    const batchSize = 20

    for (let tick = minTick; tick <= maxTick; tick += tickSpacing * batchSize) {
      const batchCalls = []
      for (let i = 0; i < batchSize && tick + i * tickSpacing <= maxTick; i++) {
        const targetTick = tick + i * tickSpacing
        batchCalls.push({
          address: poolAddress,
          abi: CL_POOL_ABI,
          functionName: 'ticks' as const,
          args: [targetTick] as const,
        })
      }

      try {
        const results = await publicClient.multicall({ contracts: batchCalls })

        results.forEach((result, i) => {
          if (result.status === 'success' && result.result) {
            const tickValue = tick + i * tickSpacing
            const tickData = result.result as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, number, boolean]
            const liquidityGross = tickData[0]
            const liquidityNet = tickData[1]

            if (liquidityGross > 0n) {
              ticks.push({
                tick: tickValue,
                price: tickToPrice(tickValue, decimals0, decimals1),
                liquidityNet: liquidityNet.toString(),
                liquidityGross: liquidityGross.toString(),
                isInEmissionRange: true,  // TODO: Get actual emission range from gauge
              })
            }
          }
        })
      } catch (error) {
        console.error('Error fetching tick batch:', error)
      }
    }

    // Sort ticks by tick value
    ticks.sort((a, b) => a.tick - b.tick)

    // Calculate emission range (simplified - assume ±50% around current price)
    const emissionTickLower = Math.floor((currentTick - 5000) / tickSpacing) * tickSpacing
    const emissionTickUpper = Math.ceil((currentTick + 5000) / tickSpacing) * tickSpacing

    // Calculate liquidity in emission range
    let liquidityInRange = 0n
    ticks.forEach(t => {
      if (t.tick >= emissionTickLower && t.tick <= emissionTickUpper) {
        t.isInEmissionRange = true
        liquidityInRange += BigInt(t.liquidityGross)
      } else {
        t.isInEmissionRange = false
      }
    })

    const totalLiquidity = ticks.reduce((sum, t) => sum + BigInt(t.liquidityGross), 0n)
    const percentOfTotal = totalLiquidity > 0n
      ? Number((liquidityInRange * 10000n) / totalLiquidity) / 100
      : 0

    return {
      poolAddress,
      currentTick,
      currentPrice,
      tickSpacing,
      ticks,
      emissionRange: {
        tickLower: emissionTickLower,
        tickUpper: emissionTickUpper,
        priceLower: tickToPrice(emissionTickLower, decimals0, decimals1),
        priceUpper: tickToPrice(emissionTickUpper, decimals0, decimals1),
        liquidityInRange: liquidityInRange.toString(),
        liquidityInRangeUSD: 0,  // Would need price data
        percentOfTotal,
      },
    }
  } catch (error) {
    console.error('Error fetching liquidity distribution:', error)

    // Return mock data for testing
    return {
      poolAddress,
      currentTick: 0,
      currentPrice: 1,
      tickSpacing: 100,
      ticks: [],
      emissionRange: null,
    }
  }
}

/**
 * Get aggregated liquidity histogram for chart visualization
 */
export function aggregateLiquidityHistogram(
  distribution: LiquidityDistribution,
  buckets: number = 50
): { price: number; liquidity: number; isInEmissionRange: boolean }[] {
  if (distribution.ticks.length === 0) return []

  const minPrice = Math.min(...distribution.ticks.map(t => t.price))
  const maxPrice = Math.max(...distribution.ticks.map(t => t.price))
  const bucketSize = (maxPrice - minPrice) / buckets

  const histogram: { price: number; liquidity: number; isInEmissionRange: boolean }[] = []

  for (let i = 0; i < buckets; i++) {
    const bucketMin = minPrice + i * bucketSize
    const bucketMax = bucketMin + bucketSize
    const bucketMid = (bucketMin + bucketMax) / 2

    const ticksInBucket = distribution.ticks.filter(
      t => t.price >= bucketMin && t.price < bucketMax
    )

    const totalLiquidity = ticksInBucket.reduce(
      (sum, t) => sum + Number(BigInt(t.liquidityGross)),
      0
    )

    const isInEmissionRange = distribution.emissionRange
      ? bucketMid >= distribution.emissionRange.priceLower &&
        bucketMid <= distribution.emissionRange.priceUpper
      : false

    histogram.push({
      price: bucketMid,
      liquidity: totalLiquidity,
      isInEmissionRange,
    })
  }

  return histogram
}
