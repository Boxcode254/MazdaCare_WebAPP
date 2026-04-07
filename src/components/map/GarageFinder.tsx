import { AlertCircle, MapPin } from 'lucide-react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
}

const defaultCenter = {
  lat: -1.2921,
  lng: 36.8219,
}

const mapOptions: google.maps.MapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  zoomControl: true,
  zoomControlOptions: {
    position: google.maps.ControlPosition.TOP_RIGHT,
  },
}

export function GarageFinder() {
  // Keep your Google Maps key out of source files:
  // add VITE_GOOGLE_MAPS_API_KEY=your_key_here in mazda-app/.env.local
  // and read it with import.meta.env.VITE_GOOGLE_MAPS_API_KEY (never hardcode keys in TSX).
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  const { isLoaded } = useJsApiLoader({
    id: 'mazdacare-google-map',
    googleMapsApiKey: apiKey ?? '',
  })

  if (!apiKey) {
    return (
      <section className="flex h-screen w-full items-center justify-center bg-gray-50/50 p-6 text-center">
        <div className="max-w-sm rounded-2xl border border-orange-100 bg-orange-50 p-5">
          <p className="text-sm font-semibold text-orange-900">Google Maps API key missing</p>
          <p className="mt-2 text-sm text-orange-800">
            Set VITE_GOOGLE_MAPS_API_KEY in your .env.local and restart the dev server.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-gray-50/50">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={13}
          options={mapOptions}
        />
      ) : (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50/50 text-sm text-gray-500">
          Loading map...
        </div>
      )}

      <div className="absolute bottom-20 z-20 w-full p-4">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">Featured Dealership</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">Mazda Downtown Service Center</h2>
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#A31526]">
                <MapPin className="h-4 w-4" />
                <span>2.4 miles away</span>
              </div>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>

          <button
            type="button"
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#A31526] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#A31526]/25"
          >
            Directions
          </button>
        </div>
      </div>
    </section>
  )
}
