/**
 * Pool Service - Fetches and processes Aerodrome CL pool data
 * Uses DefiLlama API as primary data source with pool-cache for address mapping
 */

import { Address } from 'viem'
import { PoolData, PoolsAPIResponse, PoolsQueryParams } from './types'
import { calculateTotalAPR } from './aprCalculator'
import poolCacheData from '@/public/pool-cache.json'

// DefiLlama Yields API
const DEFILLAMA_YIELDS_API = 'https://yields.llama.fi/pools'

// Cache for DefiLlama data (5 minute TTL)
let poolsCache: { data: DefiLlamaPool[]; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Build pool address lookup from pool-cache.json
interface PoolCacheEntry {
  pool: string
  token0: string
  token1: string
  tickSpacing: number
}

const poolAddressMap = new Map<string, string>()
const poolCache = poolCacheData as { pools: PoolCacheEntry[] }
poolCache.pools.forEach(p => {
  // Create key from sorted token addresses
  const tokens = [p.token0.toLowerCase(), p.token1.toLowerCase()].sort()
  const key = `${tokens[0]}-${tokens[1]}-${p.tickSpacing}`
  poolAddressMap.set(key, p.pool)
})

/**
 * Find pool address from pool-cache using token addresses and tick spacing
 */
function findPoolAddress(token0: string, token1: string, tickSpacing: number): string | null {
  const tokens = [token0.toLowerCase(), token1.toLowerCase()].sort()
  const key = `${tokens[0]}-${tokens[1]}-${tickSpacing}`
  return poolAddressMap.get(key) || null
}

interface DefiLlamaPool {
  chain: string
  project: string
  symbol: string
  tvlUsd: number
  apyBase: number | null
  apyReward: number | null
  apy: number
  rewardTokens: string[]
  pool: string
  poolMeta: string | null
  underlyingTokens: string[]
  volumeUsd1d: number | null
  volumeUsd7d: number | null
  apyPct1D: number | null
  apyPct7D: number | null
  apyMean30d: number | null
  stablecoin: boolean
  ilRisk: string | null
  predictions: {
    predictedClass: string
    predictedProbability: number
  } | null
}

/**
 * Parse pool meta to extract tick spacing
 */
function parsePoolMeta(poolMeta: string | null): { tickSpacing: number; fee: number } {
  if (!poolMeta) return { tickSpacing: 100, fee: 500 }

  // Format: "CL100 - 0.031%" or "CL1 - 0.01%"
  const match = poolMeta.match(/CL(\d+)\s*-\s*([\d.]+)%/)
  if (match) {
    const tickSpacing = parseInt(match[1])
    const feePercent = parseFloat(match[2])
    return { tickSpacing, fee: Math.round(feePercent * 10000) }
  }
  return { tickSpacing: 100, fee: 500 }
}

/**
 * Fetch pools from DefiLlama API
 */
async function fetchPoolsFromDefiLlama(): Promise<DefiLlamaPool[]> {
  // Return cached data if still valid
  if (poolsCache && Date.now() - poolsCache.timestamp < CACHE_TTL) {
    return poolsCache.data
  }

  try {
    const response = await fetch(DEFILLAMA_YIELDS_API, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`DefiLlama API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter for Aerodrome Slipstream pools on Base
    const aerodromeSlipstreamPools = data.data.filter(
      (pool: DefiLlamaPool) =>
        pool.project === 'aerodrome-slipstream' &&
        pool.chain === 'Base'
    )

    // Update cache
    poolsCache = {
      data: aerodromeSlipstreamPools,
      timestamp: Date.now(),
    }

    return aerodromeSlipstreamPools
  } catch (error) {
    console.error('Error fetching pools from DefiLlama:', error)
    return poolsCache?.data || []
  }
}

/**
 * Transform DefiLlama pool to PoolData
 */
function transformDefiLlamaPool(pool: DefiLlamaPool): PoolData {
  const [symbol0, symbol1] = pool.symbol.split('-')
  const [token0Address, token1Address] = pool.underlyingTokens || []
  const { tickSpacing, fee } = parsePoolMeta(pool.poolMeta)

  const feeAPR = pool.apyBase || 0
  const emissionAPR = pool.apyReward || 0
  const volume24h = pool.volumeUsd1d || 0

  // Estimate 24h fees from volume (using fee tier)
  const feePercent = fee / 1000000 // Convert from basis points
  const fees24hUSD = volume24h * feePercent

  // Find actual pool address from pool-cache
  const poolAddress = findPoolAddress(
    token0Address || '',
    token1Address || '',
    tickSpacing
  )

  return {
    id: (poolAddress || pool.pool) as Address,
    token0: {
      address: (token0Address as Address) || '0x0000000000000000000000000000000000000000',
      symbol: symbol0 || 'UNKNOWN',
      decimals: 18,
      priceUSD: 0, // Not available from DefiLlama
    },
    token1: {
      address: (token1Address as Address) || '0x0000000000000000000000000000000000000000',
      symbol: symbol1 || 'UNKNOWN',
      decimals: 18,
      priceUSD: 0,
    },
    tickSpacing,
    fee,
    liquidity: '0', // Not available from DefiLlama
    sqrtPriceX96: '0',
    currentTick: 0,
    tvlUSD: pool.tvlUsd || 0,
    volume24hUSD: volume24h,
    fees24hUSD,
    feeAPR,
    emissionAPR,
    totalAPR: pool.apy || calculateTotalAPR(feeAPR, emissionAPR),
    gauge: pool.rewardTokens?.length > 0 ? (pool.rewardTokens[0] as Address) : null,
    isGaugeAlive: (pool.apyReward || 0) > 0,
    // APR trends
    aprChange1d: pool.apyPct1D || 0,
    aprChange7d: pool.apyPct7D || 0,
    aprMean30d: pool.apyMean30d || pool.apy || 0,
    // Risk info
    isStablecoin: pool.stablecoin || false,
    ilRisk: (pool.ilRisk === 'yes' ? 'yes' : pool.ilRisk === 'no' ? 'no' : 'unknown') as 'yes' | 'no' | 'unknown',
    prediction: pool.predictions?.predictedClass || 'Unknown',
  }
}

/**
 * Fetch pools with optional filtering and sorting
 */
export async function fetchPools(params: PoolsQueryParams = {}): Promise<PoolsAPIResponse> {
  const {
    sortBy = 'apr',
    sortOrder = 'desc',
    minTVL = 0,
    maxTVL,
    minAPR = 0,
    token,
    limit = 50,
    offset = 0,
  } = params

  // Fetch from DefiLlama
  const defiLlamaPools = await fetchPoolsFromDefiLlama()

  // Transform pools
  let pools = defiLlamaPools.map(pool => transformDefiLlamaPool(pool))

  // Filter out pools not in pool-cache (ID should be 0x address, not UUID)
  pools = pools.filter(pool => pool.id.startsWith('0x'))

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
      case 'volume':
        aVal = a.volume24hUSD
        bVal = b.volume24hUSD
        break
      case 'fees':
        aVal = a.fees24hUSD
        bVal = b.fees24hUSD
        break
      case 'apr':
      default:
        aVal = a.totalAPR
        bVal = b.totalAPR
    }
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
  })

  // Paginate
  const totalCount = pools.length
  pools = pools.slice(offset, offset + limit)

  return {
    pools,
    totalCount,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Fetch a single pool by address or token addresses
 */
export async function fetchPool(poolAddress: Address): Promise<PoolData | null> {
  try {
    // Fetch all pools and find matching one
    const defiLlamaPools = await fetchPoolsFromDefiLlama()

    // Try to find pool by underlying token addresses
    const poolAddressLower = poolAddress.toLowerCase()
    const matchingPool = defiLlamaPools.find(pool => {
      // Check if the address matches any underlying token (which would be pool identifier)
      const tokens = pool.underlyingTokens || []
      return tokens.some(t => t.toLowerCase() === poolAddressLower) ||
        pool.pool.toLowerCase().includes(poolAddressLower.slice(2, 10))
    })

    if (!matchingPool) return null

    return transformDefiLlamaPool(matchingPool)
  } catch (error) {
    console.error('Error fetching pool:', error)
    return null
  }
}
