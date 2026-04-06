import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2, AlertTriangle, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { GarageCard } from '@/components/map/GarageCard'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import {
  initMap,
  searchNearbyGarages,
  addGarageMarker,
  getUserLocation,
  haversineKm,
  NAIROBI_CENTER,
  type GarageResult,
} from '@/lib/maps'
import { toast } from 'sonner'

export function GarageMap() {
  const navigate = useNavigate()
  const { isOnline } = useNetworkStatus()
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [garages, setGarages] = useState<GarageResult[]>([])
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null)
  const [selected, setSelected] = useState<GarageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [apiMissing] = useState(
    !import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  )
  const dragStartY = useRef<number | null>(null)

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
  }, [])

  const plotGarages = useCallback(
    (results: GarageResult[], map: google.maps.Map) => {
      clearMarkers()
      results.forEach((g) => {
        const marker = addGarageMarker(map, g, (clicked) => {
          setSelected(clicked)
          setSheetExpanded(true)
        })
        markersRef.current.push(marker)
      })
    },
    [clearMarkers],
  )

  useEffect(() => {
    if (apiMissing || !isOnline) {
      setLoading(false)
      return
    }
    if (!mapElRef.current) return

    let cancelled = false

    async function bootstrap() {
      try {
        const loc = await getUserLocation().catch(() => NAIROBI_CENTER)

        if (cancelled) return

        const map = await initMap(mapElRef.current!, loc, 14)
        mapRef.current = map

        if (cancelled) return
        setUserLocation(loc)

        // User location dot
        new google.maps.Marker({
          position: loc,
          map,
          title: 'Your location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          zIndex: 999,
        })

        const results = await searchNearbyGarages(map, loc)
        if (cancelled) return
        setGarages(results)
        plotGarages(results, map)
      } catch (err) {
        console.error('Map init error', err)
        if (!cancelled) toast.error('Could not load map. Check your API key.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [apiMissing, isOnline, plotGarages])

  // Wire up search box once map + input are ready
  useEffect(() => {
    if (!mapRef.current || !searchInputRef.current || apiMissing || !isOnline) return
    if (searchBoxRef.current) return // already wired

    const box = new google.maps.places.SearchBox(searchInputRef.current)
    searchBoxRef.current = box

    mapRef.current.addListener('bounds_changed', () => {
      box.setBounds(mapRef.current!.getBounds()!)
    })

    box.addListener('places_changed', () => {
      const places = box.getPlaces()
      if (!places?.length) return
      const bounds = new google.maps.LatLngBounds()
      places.forEach((p) => {
        if (p.geometry?.viewport) bounds.union(p.geometry.viewport)
        else if (p.geometry?.location) bounds.extend(p.geometry.location)
      })
      mapRef.current!.fitBounds(bounds)
    })
  }, [apiMissing, isOnline, loading])

  const filteredGarages = searchQuery.trim()
    ? garages.filter(
        (g) =>
          g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : garages

  function handleLogThisGarage(garage: GarageResult) {
    navigate('/log-service/new', {
      state: { prefilledGarage: { name: garage.name, placeId: garage.placeId } },
    })
  }

  if (apiMissing) {
    return (
      <section className="space-y-4 pb-4 animate-enter-up">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/70 bg-white/90 px-6 py-20 text-center shadow-sm">
          <AlertTriangle className="h-10 w-10 text-yellow-500" />
          <h2 className="text-[16px] font-semibold text-mz-black">Google Maps API key not set</h2>
          <p className="text-[13px] text-mz-gray-500">
            Add <code className="rounded bg-mz-gray-100 px-1 py-0.5 text-xs">VITE_GOOGLE_MAPS_API_KEY</code> to your{' '}
            <code className="rounded bg-mz-gray-100 px-1 py-0.5 text-xs">.env.local</code> file and restart the dev server.
          </p>
        </div>
      </section>
    )
  }

  const onHandlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragStartY.current = event.clientY
  }

  const onHandlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStartY.current == null) return
    const delta = event.clientY - dragStartY.current
    if (delta < -24) setSheetExpanded(true)
    else if (delta > 24) setSheetExpanded(false)
    else setSheetExpanded((prev) => !prev)
    dragStartY.current = null
  }

  return (
    <section className="relative -mx-4 -mt-6 h-[calc(100dvh-56px-env(safe-area-inset-bottom,0px))] animate-enter-up overflow-hidden pb-0">
      <div className="relative flex h-full flex-col">
      {/* Search bar overlay */}
      <div className="absolute inset-x-0 top-0 z-20 m-3 rounded-xl bg-white px-[14px] py-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
        <div className="flex items-center gap-2.5">
          <Search className="h-4 w-4 text-mz-gray-500" />
          <Input
            ref={searchInputRef}
            placeholder="Search garages in Nairobi..."
            className="h-auto flex-1 border-none bg-transparent px-0 py-0 text-[13px] text-mz-black shadow-none placeholder:text-[#9B6163] focus-visible:border-none focus-visible:ring-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4 text-mz-gray-300" />
            </button>
          )}
          <span className="rounded-[20px] bg-mz-red-light px-[10px] py-1 text-[11px] font-semibold text-mz-red" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Nearby
          </span>
        </div>
      </div>

      {/* Map container */}
      <div ref={mapElRef} className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-mz-gray-100/95 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-mz-red" />
            <p className="text-[13px] text-mz-gray-500">Loading map…</p>
          </div>
        )}

        {!isOnline ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-mz-gray-100/88 px-5 backdrop-blur-[2px]">
            <div className="flex max-w-[260px] flex-col items-center rounded-2xl bg-white px-5 py-6 text-center shadow-[0_10px_30px_rgba(17,16,16,0.12)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mz-red-light">
                <MapPin className="h-5 w-5 text-mz-red" />
              </span>
              <p className="mt-4 text-[15px] font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Map requires internet — connect to view garages
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom sheet */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl bg-white/98"
        style={{ height: sheetExpanded ? '60vh' : '160px', transition: 'height 220ms ease' }}
      >
        <button
          type="button"
          aria-label="Toggle garage list"
          className="w-full cursor-grab active:cursor-grabbing"
          onPointerDown={onHandlePointerDown}
          onPointerUp={onHandlePointerUp}
        >
          <span className="mx-auto my-2 block h-1 w-9 rounded-full bg-mz-gray-300" />
        </button>

        <div className="h-[calc(100%-20px)] overflow-y-auto pb-4">
          {selected ? (
            <>
              <button
                type="button"
                className="mb-1 ml-3 text-xs text-mz-gray-500"
                onClick={() => setSelected(null)}
              >
                ← Back to all garages
              </button>
              <GarageCard
                garage={selected}
                distanceKm={
                  userLocation
                    ? haversineKm(userLocation, { lat: selected.lat, lng: selected.lng })
                    : undefined
                }
                onLogThisGarage={handleLogThisGarage}
              />
            </>
          ) : (
            <>
              {filteredGarages.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mz-red-light">
                    <Search className="h-6 w-6 text-mz-red" />
                  </div>
                  <p className="mt-4 text-[16px] font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>No garages found</p>
                  <p className="mt-[6px] max-w-[240px] text-center text-[13px] text-mz-gray-500">Try a different search or expand the map view.</p>
                </div>
              ) : (
                filteredGarages.map((g) => (
                  <GarageCard
                    key={g.placeId}
                    garage={g}
                    distanceKm={
                      userLocation
                        ? haversineKm(userLocation, { lat: g.lat, lng: g.lng })
                        : undefined
                    }
                    onLogThisGarage={handleLogThisGarage}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </section>
  )
}
