import { NextRequest, NextResponse } from 'next/server'
import { analyzeAllPools, simulateInvestment } from '@/lib/explore/analysisService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const minTVL = parseInt(searchParams.get('minTVL') || '100000')
    const sortBy = (searchParams.get('sortBy') || 'apr') as 'apr' | 'tvl' | 'emissions' | 'volume'
    const limit = parseInt(searchParams.get('limit') || '30')

    const analysis = await analyzeAllPools({ minTVL, sortBy, limit })

    // Convert functions to serializable format
    const pools = analysis.pools.map(pool => ({
      ...pool,
      estimatedDailyReturn: undefined,
      estimatedWeeklyReturn: undefined,
      estimatedMonthlyReturn: undefined,
    }))

    return NextResponse.json({
      ...analysis,
      pools,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze pools' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { poolSymbol, investment } = body

    if (!poolSymbol || !investment) {
      return NextResponse.json(
        { error: 'Missing poolSymbol or investment amount' },
        { status: 400 }
      )
    }

    const analysis = await analyzeAllPools({ minTVL: 0, limit: 100 })
    const pool = analysis.pools.find(p => p.symbol === poolSymbol)

    if (!pool) {
      return NextResponse.json(
        { error: 'Pool not found' },
        { status: 404 }
      )
    }

    const simulation = simulateInvestment(pool, investment, analysis.aeroPrice)

    return NextResponse.json({
      pool: {
        ...pool,
        estimatedDailyReturn: undefined,
        estimatedWeeklyReturn: undefined,
        estimatedMonthlyReturn: undefined,
      },
      simulation,
      aeroPrice: analysis.aeroPrice,
    })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      { error: 'Failed to simulate investment' },
      { status: 500 }
    )
  }
}
