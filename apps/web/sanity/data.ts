import {sanityClient} from './client'
import {
  CUISINES_QUERY,
  FEATURES_QUERY,
  RESTAURANTS_QUERY,
  SEARCH_QUERY,
  TAGS_QUERY,
} from './queries'
import type {Restaurant, TaxonomyTerm} from './types'

export async function loadRestaurants(): Promise<Restaurant[]> {
  return sanityClient.fetch<Restaurant[]>(RESTAURANTS_QUERY, {}, {method: 'POST'})
}

/**
 * Search restaurants via Sanity using the GROQ `@ match` operator.
 */
export async function searchRestaurants(query: string): Promise<Restaurant[]> {
  const trimmed = query.trim()
  

  return sanityClient.fetch<Restaurant[]>(SEARCH_QUERY, {q: trimmed}, {method: 'POST'})
}

export async function loadAppData(): Promise<{
  restaurants: Restaurant[]
  cuisines: TaxonomyTerm[]
  tags: TaxonomyTerm[]
  features: TaxonomyTerm[]
}> {
  const [restaurants, cuisines, tags, features] = await Promise.all([
    loadRestaurants(),
    sanityClient.fetch<TaxonomyTerm[]>(CUISINES_QUERY, {}, {method: 'POST'}),
    sanityClient.fetch<TaxonomyTerm[]>(TAGS_QUERY, {}, {method: 'POST'}),
    sanityClient.fetch<TaxonomyTerm[]>(FEATURES_QUERY, {}, {method: 'POST'}),
  ])
  return {restaurants, cuisines, tags, features}
}
