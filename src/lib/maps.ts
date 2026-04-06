import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

export const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 }

let mapsLibLoaded = false
let placesLibLoaded = false

async function ensureMapsLib(): Promise<typeof google.maps> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  if (!mapsLibLoaded) {
    setOptions({ key: apiKey ?? '' })
    await importLibrary('maps')
    mapsLibLoaded = true
  }
  return google.maps
}

async function ensurePlacesLib(): Promise<void> {
  if (!placesLibLoaded) {
    await importLibrary('places')
    placesLibLoaded = false
  }
  placesLibLoaded = true
}

export async function initMap(
  element: HTMLElement,
  center: google.maps.LatLngLiteral = NAIROBI_CENTER,
  zoom = 13,
): Promise<google.maps.Map> {
  await ensureMapsLib()
  const map = new google.maps.Map(element, {
    center,
    zoom,
    disableDefaultUI: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER,
    },
    styles: [
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    ],
  })
  return map
}

export type GarageResult = {
  placeId: string
  name: string
  address: string
  rating?: number
  userRatingsTotal?: number
  type: 'garage' | 'petrol_station' | 'dealer'
  lat: number
  lng: number
  phone?: string
}

const SEARCH_QUERIES = [
  { query: 'Mazda service center Nairobi', type: 'dealer' as const },
  { query: 'Car garage Nairobi', type: 'garage' as const },
  { query: 'Petrol station Nairobi', type: 'petrol_station' as const },
]

export async function searchNearbyGarages(
  map: google.maps.Map,
  location: google.maps.LatLngLiteral,
): Promise<GarageResult[]> {
  await ensurePlacesLib()
  const service = new google.maps.places.PlacesService(map)

  const results: GarageResult[] = []
  const seen = new Set<string>()

  await Promise.all(
    SEARCH_QUERIES.map(
      ({ query, type }) =>
        new Promise<void>((resolve) => {
          service.textSearch(
            { query, location: new google.maps.LatLng(location.lat, location.lng), radius: 10000 },
            (places, status) => {
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                places
              ) {
                for (const p of places) {
                  const pid = p.place_id ?? ''
                  if (!pid || seen.has(pid)) continue
                  seen.add(pid)
                  const loc = p.geometry?.location
                  if (!loc) continue
                  results.push({
                    placeId: pid,
                    name: p.name ?? 'Unknown',
                    address: p.formatted_address ?? p.vicinity ?? '',
                    rating: p.rating,
                    userRatingsTotal: p.user_ratings_total,
                    type,
                    lat: loc.lat(),
                    lng: loc.lng(),
                  })
                }
              }
              resolve()
            },
          )
        }),
    ),
  )

  return results
}

const MARKER_COLORS: Record<GarageResult['type'], string> = {
  dealer: '#111010',
  garage: '#9B1B30',
  petrol_station: '#1A3A6B',
}

const MARKER_SIZES: Record<GarageResult['type'], number> = {
  dealer: 14,
  garage: 12,
  petrol_station: 10,
}

let activeMarker: google.maps.Marker | null = null

function markerSvg(place: GarageResult, selected: boolean): string {
  const base = MARKER_COLORS[place.type]
  const size = MARKER_SIZES[place.type] * (selected ? 1.5 : 1)
  const ring = selected ? '#FFFFFF' : 'none'
  const dealerRing = place.type === 'dealer' ? '#C49A3C' : 'none'
  const dealerStrokeWidth = place.type === 'dealer' ? 2 : 0
  const r = size / 2
  const c = r + (selected ? 2 : 1)
  const canvas = c * 2

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">
      ${selected ? `<circle cx="${c}" cy="${c}" r="${r + 1}" fill="none" stroke="${ring}" stroke-width="2" />` : ''}
      ${place.type === 'dealer' ? `<circle cx="${c}" cy="${c}" r="${r + 1.5}" fill="none" stroke="${dealerRing}" stroke-width="${dealerStrokeWidth}" />` : ''}
      <circle cx="${c}" cy="${c}" r="${r}" fill="${base}" />
    </svg>
  `
}

function markerIcon(place: GarageResult, selected: boolean): google.maps.Icon {
  const svg = markerSvg(place, selected)
  const encoded = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  const px = Math.round(MARKER_SIZES[place.type] * (selected ? 1.5 : 1) + 8)

  return {
    url: encoded,
    scaledSize: new google.maps.Size(px, px),
    anchor: new google.maps.Point(px / 2, px / 2),
  }
}

export function addGarageMarker(
  map: google.maps.Map,
  place: GarageResult,
  onClick: (place: GarageResult) => void,
): google.maps.Marker {
  const marker = new google.maps.Marker({
    position: { lat: place.lat, lng: place.lng },
    map,
    title: place.name,
    icon: markerIcon(place, false),
  })
  marker.addListener('click', () => {
    if (activeMarker && activeMarker !== marker) {
      const previousPlace = (activeMarker as google.maps.Marker & { __garagePlace?: GarageResult }).__garagePlace
      if (previousPlace) {
        activeMarker.setIcon(markerIcon(previousPlace, false))
      }
    }

    marker.setIcon(markerIcon(place, true))
    activeMarker = marker
    onClick(place)
  })

  ;(marker as google.maps.Marker & { __garagePlace?: GarageResult }).__garagePlace = place
  return marker
}

export function getUserLocation(): Promise<google.maps.LatLngLiteral> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 60_000 },
    )
  })
}

export function haversineKm(
  a: google.maps.LatLngLiteral,
  b: google.maps.LatLngLiteral,
): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sin2Lat = Math.sin(dLat / 2) ** 2
  const sin2Lng = Math.sin(dLng / 2) ** 2
  const c =
    2 *
    Math.atan2(
      Math.sqrt(sin2Lat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sin2Lng),
      Math.sqrt(1 - sin2Lat - Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sin2Lng),
    )
  return R * c
}
