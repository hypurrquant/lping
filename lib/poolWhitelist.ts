// High-TVL and popular Aerodrome CL pools for fast discovery
// Update periodically based on Dexscreener or Defillama data

export type PoolKey = {
  token0: string;
  token1: string;
  tickSpacing: number;
  symbol?: string; // e.g. "WETH/USDC-100"
};

export const WHITELIST_POOLS: PoolKey[] = [
  // WETH/USDC (Top tier)
  { token0: "0x4200000000000000000000000000000000000006", token1: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", tickSpacing: 1, symbol: "WETH/USDC-1" },
  { token0: "0x4200000000000000000000000000000000000006", token1: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", tickSpacing: 100, symbol: "WETH/USDC-100" },
  { token0: "0x4200000000000000000000000000000000000006", token1: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", tickSpacing: 200, symbol: "WETH/USDC-200" },

  // WETH/AERO
  { token0: "0x4200000000000000000000000000000000000006", token1: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", tickSpacing: 200, symbol: "WETH/AERO-200" },
  { token0: "0x4200000000000000000000000000000000000006", token1: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", tickSpacing: 100, symbol: "WETH/AERO-100" },
  { token0: "0x4200000000000000000000000000000000000006", token1: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", tickSpacing: 50, symbol: "WETH/AERO-50" },

  // WETH/cbBTC
  { token0: "0x4200000000000000000000000000000000000006", token1: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", tickSpacing: 100, symbol: "WETH/cbBTC-100" },
  { token0: "0x4200000000000000000000000000000000000006", token1: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", tickSpacing: 50, symbol: "WETH/cbBTC-50" },
  { token0: "0x4200000000000000000000000000000000000006", token1: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", tickSpacing: 200, symbol: "WETH/cbBTC-200" },

  // USDC/cbBTC
  { token0: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", token1: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", tickSpacing: 100, symbol: "USDC/cbBTC-100" },
  { token0: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", token1: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", tickSpacing: 50, symbol: "USDC/cbBTC-50" },

  // WETH/DEGEN
  { token0: "0x4200000000000000000000000000000000000006", token1: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", tickSpacing: 200, symbol: "WETH/DEGEN-200" },
  { token0: "0x4200000000000000000000000000000000000006", token1: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", tickSpacing: 100, symbol: "WETH/DEGEN-100" },

  // USDC/USDbC (Stablecoin pair)
  { token0: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", token1: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", tickSpacing: 1, symbol: "USDC/USDbC-1" },

  // WETH/VIRTUAL
  { token0: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", token1: "0x4200000000000000000000000000000000000006", tickSpacing: 200, symbol: "VIRTUAL/WETH-200" },
  { token0: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", token1: "0x4200000000000000000000000000000000000006", tickSpacing: 100, symbol: "VIRTUAL/WETH-100" },

  // USDC/EURC (Stablecoin)
  { token0: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42", token1: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", tickSpacing: 1, symbol: "EURC/USDC-1" },

  // WETH/BRETT
  { token0: "0x4200000000000000000000000000000000000006", token1: "0x532f27101965dd16442E59d40670FaF5eBB142E4", tickSpacing: 200, symbol: "WETH/BRETT-200" },

  // WETH/TOSHI
  { token0: "0x4200000000000000000000000000000000000006", token1: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4", tickSpacing: 200, symbol: "WETH/TOSHI-200" },

  // WETH/MOCHI
  { token0: "0x4200000000000000000000000000000000000006", token1: "0xF6e932Ca12afa26665dC4dDE7e27be02A7c02e50", tickSpacing: 200, symbol: "WETH/MOCHI-200" },

  // USDC/AERO
  { token0: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", token1: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", tickSpacing: 200, symbol: "USDC/AERO-200" },
  { token0: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", token1: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", tickSpacing: 100, symbol: "USDC/AERO-100" },
];

// Token metadata for common tokens (optional, for display)
export const TOKEN_METADATA: Record<string, { symbol: string; name: string; decimals: number }> = {
  "0x4200000000000000000000000000000000000006": { symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": { symbol: "USDC", name: "USD Coin", decimals: 6 },
  "0x940181a94A35A4569E4529A3CDfB74e38FD98631": { symbol: "AERO", name: "Aerodrome", decimals: 18 },
  "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf": { symbol: "cbBTC", name: "Coinbase Wrapped BTC", decimals: 8 },
  "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed": { symbol: "DEGEN", name: "Degen", decimals: 18 },
  "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA": { symbol: "USDbC", name: "USD Base Coin", decimals: 6 },
  "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b": { symbol: "VIRTUAL", name: "Virtual Protocol", decimals: 18 },
  "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42": { symbol: "EURC", name: "Euro Coin", decimals: 6 },
};

