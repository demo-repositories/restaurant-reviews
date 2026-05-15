'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import Link from 'next/link'
import {useRouter, useSearchParams} from 'next/navigation'
import type {Restaurant, RestaurantLocation} from '@/sanity/types'

type Props = {
  initialQuery: string
  initialResults: Restaurant[]
}

type Hit = {
  key: string
  restaurant: Restaurant
  location: RestaurantLocation
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

export default function SearchPage({initialQuery, initialResults}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Restaurant[]>(initialResults)
  const [status, setStatus] = useState<Status>(initialQuery ? 'ready' : 'idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const initialQueryRef = useRef(initialQuery)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      setResults([])
      setStatus('idle')
      const next = new URLSearchParams(searchParams)
      next.delete('q')
      const qs = next.toString()
      router.replace(qs ? `/search?${qs}` : '/search', {scroll: false})
      return
    }

    if (trimmed === initialQueryRef.current) {
      initialQueryRef.current = ''
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setStatus('loading')
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as {results: Restaurant[]}
        setResults(data.results)
        setStatus('ready')
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error(error)
        setStatus('error')
      }
    }, 250)

    const next = new URLSearchParams(searchParams)
    next.set('q', trimmed)
    const qs = next.toString()
    router.replace(`/search?${qs}`, {scroll: false})

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
    // searchParams is intentionally omitted; we only want this to re-run when
    // the user changes the query string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const hits = useMemo<Hit[]>(() => {
    const result: Hit[] = []
    console.log(results)
    for (const restaurant of results) {
      const locations = restaurant.locations ?? []
      if (locations.length === 0) {
        result.push({
          key: restaurant._id,
          restaurant,
          location: emptyLocation(restaurant._id),
        })
        continue
      }
      for (const loc of locations) {
        result.push({
          key: `${restaurant._id}::${loc._id}`,
          restaurant,
          location: loc,
        })
      }
    }
    return result
  }, [results])

  const trimmed = query.trim()
  const showEmpty = trimmed === '' && status === 'idle'
  const showLoading = status === 'loading'
  const showNoResults = trimmed !== '' && status === 'ready' && hits.length === 0
  const showError = status === 'error'

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:py-4">
          <Link
            href="/"
            aria-label="Back to listings"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-100"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <SearchInput
            ref={inputRef}
            value={query}
            loading={showLoading}
            onChange={setQuery}
            onClear={() => setQuery('')}
          />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {showEmpty && <EmptyState />}
        {showError && <ErrorState />}
        {showNoResults && <NoResults query={trimmed} />}
        {hits.length > 0 && (
          <>
            <p className="mb-3 text-xs text-stone-500">
              {hits.length.toLocaleString()} {hits.length === 1 ? 'result' : 'results'}
            </p>
            <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
              {hits.map((hit) => (
                <SearchResult key={hit.key} hit={hit} query={trimmed} />
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  )
}

function emptyLocation(id: string): RestaurantLocation {
  return {
    _id: `${id}::no-location`,
    city: null,
    region: null,
    country: null,
    latitude: null,
    longitude: null,
    address: null,
  }
}

const SearchInput = ({
  ref,
  value,
  loading,
  onChange,
  onClear,
}: {
  ref: React.RefObject<HTMLInputElement | null>
  value: string
  loading: boolean
  onChange: (next: string) => void
  onClear: () => void
}) => {
  return (
    <div className="relative flex-1">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search restaurants, cuisines, cities, postcodes…"
        aria-label="Search restaurants"
        autoComplete="off"
        className="w-full rounded-full border border-stone-300 bg-white py-2.5 pl-10 pr-10 text-sm placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 md:text-base"
      />
      {loading ? (
        <span
          aria-label="Loading"
          className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700"
        />
      ) : (
        value && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )
      )}
    </div>
  )
}

function SearchResult({hit, query}: {hit: Hit; query: string}) {
  const {restaurant, location} = hit
  const cuisines = restaurant.cuisines
    ?.map((c) => c.name)
    .filter(Boolean)
    .join(' · ')
  const addressLine = [
    location.address?.line1,
    location.address?.town || location.city,
    location.address?.postcode,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <li className="px-4 py-3 transition hover:bg-stone-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-stone-900 md:text-base">
            {restaurant.restaurant_name || 'Untitled restaurant'}
          </h3>
          {cuisines && <p className="mt-0.5 truncate text-xs text-stone-500">{cuisines}</p>}
          {addressLine && <p className="mt-1 truncate text-xs text-stone-600">{addressLine}</p>}
        </div>
        {restaurant.avg_rating != null && (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            <span aria-hidden>★</span>
            <span>{restaurant.avg_rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <p className="text-sm font-medium text-stone-700">Start typing to search</p>
      <p className="mt-1 text-xs text-stone-500">
        Searches across restaurant names and any other text on the document.
      </p>
    </div>
  )
}

function NoResults({query}: {query: string}) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <p className="text-sm font-medium text-stone-700">No results for &ldquo;{query}&rdquo;</p>
      <p className="mt-1 text-xs text-stone-500">Try a different spelling or a broader term.</p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <p className="text-sm font-medium text-red-800">Search failed</p>
      <p className="mt-1 text-xs text-red-700">Please try again in a moment.</p>
    </div>
  )
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const tokens = query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
  if (tokens.length === 0) return text

  const pattern = new RegExp(`(${tokens.map(escapeRegex).join('|')})`, 'ig')
  const parts = text.split(pattern)

  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="rounded bg-amber-100 px-0.5 text-stone-900">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
