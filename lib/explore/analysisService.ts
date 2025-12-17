/**
 * Pool Analysis Service - Detailed Aerodrome CL pool analytics
 */

import { Address, createPublicClient, http, formatUnits } from 'viem'
import { base } from 'viem/chains'

const BASE_RPC_URL =
  process.env.NEXT_PUBLIC_BASE_RPC_URL ||
  'https://mainnet.base.org'

const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL, {
    timeout: 30000,
    retryCount: 3,
  }),
})

// AERO token address
const AERO_TOKEN = '0x940181a94A35A4569E4529A3CDfB74e38FD98631'

// Gauge ABI for emission data
const GAUGE_ABI = [
  {
    inputs: [],
    name: 'rewardRate',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'stakedTotalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export interface PoolAnalysis {
  // Basic Info
  symbol: string
  poolAddress: string
  tickSpacing: number
  fee: number

  // TVL & Volume
  tvlUSD: number
  volume24h: number
  volume7d: number

  // APR Breakdown
  feeAPR: number        // From trading fees
  emissionAPR: number   // From AERO rewards
  totalAPR: number

  // Emission Details
  aeroPerDay: number    // AERO tokens distributed per day
  aeroPerWeek: number
  emissionValueUSD: number  // USD value of daily emissions

  // Liquidity Analysis
  activeLiquidityPercent: number  // % of liquidity in emission range

  // Trends
  aprChange1d: number
  aprChange7d: number
  aprChange30d: number
  aprMean30d: number

  // Risk
  isStablecoin: boolean
  hasILRisk: boolean
  prediction: string

  // Simulation helpers
  estimatedDailyReturn: (investment: number) => number
  estimatedWeeklyReturn: (investment: number) => number
  estimatedMonthlyReturn: (investment: number) => number
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
  apyPct30D: number | null
  apyMean30d: number | null
  stablecoin: boolean
  ilRisk: string
  predictions: {
    predictedClass: string
    predictedProbability: number
  }
}

// Cache
let poolsCache: { data: DefiLlamaPool[]; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

// AERO price cache
let aeroPriceCache: { price: number; timestamp: number } | null = null

async function getAeroPrice(): Promise<number> {
  if (aeroPriceCache && Date.now() - aeroPriceCache.timestamp < CACHE_TTL) {
    return aeroPriceCache.price
  }

  try {
    const response = await fetch(
      'https://coins.llama.fi/prices/current/base:0x940181a94A35A4569E4529A3CDfB74e38FD98631'
    )
    const data = await response.json()
    const price = data.coins['base:0x940181a94A35A4569E4529A3CDfB74e38FD98631']?.price || 1.0

    aeroPriceCache = { price, timestamp: Date.now() }
    return price
  } catch {
    return aeroPriceCache?.price || 1.0
  }
}

async function fetchDefiLlamaPools(): Promise<DefiLlamaPool[]> {
  if (poolsCache && Date.now() - poolsCache.timestamp < CACHE_TTL) {
    return poolsCache.data
  }

  const response = await fetch('https://yields.llama.fi/pools')
  const data = await response.json()

  const pools = data.data.filter(
    (p: DefiLlamaPool) => p.project === 'aerodrome-slipstream' && p.chain === 'Base'
  )

  poolsCache = { data: pools, timestamp: Date.now() }
  return pools
}

function parsePoolMeta(poolMeta: string | null): { tickSpacing: number; fee: number } {
  if (!poolMeta) return { tickSpacing: 100, fee: 500 }

  const match = poolMeta.match(/CL(\d+)\s*-\s*([\d.]+)%/)
  if (match) {
    const tickSpacing = parseInt(match[1])
    const feePercent = parseFloat(match[2])
    return { tickSpacing, fee: Math.round(feePercent * 10000) }
  }
  return { tickSpacing: 100, fee: 500 }
}

export async function analyzePool(pool: DefiLlamaPool): Promise<PoolAnalysis> {
  const aeroPrice = await getAeroPrice()
  const { tickSpacing, fee } = parsePoolMeta(pool.poolMeta)

  const feeAPR = pool.apyBase || 0
  const emissionAPR = pool.apyReward || 0
  const totalAPR = pool.apy || (feeAPR + emissionAPR)

  // Calculate AERO emissions from APR
  // emissionAPR = (aeroPerYear * aeroPrice / tvlUSD) * 100
  // aeroPerYear = emissionAPR * tvlUSD / (aeroPrice * 100)
  const aeroPerYear = (emissionAPR * pool.tvlUsd) / (aeroPrice * 100)
  const aeroPerDay = aeroPerYear / 365
  const aeroPerWeek = aeroPerDay * 7
  const emissionValueUSD = aeroPerDay * aeroPrice

  // Estimate active liquidity (simplified - assume 70% for CL pools)
  // In reality this should be fetched from on-chain data
  const activeLiquidityPercent = pool.stablecoin ? 90 : 70

  return {
    symbol: pool.symbol,
    poolAddress: pool.pool,
    tickSpacing,
    fee,

    tvlUSD: pool.tvlUsd,
    volume24h: pool.volumeUsd1d || 0,
    volume7d: pool.volumeUsd7d || 0,

    feeAPR,
    emissionAPR,
    totalAPR,

    aeroPerDay,
    aeroPerWeek,
    emissionValueUSD,

    activeLiquidityPercent,

    aprChange1d: pool.apyPct1D || 0,
    aprChange7d: pool.apyPct7D || 0,
    aprChange30d: pool.apyPct30D || 0,
    aprMean30d: pool.apyMean30d || totalAPR,

    isStablecoin: pool.stablecoin,
    hasILRisk: pool.ilRisk === 'yes',
    prediction: pool.predictions?.predictedClass || 'Unknown',

    // Investment simulation functions
    estimatedDailyReturn: (investment: number) => {
      return (investment * totalAPR) / 36500
    },
    estimatedWeeklyReturn: (investment: number) => {
      return (investment * totalAPR) / 5200
    },
    estimatedMonthlyReturn: (investment: number) => {
      return (investment * totalAPR) / 1200
    },
  }
}

export interface PoolsAnalysisResult {
  pools: PoolAnalysis[]
  aeroPrice: number
  totalTVL: number
  totalDailyEmissions: number
  lastUpdated: string
}

export async function analyzeAllPools(options?: {
  minTVL?: number
  sortBy?: 'apr' | 'tvl' | 'emissions' | 'volume'
  limit?: number
}): Promise<PoolsAnalysisResult> {
  const { minTVL = 100000, sortBy = 'apr', limit = 50 } = options || {}

  const [defiLlamaPools, aeroPrice] = await Promise.all([
    fetchDefiLlamaPools(),
    getAeroPrice(),
  ])

  // Filter and analyze pools
  const filteredPools = defiLlamaPools.filter(p => p.tvlUsd >= minTVL)

  const analyzedPools = await Promise.all(
    filteredPools.map(p => analyzePool(p))
  )

  // Sort
  analyzedPools.sort((a, b) => {
    switch (sortBy) {
      case 'tvl': return b.tvlUSD - a.tvlUSD
      case 'emissions': return b.aeroPerDay - a.aeroPerDay
      case 'volume': return b.volume24h - a.volume24h
      case 'apr':
      default: return b.totalAPR - a.totalAPR
    }
  })

  const pools = analyzedPools.slice(0, limit)

  return {
    pools,
    aeroPrice,
    totalTVL: pools.reduce((sum, p) => sum + p.tvlUSD, 0),
    totalDailyEmissions: pools.reduce((sum, p) => sum + p.aeroPerDay, 0),
    lastUpdated: new Date().toISOString(),
  }
}

// Investment simulator
export interface SimulationResult {
  investment: number
  poolShare: number        // % of pool TVL

  // Expected returns (before IL)
  dailyFeeReturn: number
  dailyEmissionReturn: number
  dailyTotalReturn: number

  weeklyReturn: number
  monthlyReturn: number
  yearlyReturn: number

  // AERO rewards
  dailyAeroReward: number
  weeklyAeroReward: number
  monthlyAeroReward: number

  // ROI
  dailyROI: number
  weeklyROI: number
  monthlyROI: number
  annualROI: number

  // Breakeven
  daysToDoubleInvestment: number
}

export function simulateInvestment(
  pool: PoolAnalysis,
  investmentUSD: number,
  aeroPrice: number
): SimulationResult {
  const poolShare = (investmentUSD / pool.tvlUSD) * 100

  // Daily returns
  const dailyFeeReturn = (investmentUSD * pool.feeAPR) / 36500
  const dailyEmissionReturn = (investmentUSD * pool.emissionAPR) / 36500
  const dailyTotalReturn = dailyFeeReturn + dailyEmissionReturn

  // AERO rewards
  const dailyAeroReward = (pool.aeroPerDay * poolShare) / 100

  // Extended returns
  const weeklyReturn = dailyTotalReturn * 7
  const monthlyReturn = dailyTotalReturn * 30
  const yearlyReturn = dailyTotalReturn * 365

  // ROI percentages
  const dailyROI = (dailyTotalReturn / investmentUSD) * 100
  const weeklyROI = (weeklyReturn / investmentUSD) * 100
  const monthlyROI = (monthlyReturn / investmentUSD) * 100
  const annualROI = pool.totalAPR

  // Days to double
  const daysToDoubleInvestment = dailyTotalReturn > 0
    ? Math.ceil(investmentUSD / dailyTotalReturn)
    : Infinity

  return {
    investment: investmentUSD,
    poolShare,

    dailyFeeReturn,
    dailyEmissionReturn,
    dailyTotalReturn,

    weeklyReturn,
    monthlyReturn,
    yearlyReturn,

    dailyAeroReward,
    weeklyAeroReward: dailyAeroReward * 7,
    monthlyAeroReward: dailyAeroReward * 30,

    dailyROI,
    weeklyROI,
    monthlyROI,
    annualROI,

    daysToDoubleInvestment,
  }
}
