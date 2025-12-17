import { NextRequest, NextResponse } from 'next/server'
import { Address } from 'viem'
import { simulateInvestment } from '@/lib/explore/simulator'
import { SimulationInput } from '@/lib/explore/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { poolAddress, investmentUSD, tickLower, tickUpper, durationDays } = body

    if (!poolAddress || typeof investmentUSD !== 'number' || typeof tickLower !== 'number' || typeof tickUpper !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: poolAddress, investmentUSD, tickLower, tickUpper' },
        { status: 400 }
      )
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(poolAddress)) {
      return NextResponse.json(
        { error: 'Invalid pool address' },
        { status: 400 }
      )
    }

    // Validate tick range
    if (tickLower >= tickUpper) {
      return NextResponse.json(
        { error: 'tickLower must be less than tickUpper' },
        { status: 400 }
      )
    }

    // Validate investment amount
    if (investmentUSD <= 0) {
      return NextResponse.json(
        { error: 'investmentUSD must be positive' },
        { status: 400 }
      )
    }

    const input: SimulationInput = {
      poolAddress: poolAddress as Address,
      investmentUSD,
      tickLower,
      tickUpper,
      durationDays: durationDays || 30,
    }

    const result = await simulateInvestment(input)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error in /api/simulate:', error)
    return NextResponse.json(
      { error: 'Failed to simulate investment' },
      { status: 500 }
    )
  }
}
