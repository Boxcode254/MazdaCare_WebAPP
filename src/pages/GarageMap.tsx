import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, List, X, Loader2, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { GarageCard } from '@/components/map/GarageCard'
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const [apiMissing] = useState(
    !import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  )

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
          setSheetOpen(true)
        })
        markersRef.current.push(marker)
      })
    },
    [clearMarkers],
  )

  useEffect(() => {
    if (apiMissing) {
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
  }, [apiMissing, plotGarages])

  // Wire up search box once map + input are ready
  useEffect(() => {
    if (!mapRef.current || !searchInputRef.current || apiMissing) return
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
  }, [apiMissing, loading])

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
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500" />
        <h2 className="text-lg font-semibold text-slate-800">Google Maps API key not set</h2>
        <p className="text-sm text-slate-500">
          Add <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">VITE_GOOGLE_MAPS_API_KEY</code> to your{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.env.local</code> file and restart the dev server.
        </p>
      </div>
    )
  }

  return (
    <div className="-mx-4 -mt-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Search bar overlay */}
      <div className="absolute inset-x-0 top-0 z-10 mx-4 mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            ref={searchInputRef}
            placeholder="Search garages or areas…"
            className="h-10 rounded-full border-white/80 bg-white/90 pl-9 pr-4 text-sm shadow-md backdrop-blur-sm"
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
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* List view toggle */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full bg-white shadow-md hover:bg-slate-50"
              variant="ghost"
              aria-label="Show garage list"
            >
              <List className="h-5 w-5 text-slate-700" />
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="max-h-[72vh] overflow-y-auto rounded-t-2xl px-4 pb-8">
            <SheetHeader className="mb-3">
              <SheetTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-[#C00000]" />
                {selected ? selected.name : `Garages near you (${filteredGarages.length})`}
              </SheetTitle>
            </SheetHeader>

            {/* Legend */}
            <div className="mb-3 flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#C00000]" /> Garage
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" /> Petrol Station
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" /> Mazda Dealer
              </span>
            </div>

            {selected ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-3 text-xs text-slate-500"
                  onClick={() => setSelected(null)}
                >
                  ← Back to all garages
                </Button>
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
              <div className="flex flex-col gap-3">
                {filteredGarages.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">No garages found.</p>
                )}
                {filteredGarages.map((g) => (
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
                ))}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Map container */}
      <div ref={mapElRef} className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-100">
            <Loader2 className="h-8 w-8 animate-spin text-[#C00000]" />
            <p className="text-sm text-slate-500">Loading map…</p>
          </div>
        )}
      </div>

      {/* Floating list button */}
      {!loading && garages.length > 0 && (
        <div className="absolute bottom-24 right-4 z-10">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                className="h-12 rounded-full bg-[#C00000] px-5 text-sm font-medium text-white shadow-lg hover:bg-[#a00000]"
                aria-label={`View ${garages.length} garages`}
              >
                <MapPin className="mr-1.5 h-4 w-4" />
                {garages.length} garages
              </Button>
            </SheetTrigger>
          </Sheet>
        </div>
      )}
    </div>
  )
}
