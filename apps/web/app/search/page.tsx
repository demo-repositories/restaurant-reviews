import {searchRestaurants} from '@/sanity/data'
import SearchPage from '@/components/SearchPage'

export const revalidate = 60

export const metadata = {
  title: 'Search — Views',
  description: 'Search for restaurants by name, city, or postcode.',
}

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{q?: string}>
}) {
  const {q} = await searchParams
  const initialQuery = q?.trim() ?? ''
  const initialResults = initialQuery ? await searchRestaurants(initialQuery) : []

  return <SearchPage initialQuery={initialQuery} initialResults={initialResults} />
}
