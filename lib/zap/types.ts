import { Address } from "viem";

// ============================================
// ZAP Types - Position Minting & Staking
// ============================================

export interface MintParams {
  token0: Address;
  token1: Address;
  tickSpacing: number;
  tickLower: number;
  tickUpper: number;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  recipient: Address;
  deadline: bigint;
  sqrtPriceX96: bigint;
}

export interface IncreaseLiquidityParams {
  tokenId: bigint;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  deadline: bigint;
}

export interface DecreaseLiquidityParams {
  tokenId: bigint;
  liquidity: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  deadline: bigint;
}

export interface CollectParams {
  tokenId: bigint;
  recipient: Address;
  amount0Max: bigint;
  amount1Max: bigint;
}

// Transaction preparation result
export interface PreparedTransaction {
  to: Address;
  data: `0x${string}`;
  value?: bigint;
  description: string;
}

// ZAP flow step
export type ZapStep =
  | "approve_token0"
  | "approve_token1"
  | "mint"
  | "approve_nft"
  | "stake";

export interface ZapStepInfo {
  step: ZapStep;
  status: "pending" | "ready" | "signing" | "confirming" | "completed" | "error";
  transaction?: PreparedTransaction;
  txHash?: `0x${string}`;
  error?: string;
}

// Full ZAP request
export interface ZapMintRequest {
  poolAddress: Address;
  userAddress: Address;
  tickLower: number;
  tickUpper: number;
  amount0Desired: string; // Human readable
  amount1Desired: string; // Human readable
  slippagePercent: number; // e.g., 0.5 for 0.5%
  autoStake: boolean;
}

// ZAP quote response
export interface ZapQuote {
  pool: {
    address: Address;
    token0: { address: Address; symbol: string; decimals: number };
    token1: { address: Address; symbol: string; decimals: number };
    tickSpacing: number;
    currentTick: number;
    sqrtPriceX96: string;
  };
  position: {
    tickLower: number;
    tickUpper: number;
    priceLower: number;
    priceUpper: number;
    amount0: string;
    amount1: string;
    amount0USD: number;
    amount1USD: number;
    totalValueUSD: number;
  };
  estimatedReturns: {
    dailyFeeUSD: number;
    dailyEmissionUSD: number;
    dailyTotalUSD: number;
    feeAPR: number;
    emissionAPR: number;
    totalAPR: number;
  };
  steps: ZapStepInfo[];
  warnings: string[];
}

// User token balances
export interface TokenBalance {
  address: Address;
  symbol: string;
  decimals: number;
  balance: bigint;
  balanceFormatted: string;
  priceUSD: number;
  valueUSD: number;
}

// Pool state for ZAP
export interface PoolStateForZap {
  address: Address;
  token0: Address;
  token1: Address;
  tickSpacing: number;
  currentTick: number;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  gauge: Address | null;
  isGaugeAlive: boolean;
}
