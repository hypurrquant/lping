#!/usr/bin/env node
/**
 * Pre-build Pool Cache Generator
 * 
 * Directly reads all pools from CLFactory using allPools(index).
 * Runs during `npm run build` to generate pool-cache.json at build time.
 */

const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');
const fs = require('fs');
const path = require('path');

const FACTORY = '0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A';
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const MAX_POOLS = 300; // Limit for build performance

const FACTORY_ABI = [
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
  {
    type: 'function',
    name: 'getPool',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'tickSpacing', type: 'int24' },
    ],
    outputs: [{ name: 'pool', type: 'address' }],
  },
];

const POOL_ABI = [
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
];

const client = createPublicClient({
  chain: base,
  transport: http(RPC_URL, {
    timeout: 60_000,
    retryCount: 3,
  }),
});

async function main() {
  console.log('🔧 [Build] Generating pool cache from Factory...');
  
  try {
    // Get total pool count
    const totalPools = await client.readContract({
      address: FACTORY,
      abi: FACTORY_ABI,
      functionName: 'allPoolsLength',
    });

    const count = Number(totalPools);
    console.log(`   Total pools in Factory: ${count}`);

    // Get most recent pools (newest first)
    const limit = Math.min(count, MAX_POOLS);
    const startIdx = Math.max(0, count - limit);
    
    console.log(`   Fetching pools [${startIdx} → ${count - 1}] (${limit} pools)...`);

    // Batch read pool addresses
    const poolAddressCalls = [];
    for (let i = startIdx; i < count; i++) {
      poolAddressCalls.push({
        address: FACTORY,
        abi: FACTORY_ABI,
        functionName: 'allPools',
        args: [BigInt(i)],
      });
    }

    console.log(`   Reading ${poolAddressCalls.length} pool addresses...`);
    const poolAddressResults = await client.multicall({
      contracts: poolAddressCalls,
      allowFailure: true,
    });

    const poolAddresses = poolAddressResults
      .filter((r) => r.status === 'success')
      .map((r) => r.result);

    console.log(`   ✅ Got ${poolAddresses.length} pool addresses`);

    // Batch read pool metadata (token0, token1, tickSpacing) in smaller chunks
    console.log(`   Reading pool metadata...`);
    const pools = [];
    const METADATA_CHUNK = 50; // Process 50 pools at a time

    for (let chunkStart = 0; chunkStart < poolAddresses.length; chunkStart += METADATA_CHUNK) {
      const chunkEnd = Math.min(chunkStart + METADATA_CHUNK, poolAddresses.length);
      const chunk = poolAddresses.slice(chunkStart, chunkEnd);
      
      const metadataCalls = chunk.flatMap((pool) => [
        { address: pool, abi: POOL_ABI, functionName: 'token0', args: [] },
        { address: pool, abi: POOL_ABI, functionName: 'token1', args: [] },
        { address: pool, abi: POOL_ABI, functionName: 'tickSpacing', args: [] },
      ]);

      try {
        const metadataResults = await client.multicall({
          contracts: metadataCalls,
          allowFailure: true,
        });

        for (let i = 0; i < chunk.length; i++) {
          const token0Res = metadataResults[i * 3 + 0];
          const token1Res = metadataResults[i * 3 + 1];
          const tickSpacingRes = metadataResults[i * 3 + 2];

          if (
            token0Res.status === 'success' &&
            token1Res.status === 'success' &&
            tickSpacingRes.status === 'success'
          ) {
            pools.push({
              pool: chunk[i].toLowerCase(),
              token0: token0Res.result.toLowerCase(),
              token1: token1Res.result.toLowerCase(),
              tickSpacing: Number(tickSpacingRes.result),
              index: startIdx + chunkStart + i,
            });
          }
        }
        console.log(`     [${chunkStart + 1}→${chunkEnd}] ${pools.length} pools parsed`);
      } catch (e) {
        console.warn(`     ⚠️ Chunk [${chunkStart}→${chunkEnd}] failed: ${e.message}`);
      }
    }

    console.log(`   ✅ Parsed ${pools.length} pools with metadata`);

    // Reverse to get newest first
    pools.reverse();

    const output = {
      generatedAt: new Date().toISOString(),
      totalPoolsInFactory: count,
      includedPools: pools.length,
      pools,
    };

    const outPath = path.join(process.cwd(), 'public', 'pool-cache.json');
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`   💾 Saved ${pools.length} pools to public/pool-cache.json`);
    console.log('   ✅ Pool cache ready for deployment\n');
  } catch (e) {
    console.error('❌ [Build] Pool cache generation failed:', e.message);
    console.warn('   ⚠️ Continuing build with empty cache...');
    
    const fallback = {
      generatedAt: new Date().toISOString(),
      totalPoolsInFactory: 0,
      includedPools: 0,
      pools: [],
      error: e.message,
    };
    
    const outPath = path.join(process.cwd(), 'public', 'pool-cache.json');
    fs.writeFileSync(outPath, JSON.stringify(fallback, null, 2), 'utf-8');
    process.exit(0); // Don't fail the build
  }
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(0); // Don't fail build
});
