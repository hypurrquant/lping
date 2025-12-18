/**
 * Pool Service - Fetches Aerodrome CL pool data from on-chain via CLFactory
 * Uses Enso API for token prices, calculates TVL from pool balances
 */

import { Address, formatUnits } from 'viem'
import { publicClient } from '../viemClient'
import { CL_GAUGE_ABI, ERC20_ABI } from '../abis'
import { AERODROME_CL_FACTORY } from '../addresses'
import { PoolData, PoolsAPIResponse, PoolsQueryParams } from './types'

// Cache for pool data (2 minute TTL)
let poolsCache: { data: PoolData[]; timestamp: number } | null = null
const CACHE_TTL = 2 * 60 * 1000

// Token price cache (5 minute TTL)
const tokenPriceCache = new Map<string, { price: number; decimals: number; symbol?: string; timestamp: number }>()
const PRICE_CACHE_TTL = 5 * 60 * 1000

// Base chain ID for Enso API
const BASE_CHAIN_ID = 8453

// CLFactory ABI
const CL_FACTORY_ABI = [
  {
    type: 'function',
    name: 'allPoolsLength',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allPools',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

// Pool ABI for metadata
const POOL_METADATA_ABI = [
  {
    type: 'function',
    name: 'token0',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'token1',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'tickSpacing',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'int24' }],
  },
  {
    type: 'function',
    name: 'liquidity',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint128' }],
  },
  {
    type: 'function',
    name: 'slot0',
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
    type: 'function',
    name: 'gauge',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

interface TokenPriceInfo {
  price: number
  decimals: number
  symbol: string
}

// Well-known token prices as fallback
const KNOWN_TOKEN_PRICES: Record<string, { price: number; decimals: number; symbol: string }> = {
  '0x4200000000000000000000000000000000000006': { price: 3500, decimals: 18, symbol: 'WETH' },
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { price: 1, decimals: 6, symbol: 'USDC' },
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': { price: 1, decimals: 6, symbol: 'USDbC' },
  '0x940181a94a35a4569e4529a3cdfb74e38fd98631': { price: 0.5, decimals: 18, symbol: 'AERO' },
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': { price: 1, decimals: 18, symbol: 'DAI' },
  '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22': { price: 70000, decimals: 8, symbol: 'cbBTC' },
  '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf': { price: 70000, decimals: 8, symbol: 'cbBTC' },
  '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452': { price: 4000, decimals: 18, symbol: 'wstETH' },
  '0x2416092f143378750bb29b79ed961ab195cceea5': { price: 3500, decimals: 18, symbol: 'ezETH' },
  '0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c': { price: 0.99, decimals: 18, symbol: 'rETH' },
}

/**
 * Fetch token price from Enso API with retry logic
 */
async function fetchTokenPrice(tokenAddress: Address): Promise<TokenPriceInfo | null> {
  const cacheKey = tokenAddress.toLowerCase()
  const cached = tokenPriceCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    return { price: cached.price, decimals: cached.decimals, symbol: cached.symbol || '' }
  }

  // Check known tokens first
  const known = KNOWN_TOKEN_PRICES[cacheKey]
  if (known) {
    tokenPriceCache.set(cacheKey, { ...known, timestamp: Date.now() })
    return known
  }

  // Try Enso API with retry
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = `https://api.enso.finance/api/v1/prices/${BASE_CHAIN_ID}/${tokenAddress}`
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      })

      if (response.status === 429) {
        // Rate limited, wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      const result = {
        price: data.price || 0,
        decimals: data.decimals || 18,
        symbol: data.symbol || '',
      }

      tokenPriceCache.set(cacheKey, {
        price: result.price,
        decimals: result.decimals,
        symbol: result.symbol,
        timestamp: Date.now(),
      })

      return result
    } catch {
      if (attempt === 2) return null
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  return null
}

/**
 * Batch fetch token prices for multiple addresses
 * Currently uses only known token prices to avoid rate limiting
 */
async function fetchTokenPrices(addresses: Address[]): Promise<Map<string, TokenPriceInfo>> {
  const results = new Map<string, TokenPriceInfo>()
  const uniqueAddresses = [...new Set(addresses.map(a => a.toLowerCase()))]

  // Use known prices
  for (const addr of uniqueAddresses) {
    const known = KNOWN_TOKEN_PRICES[addr]
    if (known) {
      results.set(addr, known)
    }
  }

  console.log(`[poolService] Using ${results.size} known token prices (total unique: ${uniqueAddresses.length})`)

  return results
}

/**
 * Get token symbol from contract
 */
async function getTokenSymbol(tokenAddress: Address): Promise<string> {
  try {
    const symbol = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'symbol',
    })
    return symbol as string
  } catch {
    return 'UNKNOWN'
  }
}


/**
 * Fetch all CL pools from CLFactory
 */
async function fetchPoolsFromFactory(): Promise<PoolData[]> {
  if (poolsCache && Date.now() - poolsCache.timestamp < CACHE_TTL) {
    return poolsCache.data
  }

  try {
    console.log('[poolService] Fetching pools from CLFactory...')

    const totalPools = await publicClient.readContract({
      address: AERODROME_CL_FACTORY,
      abi: CL_FACTORY_ABI,
      functionName: 'allPoolsLength',
    })

    const count = Number(totalPools)
    console.log(`[poolService] Total CL pools in Factory: ${count}`)

    // Get first 200 pools (older pools with more established TVL)
    const MAX_POOLS = 200
    const limit = Math.min(count, MAX_POOLS)
    const startIdx = 0  // Start from beginning (oldest pools)

    // Batch read pool addresses
    const poolAddressCalls = []
    for (let i = startIdx; i < startIdx + limit; i++) {
      poolAddressCalls.push({
        address: AERODROME_CL_FACTORY,
        abi: CL_FACTORY_ABI,
        functionName: 'allPools',
        args: [BigInt(i)],
      })
    }

    const poolAddressResults = await publicClient.multicall({
      contracts: poolAddressCalls,
      allowFailure: true,
    })

    const poolAddresses = poolAddressResults
      .filter((r) => r.status === 'success')
      .map((r) => r.result as Address)

    console.log(`[poolService] Got ${poolAddresses.length} pool addresses`)

    // First pass: get all token addresses
    const CHUNK_SIZE = 50
    const allTokenAddresses: Address[] = []
    const poolMetadataMap = new Map<string, {
      token0: Address
      token1: Address
      tickSpacing: number
      liquidity: bigint
      sqrtPriceX96: bigint
      tick: number
      gauge: Address | null
    }>()

    for (let chunkStart = 0; chunkStart < poolAddresses.length; chunkStart += CHUNK_SIZE) {
      const chunk = poolAddresses.slice(chunkStart, chunkStart + CHUNK_SIZE)

      const metadataCalls = chunk.flatMap((pool) => [
        { address: pool, abi: POOL_METADATA_ABI, functionName: 'token0' },
        { address: pool, abi: POOL_METADATA_ABI, functionName: 'token1' },
        { address: pool, abi: POOL_METADATA_ABI, functionName: 'tickSpacing' },
        { address: pool, abi: POOL_METADATA_ABI, functionName: 'liquidity' },
        { address: pool, abi: POOL_METADATA_ABI, functionName: 'slot0' },
        { address: pool, abi: POOL_METADATA_ABI, functionName: 'gauge' },
      ])

      try {
        const results = await publicClient.multicall({
          contracts: metadataCalls,
          allowFailure: true,
        })

        for (let i = 0; i < chunk.length; i++) {
          const baseIdx = i * 6
          const token0Res = results[baseIdx]
          const token1Res = results[baseIdx + 1]
          const tickSpacingRes = results[baseIdx + 2]
          const liquidityRes = results[baseIdx + 3]
          const slot0Res = results[baseIdx + 4]
          const gaugeRes = results[baseIdx + 5]

          if (
            token0Res.status !== 'success' ||
            token1Res.status !== 'success' ||
            tickSpacingRes.status !== 'success'
          ) continue

          const token0 = token0Res.result as Address
          const token1 = token1Res.result as Address
          const slot0 = slot0Res.status === 'success'
            ? slot0Res.result as [bigint, number, number, number, number, boolean]
            : null

          allTokenAddresses.push(token0, token1)

          poolMetadataMap.set(chunk[i].toLowerCase(), {
            token0,
            token1,
            tickSpacing: Number(tickSpacingRes.result),
            liquidity: liquidityRes.status === 'success' ? liquidityRes.result as bigint : 0n,
            sqrtPriceX96: slot0 ? slot0[0] : 0n,
            tick: slot0 ? slot0[1] : 0,
            gauge: gaugeRes.status === 'success' ? gaugeRes.result as Address : null,
          })
        }
      } catch (e) {
        console.warn(`[poolService] Metadata chunk failed:`, e)
      }
    }

    // Fetch all token prices
    const tokenPrices = await fetchTokenPrices(allTokenAddresses)

    // Fetch AERO price for emission APR
    const aeroPriceInfo = tokenPrices.get('0x940181a94a35a4569e4529a3cdfb74e38fd98631')
    const aeroPrice = aeroPriceInfo?.price || 0.5
    console.log(`[poolService] AERO price: $${aeroPrice}`)

    // Filter pools that have price data
    const validPools: Array<{
      poolAddress: Address
      metadata: typeof poolMetadataMap extends Map<string, infer V> ? V : never
      token0Price: TokenPriceInfo
      token1Price: TokenPriceInfo | null
    }> = []

    for (const [poolAddr, metadata] of poolMetadataMap) {
      const token0Price = tokenPrices.get(metadata.token0.toLowerCase())
      const token1Price = tokenPrices.get(metadata.token1.toLowerCase())

      // Need at least token0 price
      if (!token0Price) continue

      validPools.push({
        poolAddress: poolAddr as Address,
        metadata,
        token0Price,
        token1Price: token1Price || null,
      })
    }

    console.log(`[poolService] Pools with price data: ${validPools.length}`)

    // Batch fetch all token balances
    const balanceCalls = validPools.flatMap(({ poolAddress, metadata }) => [
      { address: metadata.token0, abi: ERC20_ABI, functionName: 'balanceOf', args: [poolAddress] },
      { address: metadata.token1, abi: ERC20_ABI, functionName: 'balanceOf', args: [poolAddress] },
    ])

    const balanceResults = await publicClient.multicall({
      contracts: balanceCalls as readonly { address: Address; abi: typeof ERC20_ABI; functionName: 'balanceOf'; args: readonly [Address] }[],
      allowFailure: true,
    })

    // Batch fetch gauge info
    const zeroAddr = '0x0000000000000000000000000000000000000000' as Address
    const poolsWithGauges: number[] = []
    const gaugeCalls: { address: Address; abi: typeof CL_GAUGE_ABI; functionName: 'rewardRate' | 'periodFinish' }[] = []

    validPools.forEach(({ metadata }, idx) => {
      if (metadata.gauge && metadata.gauge !== zeroAddr) {
        poolsWithGauges.push(idx)
        gaugeCalls.push(
          { address: metadata.gauge, abi: CL_GAUGE_ABI, functionName: 'rewardRate' },
          { address: metadata.gauge, abi: CL_GAUGE_ABI, functionName: 'periodFinish' }
        )
      }
    })

    const gaugeResults = gaugeCalls.length > 0
      ? await publicClient.multicall({
          contracts: gaugeCalls,
          allowFailure: true,
        })
      : []

    // Create a map of pool index to gauge results
    const gaugeDataMap = new Map<number, { rewardRate: bigint; periodFinish: bigint }>()
    for (let i = 0; i < poolsWithGauges.length; i++) {
      const poolIdx = poolsWithGauges[i]
      const rewardRateRes = gaugeResults[i * 2]
      const periodFinishRes = gaugeResults[i * 2 + 1]

      if (rewardRateRes?.status === 'success' && periodFinishRes?.status === 'success') {
        gaugeDataMap.set(poolIdx, {
          rewardRate: rewardRateRes.result as bigint,
          periodFinish: periodFinishRes.result as bigint,
        })
      }
    }

    // Build pool data
    const pools: PoolData[] = []

    for (let i = 0; i < validPools.length; i++) {
      const { poolAddress, metadata, token0Price, token1Price } = validPools[i]
      const { token0, token1, tickSpacing, liquidity, sqrtPriceX96, tick, gauge } = metadata

      const price0 = token0Price.price
      const price1 = token1Price?.price || 0
      const decimals0 = token0Price.decimals
      const decimals1 = token1Price?.decimals || 18

      // Get balances from batch results
      const balance0Res = balanceResults[i * 2]
      const balance1Res = balanceResults[i * 2 + 1]
      const balance0 = balance0Res?.status === 'success' ? balance0Res.result as bigint : 0n
      const balance1 = balance1Res?.status === 'success' ? balance1Res.result as bigint : 0n

      const amount0 = Number(formatUnits(balance0, decimals0))
      const amount1 = Number(formatUnits(balance1, decimals1))

      // Calculate TVL from actual balances
      const tvl0 = amount0 * price0
      const tvl1 = amount1 * price1
      const tvlUSD = tvl0 + tvl1

      // Skip pools with very low TVL
      if (tvlUSD < 1000) continue

      // Get token symbols
      const token0Symbol = token0Price.symbol || 'UNKNOWN'
      const token1Symbol = token1Price?.symbol || 'UNKNOWN'

      // Get gauge info from pre-fetched results
      let emissionAPR = 0
      let isGaugeAlive = false

      const gaugeData = gaugeDataMap.get(i)
      if (gaugeData) {
        const ratePerSec = Number(formatUnits(gaugeData.rewardRate, 18))
        const finish = Number(gaugeData.periodFinish)
        isGaugeAlive = finish > Date.now() / 1000

        if (isGaugeAlive && tvlUSD > 0) {
          const yearlyEmissions = ratePerSec * 86400 * 365 * aeroPrice
          emissionAPR = (yearlyEmissions / tvlUSD) * 100
        }
      }

      // Fee tier from tickSpacing
      const feeMap: Record<number, number> = { 1: 100, 10: 500, 50: 3000, 100: 500, 200: 1000 }
      const fee = feeMap[tickSpacing] || 500

      pools.push({
        id: poolAddress,
        token0: {
          address: token0,
          symbol: token0Symbol,
          decimals: decimals0,
          priceUSD: price0,
        },
        token1: {
          address: token1,
          symbol: token1Symbol,
          decimals: decimals1,
          priceUSD: price1,
        },
        tickSpacing,
        fee,
        liquidity: liquidity.toString(),
        sqrtPriceX96: sqrtPriceX96.toString(),
        currentTick: tick,
        tvlUSD,
        volume24hUSD: 0,
        fees24hUSD: 0,
        feeAPR: 0, // Not calculating without volume data
        emissionAPR,
        totalAPR: emissionAPR,
        gauge: isGaugeAlive ? gauge : null,
        isGaugeAlive,
        aprChange1d: 0,
        aprChange7d: 0,
        aprMean30d: emissionAPR,
        isStablecoin: isStablePair(token0Symbol, token1Symbol),
        ilRisk: getILRisk(token0Symbol, token1Symbol),
        prediction: 'Unknown',
      })
    }

    // Update cache
    poolsCache = { data: pools, timestamp: Date.now() }
    console.log(`[poolService] Total valid CL pools with TVL: ${pools.length}`)

    return pools
  } catch (error) {
    console.error('Error fetching pools from Factory:', error)
    return poolsCache?.data || []
  }
}

function isStablePair(symbol0: string, symbol1: string): boolean {
  const stables = ['USDC', 'USDT', 'DAI', 'USDbC', 'USDBC', 'USD+', 'USDA', 'EURC']
  const s0 = symbol0.toUpperCase()
  const s1 = symbol1.toUpperCase()
  return stables.some(s => s0.includes(s)) && stables.some(s => s1.includes(s))
}

function getILRisk(symbol0: string, symbol1: string): 'yes' | 'no' | 'unknown' {
  if (isStablePair(symbol0, symbol1)) return 'no'
  const ethVariants = ['WETH', 'ETH', 'cbETH', 'rETH', 'stETH', 'wstETH']
  const s0 = symbol0.toUpperCase()
  const s1 = symbol1.toUpperCase()
  if (ethVariants.some(e => s0.includes(e)) && ethVariants.some(e => s1.includes(e))) {
    return 'no'
  }
  return 'yes'
}

/**
 * Fetch pools with optional filtering and sorting
 */
export async function fetchPools(params: PoolsQueryParams = {}): Promise<PoolsAPIResponse> {
  const {
    sortBy = 'tvl',
    sortOrder = 'desc',
    minTVL = 0,
    maxTVL,
    minAPR = 0,
    token,
    limit = 50,
    offset = 0,
  } = params

  let pools = await fetchPoolsFromFactory()

  // Apply filters
  pools = pools.filter(pool => {
    if (pool.tvlUSD < minTVL) return false
    if (maxTVL && pool.tvlUSD > maxTVL) return false
    if (pool.totalAPR < minAPR) return false
    if (token) {
      const tokenLower = token.toLowerCase()
      const hasToken =
        pool.token0.symbol.toLowerCase().includes(tokenLower) ||
        pool.token1.symbol.toLowerCase().includes(tokenLower) ||
        pool.token0.address.toLowerCase() === tokenLower ||
        pool.token1.address.toLowerCase() === tokenLower
      if (!hasToken) return false
    }
    return true
  })

  // Sort
  pools.sort((a, b) => {
    let aVal: number, bVal: number
    switch (sortBy) {
      case 'tvl':
        aVal = a.tvlUSD
        bVal = b.tvlUSD
        break
      case 'apr':
        aVal = a.totalAPR
        bVal = b.totalAPR
        break
      case 'volume':
        aVal = a.volume24hUSD
        bVal = b.volume24hUSD
        break
      case 'fees':
        aVal = a.fees24hUSD
        bVal = b.fees24hUSD
        break
      default:
        aVal = a.tvlUSD
        bVal = b.tvlUSD
    }
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
  })

  const totalCount = pools.length
  pools = pools.slice(offset, offset + limit)

  return {
    pools,
    totalCount,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Fetch a single pool by address
 */
export async function fetchPool(poolAddress: Address): Promise<PoolData | null> {
  const pools = await fetchPoolsFromFactory()
  return pools.find(p => p.id.toLowerCase() === poolAddress.toLowerCase()) || null
}
