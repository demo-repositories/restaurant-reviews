'use client'

import {useEffect, useMemo} from 'react'
import L, {type LatLngBoundsExpression, type LatLngTuple} from 'leaflet'
import {MapContainer, Marker, Popup, TileLayer, useMap} from 'react-leaflet'
import type {Pin} from './RestaurantApp'
import {formatDistance} from '@/lib/distance'

const restaurantIcon = L.divIcon({
  className: 'restaurant-pin',
  html: `<span style="
    display:flex;align-items:center;justify-content:center;
    width:28px;height:28px;border-radius:9999px;
    background:oklch(0.58 0.22 25);color:white;
    border:2px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,.25);
    font-size:14px;line-height:1;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M3 2v7c0 1.66 1.34 3 3 3v10"/><path d="M6 2v8"/><path d="M18 2v20"/><path d="M14 2v6c0 2.21 1.79 4 4 4"/></svg>
    </span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
})

const userIcon = L.divIcon({
  className: 'user-pin',
  html: `<span style="
    display:block;width:18px;height:18px;border-radius:9999px;
    background:#2563eb;border:3px solid white;
    box-shadow:0 0 0 4px rgba(37,99,235,.25);"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const FALLBACK_CENTER: LatLngTuple = [54.0, -2.0]
const FALLBACK_ZOOM = 6

type Props = {
  pins: Pin[]
  userPos: {latitude: number; longitude: number} | null
}

export default function RestaurantMap({pins, userPos}: Props) {
  const points = useMemo(
    () =>
      pins
        .map((p): LatLngTuple | null =>
          p.location.latitude != null && p.location.longitude != null
            ? [p.location.latitude, p.location.longitude]
            : null,
        )
        .filter((v): v is LatLngTuple => v !== null),
    [pins],
  )

  const initialCenter: LatLngTuple = userPos
    ? [userPos.latitude, userPos.longitude]
    : points[0] || FALLBACK_CENTER
  const initialZoom = userPos || points.length ? 12 : FALLBACK_ZOOM

  return (
    <MapContainer
      key="restaurant-map"
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} userPos={userPos} />
      {userPos && (
        <Marker position={[userPos.latitude, userPos.longitude]} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      {pins.map((pin) => {
        if (pin.location.latitude == null || pin.location.longitude == null) return null
        return (
          <Marker
            key={pin.key}
            position={[pin.location.latitude, pin.location.longitude]}
            icon={restaurantIcon}
          >
            <Popup>
              <div className="space-y-1">
                <strong className="block text-sm">
                  {pin.restaurant.restaurant_name || 'Untitled restaurant'}
                </strong>
                {pin.restaurant.cuisines && pin.restaurant.cuisines.length > 0 && (
                  <div className="text-xs text-stone-500">
                    {pin.restaurant.cuisines.map((c) => c.name).filter(Boolean).join(' · ')}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                  {pin.restaurant.avg_rating != null && (
                    <span className="font-semibold text-amber-700">
                      ★ {pin.restaurant.avg_rating.toFixed(1)}
                    </span>
                  )}
                  {pin.distanceKm != null && (
                    <span className="text-stone-500">{formatDistance(pin.distanceKm)}</span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

function FitBounds({
  points,
  userPos,
}: {
  points: LatLngTuple[]
  userPos: {latitude: number; longitude: number} | null
}) {
  const map = useMap()

  useEffect(() => {
    const all: LatLngTuple[] = [...points]
    if (userPos) all.push([userPos.latitude, userPos.longitude])
    if (all.length === 0) return
    if (all.length === 1) {
      map.setView(all[0], 13, {animate: true})
      return
    }
    const bounds: LatLngBoundsExpression = all
    map.fitBounds(bounds, {padding: [40, 40], maxZoom: 14})
  }, [map, points, userPos])

  return null
}
