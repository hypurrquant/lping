import { Address, encodeFunctionData, parseUnits } from "viem";
import { publicClient } from "@/lib/viemClient";
import { AERODROME_NPM } from "@/lib/addresses";
import { NPM_FULL_ABI, CL_GAUGE_FULL_ABI, ERC20_FULL_ABI, CL_POOL_ABI } from "@/lib/abis";
import {
  MintParams,
  PreparedTransaction,
  ZapStepInfo,
  ZapMintRequest,
  ZapQuote,
  PoolStateForZap,
  TokenBalance,
} from "./types";
import { tickToPrice } from "@/lib/explore/tickMath";

const MAX_UINT128 = BigInt("0xffffffffffffffffffffffffffffffff");
const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

// ============================================
// Pool State Fetching
// ============================================

export async function getPoolStateForZap(poolAddress: Address): Promise<PoolStateForZap> {
  const client = publicClient;

  const [slot0, liquidity, token0, token1, tickSpacing, gauge] = await client.multicall({
    contracts: [
      { address: poolAddress, abi: CL_POOL_ABI, functionName: "slot0" },
      { address: poolAddress, abi: CL_POOL_ABI, functionName: "liquidity" },
      {
        address: poolAddress,
        abi: [{ type: "function", name: "token0", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }] as const,
        functionName: "token0",
      },
      {
        address: poolAddress,
        abi: [{ type: "function", name: "token1", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }] as const,
        functionName: "token1",
      },
      {
        address: poolAddress,
        abi: [{ type: "function", name: "tickSpacing", stateMutability: "view", inputs: [], outputs: [{ type: "int24" }] }] as const,
        functionName: "tickSpacing",
      },
      { address: poolAddress, abi: CL_POOL_ABI, functionName: "gauge" },
    ],
    allowFailure: false,
  });

  // Check if gauge is alive
  let isGaugeAlive = false;
  if (gauge && gauge !== "0x0000000000000000000000000000000000000000") {
    try {
      const [rewardRate, periodFinish] = await client.multicall({
        contracts: [
          { address: gauge, abi: CL_GAUGE_FULL_ABI, functionName: "rewardRate" },
          { address: gauge, abi: CL_GAUGE_FULL_ABI, functionName: "periodFinish" },
        ],
        allowFailure: false,
      });
      isGaugeAlive = rewardRate > 0n && periodFinish > BigInt(Math.floor(Date.now() / 1000));
    } catch {
      // Gauge might not exist or be invalid
    }
  }

  return {
    address: poolAddress,
    token0: token0 as Address,
    token1: token1 as Address,
    tickSpacing: Number(tickSpacing),
    currentTick: Number(slot0[1]),
    sqrtPriceX96: slot0[0],
    liquidity: liquidity,
    gauge: gauge && gauge !== "0x0000000000000000000000000000000000000000" ? gauge : null,
    isGaugeAlive,
  };
}

// ============================================
// Token Balance Fetching
// ============================================

export async function getTokenBalances(
  userAddress: Address,
  tokenAddresses: Address[],
  prices: Map<string, number>
): Promise<TokenBalance[]> {
  const client = publicClient;

  const calls = tokenAddresses.flatMap((token) => [
    { address: token, abi: ERC20_FULL_ABI, functionName: "balanceOf" as const, args: [userAddress] },
    { address: token, abi: ERC20_FULL_ABI, functionName: "symbol" as const },
    { address: token, abi: ERC20_FULL_ABI, functionName: "decimals" as const },
  ]);

  const results = await client.multicall({
    contracts: calls,
    allowFailure: true,
  });

  const balances: TokenBalance[] = [];
  for (let i = 0; i < tokenAddresses.length; i++) {
    const balanceResult = results[i * 3];
    const symbolResult = results[i * 3 + 1];
    const decimalsResult = results[i * 3 + 2];

    const balance = balanceResult.status === "success" ? (balanceResult.result as bigint) : 0n;
    const symbol = symbolResult.status === "success" ? (symbolResult.result as string) : "???";
    const decimals = decimalsResult.status === "success" ? (decimalsResult.result as number) : 18;

    const priceUSD = prices.get(tokenAddresses[i].toLowerCase()) || 0;
    const balanceFormatted = Number(balance) / Math.pow(10, decimals);
    const valueUSD = balanceFormatted * priceUSD;

    balances.push({
      address: tokenAddresses[i],
      symbol,
      decimals,
      balance,
      balanceFormatted: balanceFormatted.toString(),
      priceUSD,
      valueUSD,
    });
  }

  return balances;
}

// ============================================
// Allowance Checking
// ============================================

export async function checkAllowances(
  userAddress: Address,
  token0: Address,
  token1: Address,
  amount0: bigint,
  amount1: bigint
): Promise<{ token0NeedsApproval: boolean; token1NeedsApproval: boolean }> {
  const client = publicClient;

  const [allowance0, allowance1] = await client.multicall({
    contracts: [
      {
        address: token0,
        abi: ERC20_FULL_ABI,
        functionName: "allowance",
        args: [userAddress, AERODROME_NPM],
      },
      {
        address: token1,
        abi: ERC20_FULL_ABI,
        functionName: "allowance",
        args: [userAddress, AERODROME_NPM],
      },
    ],
    allowFailure: false,
  });

  return {
    token0NeedsApproval: allowance0 < amount0,
    token1NeedsApproval: allowance1 < amount1,
  };
}

// ============================================
// Transaction Preparation
// ============================================

export function prepareApproveToken(
  tokenAddress: Address,
  spender: Address,
  amount: bigint = MAX_UINT256
): PreparedTransaction {
  const data = encodeFunctionData({
    abi: ERC20_FULL_ABI,
    functionName: "approve",
    args: [spender, amount],
  });

  return {
    to: tokenAddress,
    data,
    description: `Approve token spending`,
  };
}

export function prepareMint(params: MintParams): PreparedTransaction {
  const data = encodeFunctionData({
    abi: NPM_FULL_ABI,
    functionName: "mint",
    args: [
      {
        token0: params.token0,
        token1: params.token1,
        tickSpacing: params.tickSpacing,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        amount0Desired: params.amount0Desired,
        amount1Desired: params.amount1Desired,
        amount0Min: params.amount0Min,
        amount1Min: params.amount1Min,
        recipient: params.recipient,
        deadline: params.deadline,
        sqrtPriceX96: params.sqrtPriceX96,
      },
    ],
  });

  return {
    to: AERODROME_NPM,
    data,
    description: "Mint CL position",
  };
}

export function prepareApproveNFT(
  tokenId: bigint,
  gaugeAddress: Address
): PreparedTransaction {
  const data = encodeFunctionData({
    abi: NPM_FULL_ABI,
    functionName: "approve",
    args: [gaugeAddress, tokenId],
  });

  return {
    to: AERODROME_NPM,
    data,
    description: "Approve NFT for staking",
  };
}

export function prepareStake(
  gaugeAddress: Address,
  tokenId: bigint
): PreparedTransaction {
  const data = encodeFunctionData({
    abi: CL_GAUGE_FULL_ABI,
    functionName: "deposit",
    args: [tokenId],
  });

  return {
    to: gaugeAddress,
    data,
    description: "Stake position in gauge",
  };
}

export function prepareUnstake(
  gaugeAddress: Address,
  tokenId: bigint
): PreparedTransaction {
  const data = encodeFunctionData({
    abi: CL_GAUGE_FULL_ABI,
    functionName: "withdraw",
    args: [tokenId],
  });

  return {
    to: gaugeAddress,
    data,
    description: "Unstake position from gauge",
  };
}

export function prepareClaimRewards(
  gaugeAddress: Address,
  tokenId: bigint
): PreparedTransaction {
  const data = encodeFunctionData({
    abi: CL_GAUGE_FULL_ABI,
    functionName: "getReward",
    args: [tokenId],
  });

  return {
    to: gaugeAddress,
    data,
    description: "Claim AERO rewards",
  };
}

export function prepareCollectFees(
  tokenId: bigint,
  recipient: Address
): PreparedTransaction {
  const data = encodeFunctionData({
    abi: NPM_FULL_ABI,
    functionName: "collect",
    args: [
      {
        tokenId,
        recipient,
        amount0Max: MAX_UINT128,
        amount1Max: MAX_UINT128,
      },
    ],
  });

  return {
    to: AERODROME_NPM,
    data,
    description: "Collect trading fees",
  };
}

// ============================================
// Amount Calculation
// ============================================

export function calculateAmountsForLiquidity(
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number,
  liquidityDelta: bigint
): { amount0: bigint; amount1: bigint } {
  // Calculate sqrtPrice at tick bounds
  const sqrtPriceLower = tickToSqrtPriceX96(tickLower);
  const sqrtPriceUpper = tickToSqrtPriceX96(tickUpper);

  let amount0 = 0n;
  let amount1 = 0n;

  if (sqrtPriceX96 <= sqrtPriceLower) {
    // Current price is below the range, position is entirely in token0
    amount0 = getAmount0ForLiquidity(sqrtPriceLower, sqrtPriceUpper, liquidityDelta);
  } else if (sqrtPriceX96 >= sqrtPriceUpper) {
    // Current price is above the range, position is entirely in token1
    amount1 = getAmount1ForLiquidity(sqrtPriceLower, sqrtPriceUpper, liquidityDelta);
  } else {
    // Current price is within the range
    amount0 = getAmount0ForLiquidity(sqrtPriceX96, sqrtPriceUpper, liquidityDelta);
    amount1 = getAmount1ForLiquidity(sqrtPriceLower, sqrtPriceX96, liquidityDelta);
  }

  return { amount0, amount1 };
}

export function calculateLiquidityForAmounts(
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number,
  amount0: bigint,
  amount1: bigint
): bigint {
  const sqrtPriceLower = tickToSqrtPriceX96(tickLower);
  const sqrtPriceUpper = tickToSqrtPriceX96(tickUpper);

  let liquidity: bigint;

  if (sqrtPriceX96 <= sqrtPriceLower) {
    // Below range - use only amount0
    liquidity = getLiquidityForAmount0(sqrtPriceLower, sqrtPriceUpper, amount0);
  } else if (sqrtPriceX96 >= sqrtPriceUpper) {
    // Above range - use only amount1
    liquidity = getLiquidityForAmount1(sqrtPriceLower, sqrtPriceUpper, amount1);
  } else {
    // Within range - use minimum of both
    const liquidity0 = getLiquidityForAmount0(sqrtPriceX96, sqrtPriceUpper, amount0);
    const liquidity1 = getLiquidityForAmount1(sqrtPriceLower, sqrtPriceX96, amount1);
    liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
  }

  return liquidity;
}

// Helper: Convert tick to sqrtPriceX96
function tickToSqrtPriceX96(tick: number): bigint {
  const absTick = tick < 0 ? -tick : tick;

  let ratio =
    (absTick & 0x1) !== 0
      ? BigInt("0xfffcb933bd6fad37aa2d162d1a594001")
      : BigInt("0x100000000000000000000000000000000");

  if ((absTick & 0x2) !== 0)
    ratio = (ratio * BigInt("0xfff97272373d413259a46990580e213a")) >> 128n;
  if ((absTick & 0x4) !== 0)
    ratio = (ratio * BigInt("0xfff2e50f5f656932ef12357cf3c7fdcc")) >> 128n;
  if ((absTick & 0x8) !== 0)
    ratio = (ratio * BigInt("0xffe5caca7e10e4e61c3624eaa0941cd0")) >> 128n;
  if ((absTick & 0x10) !== 0)
    ratio = (ratio * BigInt("0xffcb9843d60f6159c9db58835c926644")) >> 128n;
  if ((absTick & 0x20) !== 0)
    ratio = (ratio * BigInt("0xff973b41fa98c081472e6896dfb254c0")) >> 128n;
  if ((absTick & 0x40) !== 0)
    ratio = (ratio * BigInt("0xff2ea16466c96a3843ec78b326b52861")) >> 128n;
  if ((absTick & 0x80) !== 0)
    ratio = (ratio * BigInt("0xfe5dee046a99a2a811c461f1969c3053")) >> 128n;
  if ((absTick & 0x100) !== 0)
    ratio = (ratio * BigInt("0xfcbe86c7900a88aedcffc83b479aa3a4")) >> 128n;
  if ((absTick & 0x200) !== 0)
    ratio = (ratio * BigInt("0xf987a7253ac413176f2b074cf7815e54")) >> 128n;
  if ((absTick & 0x400) !== 0)
    ratio = (ratio * BigInt("0xf3392b0822b70005940c7a398e4b70f3")) >> 128n;
  if ((absTick & 0x800) !== 0)
    ratio = (ratio * BigInt("0xe7159475a2c29b7443b29c7fa6e889d9")) >> 128n;
  if ((absTick & 0x1000) !== 0)
    ratio = (ratio * BigInt("0xd097f3bdfd2022b8845ad8f792aa5825")) >> 128n;
  if ((absTick & 0x2000) !== 0)
    ratio = (ratio * BigInt("0xa9f746462d870fdf8a65dc1f90e061e5")) >> 128n;
  if ((absTick & 0x4000) !== 0)
    ratio = (ratio * BigInt("0x70d869a156d2a1b890bb3df62baf32f7")) >> 128n;
  if ((absTick & 0x8000) !== 0)
    ratio = (ratio * BigInt("0x31be135f97d08fd981231505542fcfa6")) >> 128n;
  if ((absTick & 0x10000) !== 0)
    ratio = (ratio * BigInt("0x9aa508b5b7a84e1c677de54f3e99bc9")) >> 128n;
  if ((absTick & 0x20000) !== 0)
    ratio = (ratio * BigInt("0x5d6af8dedb81196699c329225ee604")) >> 128n;
  if ((absTick & 0x40000) !== 0)
    ratio = (ratio * BigInt("0x2216e584f5fa1ea926041bedfe98")) >> 128n;
  if ((absTick & 0x80000) !== 0)
    ratio = (ratio * BigInt("0x48a170391f7dc42444e8fa2")) >> 128n;

  if (tick > 0) {
    ratio = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") / ratio;
  }

  // Round to nearest
  return (ratio >> 32n) + (ratio % (1n << 32n) === 0n ? 0n : 1n);
}

// Helper: Get amount0 for given liquidity and price range
function getAmount0ForLiquidity(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }
  return (
    (liquidity * (sqrtRatioBX96 - sqrtRatioAX96) * (1n << 96n)) /
    (sqrtRatioBX96 * sqrtRatioAX96)
  );
}

// Helper: Get amount1 for given liquidity and price range
function getAmount1ForLiquidity(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }
  return (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / (1n << 96n);
}

// Helper: Get liquidity for amount0
function getLiquidityForAmount0(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  amount0: bigint
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }
  const intermediate = (sqrtRatioAX96 * sqrtRatioBX96) / (1n << 96n);
  return (amount0 * intermediate) / (sqrtRatioBX96 - sqrtRatioAX96);
}

// Helper: Get liquidity for amount1
function getLiquidityForAmount1(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  amount1: bigint
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }
  return (amount1 * (1n << 96n)) / (sqrtRatioBX96 - sqrtRatioAX96);
}

// ============================================
// Quote Generation
// ============================================

export async function generateZapQuote(
  request: ZapMintRequest,
  tokenPrices: Map<string, number>
): Promise<ZapQuote> {
  const poolState = await getPoolStateForZap(request.poolAddress);

  // Get token info
  const client = publicClient;
  const [symbol0, decimals0, symbol1, decimals1] = await client.multicall({
    contracts: [
      { address: poolState.token0, abi: ERC20_FULL_ABI, functionName: "symbol" },
      { address: poolState.token0, abi: ERC20_FULL_ABI, functionName: "decimals" },
      { address: poolState.token1, abi: ERC20_FULL_ABI, functionName: "symbol" },
      { address: poolState.token1, abi: ERC20_FULL_ABI, functionName: "decimals" },
    ],
    allowFailure: false,
  });

  // Parse amounts
  const amount0Desired = parseUnits(request.amount0Desired, decimals0 as number);
  const amount1Desired = parseUnits(request.amount1Desired, decimals1 as number);

  // Calculate slippage
  const slippageBps = BigInt(Math.floor(request.slippagePercent * 100));
  const amount0Min = (amount0Desired * (10000n - slippageBps)) / 10000n;
  const amount1Min = (amount1Desired * (10000n - slippageBps)) / 10000n;

  // Check allowances
  const { token0NeedsApproval, token1NeedsApproval } = await checkAllowances(
    request.userAddress,
    poolState.token0,
    poolState.token1,
    amount0Desired,
    amount1Desired
  );

  // Build steps
  const steps: ZapStepInfo[] = [];

  if (token0NeedsApproval && amount0Desired > 0n) {
    steps.push({
      step: "approve_token0",
      status: "ready",
      transaction: prepareApproveToken(poolState.token0, AERODROME_NPM),
    });
  }

  if (token1NeedsApproval && amount1Desired > 0n) {
    steps.push({
      step: "approve_token1",
      status: "ready",
      transaction: prepareApproveToken(poolState.token1, AERODROME_NPM),
    });
  }

  // Mint step
  const mintParams: MintParams = {
    token0: poolState.token0,
    token1: poolState.token1,
    tickSpacing: poolState.tickSpacing,
    tickLower: request.tickLower,
    tickUpper: request.tickUpper,
    amount0Desired,
    amount1Desired,
    amount0Min,
    amount1Min,
    recipient: request.userAddress,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 1800), // 30 min
    sqrtPriceX96: poolState.sqrtPriceX96,
  };

  steps.push({
    step: "mint",
    status: steps.length === 0 ? "ready" : "pending",
    transaction: prepareMint(mintParams),
  });

  // Stake steps (if requested and gauge exists)
  if (request.autoStake && poolState.gauge && poolState.isGaugeAlive) {
    steps.push({
      step: "approve_nft",
      status: "pending",
      // Transaction will be prepared after mint (needs tokenId)
    });
    steps.push({
      step: "stake",
      status: "pending",
      // Transaction will be prepared after NFT approval
    });
  }

  // Calculate prices
  const price0 = tokenPrices.get(poolState.token0.toLowerCase()) || 0;
  const price1 = tokenPrices.get(poolState.token1.toLowerCase()) || 0;
  const amount0Formatted = Number(amount0Desired) / Math.pow(10, decimals0 as number);
  const amount1Formatted = Number(amount1Desired) / Math.pow(10, decimals1 as number);
  const totalValueUSD = amount0Formatted * price0 + amount1Formatted * price1;

  // Calculate estimated APR (simplified)
  const priceLower = tickToPrice(request.tickLower, decimals0 as number, decimals1 as number);
  const priceUpper = tickToPrice(request.tickUpper, decimals0 as number, decimals1 as number);

  // Warnings
  const warnings: string[] = [];
  if (!poolState.gauge) {
    warnings.push("This pool has no gauge - no AERO emissions available");
  } else if (!poolState.isGaugeAlive) {
    warnings.push("Gauge is not currently active - emissions may be paused");
  }
  if (request.tickLower > poolState.currentTick || request.tickUpper < poolState.currentTick) {
    warnings.push("Selected range is out of current price - position will be single-sided");
  }

  return {
    pool: {
      address: request.poolAddress,
      token0: { address: poolState.token0, symbol: symbol0 as string, decimals: decimals0 as number },
      token1: { address: poolState.token1, symbol: symbol1 as string, decimals: decimals1 as number },
      tickSpacing: poolState.tickSpacing,
      currentTick: poolState.currentTick,
      sqrtPriceX96: poolState.sqrtPriceX96.toString(),
    },
    position: {
      tickLower: request.tickLower,
      tickUpper: request.tickUpper,
      priceLower,
      priceUpper,
      amount0: amount0Formatted.toString(),
      amount1: amount1Formatted.toString(),
      amount0USD: amount0Formatted * price0,
      amount1USD: amount1Formatted * price1,
      totalValueUSD,
    },
    estimatedReturns: {
      dailyFeeUSD: 0, // TODO: Calculate from pool data
      dailyEmissionUSD: 0, // TODO: Calculate from emission rate
      dailyTotalUSD: 0,
      feeAPR: 0,
      emissionAPR: 0,
      totalAPR: 0,
    },
    steps,
    warnings,
  };
}
