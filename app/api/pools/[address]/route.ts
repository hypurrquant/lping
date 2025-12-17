import { NextRequest, NextResponse } from 'next/server'
import { Address } from 'viem'
import { fetchPool } from '@/lib/explore/poolService'
import { fetchLiquidityDistribution, aggregateLiquidityHistogram } from '@/lib/explore/liquidityService'

interface RouteParams {
  params: Promise<{ address: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = await params
    const poolAddress = address as Address

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(poolAddress)) {
      return NextResponse.json(
        { error: 'Invalid pool address' },
        { status: 400 }
      )
    }

    // Fetch pool data and liquidity distribution in parallel
    const [pool, liquidityDistribution] = await Promise.all([
      fetchPool(poolAddress).catch(() => null),
      fetchLiquidityDistribution(poolAddress),
    ])

    // Generate histogram for visualization
    const liquidityHistogram = aggregateLiquidityHistogram(liquidityDistribution, 50)

    // Return data even if pool not found in DefiLlama (we still have on-chain data)
    return NextResponse.json({
      pool,
      liquidityDistribution,
      liquidityHistogram,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error in /api/pools/[address]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pool details' },
      { status: 500 }
    )
  }
}
