'use client'

import {useEffect, useMemo, useState} from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type {Restaurant, RestaurantLocation, TaxonomyTerm} from '@/sanity/types'
import {distanceKm} from '@/lib/distance'
import Filters from './Filters'
import RestaurantList from './RestaurantList'

const RestaurantMap = dynamic(() => import('./RestaurantMap'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-stone-100 text-sm text-stone-500">
      Loading map…
    </div>
  ),
})

type Props = {
  restaurants: Restaurant[]
  cuisines: TaxonomyTerm[]
  tags: TaxonomyTerm[]
  features: TaxonomyTerm[]
}

export type Pin = {
  key: string
  restaurant: Restaurant
  location: RestaurantLocation
  distanceKm: number | null
}

type SortKey = 'distance' | 'rating'

type GeoState =
  | {status: 'idle'}
  | {status: 'requesting'}
  | {status: 'granted'; latitude: number; longitude: number}
  | {status: 'denied'; message: string}
  | {status: 'unsupported'}

export default function RestaurantApp({restaurants, cuisines, tags, features}: Props) {
  const [geo, setGeo] = useState<GeoState>({status: 'idle'})
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('distance')
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo({status: 'unsupported'})
      return
    }
    setGeo({status: 'requesting'})
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeo({
          status: 'granted',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => setGeo({status: 'denied', message: err.message}),
      {enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000},
    )
  }

  useEffect(() => {
    requestLocation()
    // We only want to trigger this on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const userPos = geo.status === 'granted' ? {latitude: geo.latitude, longitude: geo.longitude} : null

  const pins = useMemo<Pin[]>(() => {
    const result: Pin[] = []
    for (const restaurant of restaurants) {
      for (const loc of restaurant.locations ?? []) {
        if (loc?.latitude == null || loc?.longitude == null) continue
        const dist = userPos
          ? distanceKm(userPos, {latitude: loc.latitude, longitude: loc.longitude})
          : null
        result.push({
          key: `${restaurant._id}::${loc._id}`,
          restaurant,
          location: loc,
          distanceKm: dist,
        })
      }
    }
    return result
  }, [restaurants, userPos])

  const filteredPins = useMemo(() => {
    const matches = (selected: Set<string>, items: TaxonomyTerm[] | undefined) => {
      if (selected.size === 0) return true
      if (!items || items.length === 0) return false
      return items.some((i) => selected.has(i._id))
    }

    return pins.filter(
      ({restaurant}) =>
        matches(selectedCuisines, restaurant.cuisines) &&
        matches(selectedTags, restaurant.top_tags) &&
        matches(selectedFeatures, restaurant.features),
    )
  }, [pins, selectedCuisines, selectedTags, selectedFeatures])

  const sortedPins = useMemo(() => {
    const arr = [...filteredPins]
    if (sortKey === 'distance' && userPos) {
      arr.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    } else {
      arr.sort((a, b) => (b.restaurant.avg_rating ?? 0) - (a.restaurant.avg_rating ?? 0))
    }
    return arr
  }, [filteredPins, sortKey, userPos])

  const effectiveSort: SortKey = sortKey === 'distance' && !userPos ? 'rating' : sortKey

  const totalCount = pins.length
  const visibleCount = sortedPins.length

  return (
    <main className="flex h-screen flex-col bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Restaurants near you
            </h1>
            <p className="text-xs text-stone-500 md:text-sm">
              Showing {visibleCount.toLocaleString()} of {totalCount.toLocaleString()} locations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-100 md:text-sm"
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
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              Search
            </Link>
            <GeoIndicator geo={geo} onRetry={requestLocation} />
          </div>
        </div>
      </header>

      <div className="grid flex-1 overflow-hidden md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden flex-col overflow-y-auto border-r border-stone-200 bg-white md:flex">
          <Filters
            cuisines={cuisines}
            tags={tags}
            features={features}
            selectedCuisines={selectedCuisines}
            selectedTags={selectedTags}
            selectedFeatures={selectedFeatures}
            onChangeCuisines={setSelectedCuisines}
            onChangeTags={setSelectedTags}
            onChangeFeatures={setSelectedFeatures}
            sortKey={effectiveSort}
            onChangeSort={setSortKey}
            canSortByDistance={!!userPos}
          />
        </aside>

        <section className="flex min-h-0 flex-col">
          <div className="flex items-center gap-2 border-b border-stone-200 bg-white px-4 py-2 md:hidden">
            <ToggleButton
              active={mobileView === 'list'}
              onClick={() => setMobileView('list')}
              label="List"
            />
            <ToggleButton
              active={mobileView === 'map'}
              onClick={() => setMobileView('map')}
              label="Map"
            />
            <details className="relative ml-auto">
              <summary className="cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm">
                Filters
              </summary>
              <div className="absolute right-0 z-30 mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 shadow-xl">
                <Filters
                  cuisines={cuisines}
                  tags={tags}
                  features={features}
                  selectedCuisines={selectedCuisines}
                  selectedTags={selectedTags}
                  selectedFeatures={selectedFeatures}
                  onChangeCuisines={setSelectedCuisines}
                  onChangeTags={setSelectedTags}
                  onChangeFeatures={setSelectedFeatures}
                  sortKey={effectiveSort}
                  onChangeSort={setSortKey}
                  canSortByDistance={!!userPos}
                />
              </div>
            </details>
          </div>

          <div className="grid min-h-0 flex-1 md:grid-cols-2">
            <div
              className={`min-h-0 overflow-y-auto md:block ${
                mobileView === 'list' ? 'block' : 'hidden'
              }`}
            >
              <RestaurantList pins={sortedPins} showDistance={!!userPos} />
            </div>
            <div
              className={`min-h-0 md:block ${mobileView === 'map' ? 'block' : 'hidden'}`}
            >
              <RestaurantMap pins={sortedPins} userPos={userPos} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function GeoIndicator({geo, onRetry}: {geo: GeoState; onRetry: () => void}) {
  if (geo.status === 'granted') {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-700">
        <span className="size-2 rounded-full bg-emerald-500" />
        Using your location
      </div>
    )
  }
  if (geo.status === 'requesting') {
    return <div className="text-xs text-stone-500">Locating you…</div>
  }
  return (
    <button
      type="button"
      onClick={onRetry}
      className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
    >
      {geo.status === 'denied' || geo.status === 'unsupported'
        ? 'Enable location'
        : 'Use my location'}
    </button>
  )
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-stone-900 text-white'
          : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
      }`}
    >
      {label}
    </button>
  )
}
