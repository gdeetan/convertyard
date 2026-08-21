'use client'
import { useEffect, useRef } from 'react'
import type { GpsFix } from '@/lib/converters/exif-viewer.types'

export function GpsMap({ gps }: { gps: GpsFix }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let map: import('leaflet').Map | undefined
    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (!ref.current) return
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([gps.lat, gps.lon], 13)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)
      L.marker([gps.lat, gps.lon]).addTo(map)
    })()
    return () => { map?.remove() }
  }, [gps.lat, gps.lon])

  return (
    <div>
      <div ref={ref} className="h-64 w-full rounded border border-gray-200" />
      <p className="mt-1 text-xs text-gray-500">
        {gps.lat.toFixed(6)}, {gps.lon.toFixed(6)}
        {gps.altitude != null && ` · ${gps.altitude.toFixed(1)} m`}
      </p>
    </div>
  )
}
