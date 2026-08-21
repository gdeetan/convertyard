'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type { GpsFix } from '@/lib/converters/exif-viewer.types'

export function GpsMap({ gps }: { gps: GpsFix }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let map: import('leaflet').Map | undefined
    ;(async () => {
      const L = (await import('leaflet')).default
      if (!ref.current) return
      const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
      const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png'
      const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      const DefaultIcon = L.icon({
        iconUrl,
        iconRetinaUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([gps.lat, gps.lon], 13)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)
      L.marker([gps.lat, gps.lon], { icon: DefaultIcon }).addTo(map)
      setTimeout(() => map?.invalidateSize(), 0)
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
