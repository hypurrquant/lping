#!/usr/bin/env tsx
/**
 * Pool Cache Builder
 * 
 * Crawls CLFactory PoolCreated events and generates a static cache file.
 * Run periodically (e.g., via GitHub Actions or cron) to keep pool list fresh.
 * 
 * Usage:
 *   npm install --save-dev tsx
 *   npx tsx scripts/build-pool-cache.ts
 * 
 * Environment:
 *   NEXT_PUBLIC_BASE_RPC_URL (optional, defaults to public Base RPC)
 */

import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';

const FACTORY = '0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A';
const DEPLOY_BLOCK = 14000000n; // Approximate CLFactory deploy block on Base
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

const client = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

type PoolCacheEntry = {
  pool: string;
  token0: string;
  token1: string;
  tickSpacing: number;
  blockNumber: string;
};

async function main() {
  console.log('🔍 Scanning CLFactory PoolCreated events...');
  const latest = await client.getBlockNumber();
  console.log(`   From block ${DEPLOY_BLOCK} to ${latest}`);

  const eventAbi = parseAbiItem('event PoolCreated(address indexed token0, address indexed token1, int24 indexed tickSpacing, address pool)');

  // Split into chunks to avoid RPC limits
  const CHUNK_SIZE = 100_000n;
  const allLogs: any[] = [];
  let fromBlock = DEPLOY_BLOCK;

  while (fromBlock < latest) {
    const toBlock = fromBlock + CHUNK_SIZE > latest ? latest : fromBlock + CHUNK_SIZE;
    console.log(`   Fetching ${fromBlock} → ${toBlock}...`);
    try {
      const logs = await client.getLogs({
        address: FACTORY,
        event: eventAbi,
        fromBlock,
        toBlock,
      });
      allLogs.push(...logs);
      console.log(`     Found ${logs.length} events (total: ${allLogs.length})`);
    } catch (e: any) {
      console.error(`     ⚠️ Error fetching chunk: ${e.message}`);
      // Continue with smaller chunk or skip
      if (CHUNK_SIZE > 10_000n) {
        console.log('     Retrying with smaller chunk size...');
        fromBlock += 10_000n;
        continue;
      }
    }
    fromBlock = toBlock + 1n;
  }

  console.log(`✅ Found ${allLogs.length} PoolCreated events total`);

  const pools: PoolCacheEntry[] = allLogs.map((log) => {
    const { token0, token1, tickSpacing, pool } = log.args as any;
    return {
      pool: pool.toLowerCase(),
      token0: token0.toLowerCase(),
      token1: token1.toLowerCase(),
      tickSpacing: Number(tickSpacing),
      blockNumber: log.blockNumber.toString(),
    };
  });

  // Sort by block (newest first)
  pools.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

  const output = {
    generatedAt: new Date().toISOString(),
    latestBlock: latest.toString(),
    totalPools: pools.length,
    pools,
  };

  const outPath = path.join(process.cwd(), 'public', 'pool-cache.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`💾 Saved ${pools.length} pools to ${outPath}`);
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});

