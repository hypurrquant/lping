import { Address } from 'viem'

// Pool data from Subgraph + On-chain enrichment
export interface PoolData {
  id: Address
  token0: TokenInfo
  token1: TokenInfo
  tickSpacing: number
  fee: number  // in basis points (e.g., 500 = 0.05%)
  liquidity: string
  sqrtPriceX96: string
  currentTick: number
  tvlUSD: number
  volume24hUSD: number
  fees24hUSD: number
  feeAPR: number
  emissionAPR: number
  totalAPR: number
  gauge: Address | null
  isGaugeAlive: boolean
  // APR trends
  aprChange1d: number
  aprChange7d: number
  aprMean30d: number
  // Risk info
  isStablecoin: boolean
  ilRisk: 'yes' | 'no' | 'unknown'
  prediction: string
}

export interface TokenInfo {
  address: Address
  symbol: string
  decimals: number
  priceUSD: number
}

// Liquidity distribution for visualization
export interface TickLiquidity {
  tick: number
  price: number
  liquidityNet: string  // Serialized BigInt
  liquidityGross: string  // Serialized BigInt
  isInEmissionRange: boolean
}

export interface EmissionInfo {
  tickLower: number
  tickUpper: number
  priceLower: number
  priceUpper: number
  liquidityInRange: string
  liquidityInRangeUSD: number
  percentOfTotal: number
  // AERO emission details
  aeroPerSecond: number
  aeroPerDay: number
  aeroPerWeek: number
  aeroValuePerDay: number  // USD
  // Per $1000 investment
  aeroPerDayPer1000: number
  usdPerDayPer1000: number
  // Gauge status
  isGaugeActive: boolean
  periodFinish: number  // Unix timestamp
}

export interface LiquidityDistribution {
  poolAddress: Address
  currentTick: number
  currentPrice: number
  tickSpacing: number
  ticks: TickLiquidity[]
  emissionRange: EmissionInfo | null
}

// Investment simulation
export interface SimulationInput {
  poolAddress: Address
  investmentUSD: number
  tickLower: number
  tickUpper: number
  durationDays: number
}

export interface SimulationResult {
  poolAddress: Address
  investmentUSD: number
  tickLower: number
  tickUpper: number
  priceLower: number
  priceUpper: number

  // Position details
  estimatedLiquidity: string
  token0Amount: string
  token1Amount: string

  // Earnings breakdown
  feeEarnings: {
    daily: number
    weekly: number
    monthly: number
    yearly: number
    apr: number
  }
  emissionEarnings: {
    daily: number
    weekly: number
    monthly: number
    yearly: number
    apr: number
    aeroAmount: number
  }
  totalEarnings: {
    daily: number
    weekly: number
    monthly: number
    yearly: number
    apr: number
  }

  // Risk metrics
  impermanentLoss: {
    at5PercentMove: number
    at10PercentMove: number
    at20PercentMove: number
  }
  inRangeProbability: number
  capitalEfficiency: number

  // Share of pool
  shareOfEmissionRange: number
  shareOfTotalPool: number
}

// API response types
export interface PoolsAPIResponse {
  pools: PoolData[]
  totalCount: number
  lastUpdated: string
}

export interface PoolDetailAPIResponse {
  pool: PoolData
  liquidityDistribution: LiquidityDistribution
}

export interface SimulateAPIResponse {
  result: SimulationResult
}

// Query parameters
export interface PoolsQueryParams {
  sortBy?: 'tvl' | 'apr' | 'volume' | 'fees'
  sortOrder?: 'asc' | 'desc'
  minTVL?: number
  maxTVL?: number
  minAPR?: number
  token?: string  // filter by token address or symbol
  limit?: number
  offset?: number
}
