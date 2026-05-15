'use client'

import type {Pin} from './RestaurantApp'
import {formatDistance} from '@/lib/distance'

export default function RestaurantList({
  pins,
  showDistance,
}: {
  pins: Pin[]
  showDistance: boolean
}) {
  if (pins.length === 0) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <p className="text-lg font-semibold text-stone-900">No restaurants match</p>
          <p className="mt-1 text-sm text-stone-500">
            Try removing some filters or search a wider area.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-stone-200">
      {pins.map((pin) => (
        <RestaurantRow key={pin.key} pin={pin} showDistance={showDistance} />
      ))}
    </ul>
  )
}

function RestaurantRow({pin, showDistance}: {pin: Pin; showDistance: boolean}) {
  const {restaurant, location, distanceKm} = pin
  const cuisines = restaurant.cuisines?.map((c) => c.name).filter(Boolean).join(' · ')
  const addressLine = [
    location.address?.line1,
    location.address?.town || location.city,
    location.address?.postcode,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <li className="px-4 py-4 transition hover:bg-stone-50 md:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-stone-900">
            {restaurant.restaurant_name || 'Untitled restaurant'}
          </h3>
          {cuisines && (
            <p className="mt-0.5 truncate text-xs text-stone-500">{cuisines}</p>
          )}
          {addressLine && (
            <p className="mt-1 truncate text-xs text-stone-600">{addressLine}</p>
          )}
          {restaurant.top_tags && restaurant.top_tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {restaurant.top_tags.slice(0, 4).map((tag) => (
                <span
                  key={tag._id}
                  className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700"
                >
                  {tag.name}
                </span>
              ))}
              {restaurant.top_tags.length > 4 && (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                  +{restaurant.top_tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {restaurant.avg_rating != null && (
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              <span aria-hidden>★</span>
              <span>{restaurant.avg_rating.toFixed(1)}</span>
            </div>
          )}
          {showDistance && distanceKm != null && (
            <span className="text-xs font-medium text-stone-500">
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}
