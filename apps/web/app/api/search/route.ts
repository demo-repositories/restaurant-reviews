import {NextResponse, type NextRequest} from 'next/server'
import {searchRestaurants} from '@/sanity/data'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (!q) {
    return NextResponse.json({results: [], q})
  }

  try {
    const results = await searchRestaurants(q)
    return NextResponse.json(
      {results, q},
      {headers: {'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'}},
    )
  } catch (error) {
    console.error('Search failed', error)
    return NextResponse.json({error: 'Search failed', q}, {status: 500})
  }
}
