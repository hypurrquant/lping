import { NextRequest, NextResponse } from 'next/server'
import { fetchPools } from '@/lib/explore/poolService'
import { PoolsQueryParams } from '@/lib/explore/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const params: PoolsQueryParams = {
      sortBy: (searchParams.get('sortBy') as PoolsQueryParams['sortBy']) || 'apr',
      sortOrder: (searchParams.get('sortOrder') as PoolsQueryParams['sortOrder']) || 'desc',
      minTVL: searchParams.get('minTVL') ? parseFloat(searchParams.get('minTVL')!) : undefined,
      maxTVL: searchParams.get('maxTVL') ? parseFloat(searchParams.get('maxTVL')!) : undefined,
      minAPR: searchParams.get('minAPR') ? parseFloat(searchParams.get('minAPR')!) : undefined,
      token: searchParams.get('token') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    }

    const result = await fetchPools(params)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error in /api/pools:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pools' },
      { status: 500 }
    )
  }
}
