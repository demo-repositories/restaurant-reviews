'use client'

import {useMemo, useState} from 'react'
import type {TaxonomyTerm} from '@/sanity/types'

type Props = {
  cuisines: TaxonomyTerm[]
  tags: TaxonomyTerm[]
  features: TaxonomyTerm[]
  selectedCuisines: Set<string>
  selectedTags: Set<string>
  selectedFeatures: Set<string>
  onChangeCuisines: (next: Set<string>) => void
  onChangeTags: (next: Set<string>) => void
  onChangeFeatures: (next: Set<string>) => void
  sortKey: 'distance' | 'rating'
  onChangeSort: (next: 'distance' | 'rating') => void
  canSortByDistance: boolean
}

export default function Filters(props: Props) {
  const {
    cuisines,
    tags,
    features,
    selectedCuisines,
    selectedTags,
    selectedFeatures,
    onChangeCuisines,
    onChangeTags,
    onChangeFeatures,
    sortKey,
    onChangeSort,
    canSortByDistance,
  } = props

  const totalSelected =
    selectedCuisines.size + selectedTags.size + selectedFeatures.size

  const clearAll = () => {
    onChangeCuisines(new Set())
    onChangeTags(new Set())
    onChangeFeatures(new Set())
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Sort by
        </label>
        <div className="flex gap-2">
          <SortPill
            active={sortKey === 'distance'}
            disabled={!canSortByDistance}
            onClick={() => onChangeSort('distance')}
            label="Distance"
            hint={!canSortByDistance ? 'Enable location to sort by distance' : undefined}
          />
          <SortPill
            active={sortKey === 'rating'}
            onClick={() => onChangeSort('rating')}
            label="Rating"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">Filters</h2>
        {totalSelected > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-stone-500 hover:text-stone-900"
          >
            Clear all ({totalSelected})
          </button>
        )}
      </div>

      <FilterGroup
        title="Cuisine"
        items={cuisines}
        selected={selectedCuisines}
        onChange={onChangeCuisines}
      />
      <FilterGroup
        title="Tags"
        items={tags}
        selected={selectedTags}
        onChange={onChangeTags}
      />
      <FilterGroup
        title="Features"
        items={features}
        selected={selectedFeatures}
        onChange={onChangeFeatures}
      />
    </div>
  )
}

function SortPill({
  active,
  disabled,
  onClick,
  label,
  hint,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  label: string
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-stone-900 text-white'
          : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
      } ${disabled ? 'cursor-not-allowed opacity-50 hover:bg-white' : ''}`}
    >
      {label}
    </button>
  )
}

function FilterGroup({
  title,
  items,
  selected,
  onChange,
}: {
  title: string
  items: TaxonomyTerm[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const validItems = items.filter((item) => item.name)
    if (!q) return validItems
    return validItems.filter((item) => item.name!.toLowerCase().includes(q))
  }, [items, query])

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  return (
    <details open className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-stone-900">
        <span>
          {title}
          {selected.size > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1.5 text-xs font-medium text-white">
              {selected.size}
            </span>
          )}
        </span>
        <span className="text-stone-400 transition group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-2">
        {items.length > 8 && (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="mb-2 w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm placeholder:text-stone-400 focus:border-stone-500 focus:outline-none"
          />
        )}
        <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {visible.map((item) => {
            const checked = selected.has(item._id)
            return (
              <li key={item._id}>
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm transition ${
                    checked ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item._id)}
                    className="size-4 accent-stone-900"
                  />
                  <span className="truncate">{item.name}</span>
                </label>
              </li>
            )
          })}
          {visible.length === 0 && (
            <li className="px-2 py-1 text-sm text-stone-400">No matches</li>
          )}
        </ul>
      </div>
    </details>
  )
}
