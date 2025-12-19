/**
 * Curated Pools Configuration
 *
 * Only these pools will be shown in the Discover page.
 * Add pools by their contract address.
 */

export interface CuratedPool {
  address: string;
  featured?: boolean;  // Show at the top
  tags?: string[];     // e.g., ['stable', 'blue-chip', 'high-yield']
}

// Curated pool addresses (lowercase)
export const CURATED_POOLS: CuratedPool[] = [
  // Blue-chip pairs
  { address: '0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59', featured: true, tags: ['blue-chip'] },  // WETH/USDC
  { address: '0x70acdf2ad0bf2402c957154f944c19ef4e1cbae1', featured: true, tags: ['blue-chip'] },  // WETH/cbBTC
  { address: '0x4e962bb3889bf030368f56810a9c96b83cb3e778', featured: true, tags: ['blue-chip'] },  // USDC/cbBTC

  // Stablecoin pairs
  { address: '0x0c1a09d5d0445047da3ab4994262b22404288a3b', tags: ['stable'] },  // USDC/USD+
  { address: '0x7501bc8bb51616f79bfa524e464fb7b41f0b10fb', tags: ['stable'] },  // msUSD/USDC

  // ETH LST pairs
  { address: '0x861a2922be165a5bd41b1e482b49216b465e1b5f', tags: ['lst'] },  // WETH/wstETH
  { address: '0x47ca96ea59c13f72745928887f84c9f52c3d7348', tags: ['lst'] },  // cbETH/WETH
  { address: '0x74f72788f4814d7ff3c49b44684aa98eee140c0e', tags: ['lst'] },  // WETH/msETH
  { address: '0x6446021f4e396da3df4235c62537431372195d38', tags: ['lst'] },  // WETH/superOETHb

  // High APR pools
  { address: '0xa4463789e8f3c6a599b3dfb608dde55513bcf289', tags: ['high-yield'] },  // WETH/ZRO
];

// Helper to check if a pool is curated
export function isCuratedPool(address: string): boolean {
  return CURATED_POOLS.some(p => p.address.toLowerCase() === address.toLowerCase());
}

// Get curated pool config
export function getCuratedPoolConfig(address: string): CuratedPool | undefined {
  return CURATED_POOLS.find(p => p.address.toLowerCase() === address.toLowerCase());
}

// Get all curated addresses
export function getCuratedAddresses(): string[] {
  return CURATED_POOLS.map(p => p.address.toLowerCase());
}
