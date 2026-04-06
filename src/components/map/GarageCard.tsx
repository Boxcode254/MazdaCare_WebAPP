import { Fuel, Star, Wrench } from 'lucide-react'
import type { GarageResult } from '@/lib/maps'

interface GarageCardProps {
  garage: GarageResult
  distanceKm?: number
  onLogThisGarage?: (garage: GarageResult) => void
}

const TYPE_ICON_STYLES: Record<GarageResult['type'], { wrap: string; icon: string }> = {
  garage: { wrap: 'bg-mz-red-light', icon: 'text-mz-red' },
  dealer: { wrap: 'bg-mz-black', icon: 'text-white' },
  petrol_station: { wrap: 'bg-[#EDF2FF]', icon: 'text-[#1A3A9B]' },
}

export function GarageCard({ garage, distanceKm, onLogThisGarage }: GarageCardProps) {
  const googleRating = garage.rating
  const iconStyle = TYPE_ICON_STYLES[garage.type]

  function openDirections() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${garage.lat},${garage.lng}&destination_place_id=${garage.placeId}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const distanceLabel =
    distanceKm !== undefined
      ? distanceKm < 1
        ? `${Math.round(distanceKm * 1000)} m`
        : `${distanceKm.toFixed(1)} km`
      : '--'

  return (
    <article className="flex items-start gap-3 border-b border-b-[0.5px] border-b-mz-gray-100 bg-white px-[14px] py-3 last:border-b-0">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconStyle.wrap}`}>
        {garage.type === 'garage' ? <Wrench className={`h-4 w-4 ${iconStyle.icon}`} /> : null}
        {garage.type === 'dealer' ? <Star className={`h-4 w-4 ${iconStyle.icon}`} /> : null}
        {garage.type === 'petrol_station' ? <Fuel className={`h-4 w-4 ${iconStyle.icon}`} /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-[13px] font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {garage.name}
        </h3>
        <p className="mt-px truncate text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {garage.address}
        </p>

        <div className="mt-1 flex items-center gap-1">
          <Star className="h-[11px] w-[11px] fill-current text-mz-gold" />
          <span className="text-[11px] text-mz-gold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {googleRating?.toFixed(1) ?? '-'}
          </span>
          <span className="text-[10px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
            ({garage.userRatingsTotal ?? 0})
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <p className="text-[12px] font-semibold text-mz-gray-700">{distanceLabel}</p>
        <button
          type="button"
          className="mt-1 text-[11px] font-medium text-mz-red"
          onClick={openDirections}
        >
          Directions →
        </button>
        {onLogThisGarage && (
          <button
            type="button"
            className="mt-1 block rounded-md bg-mz-red-light px-2 py-[3px] text-[10px] font-semibold text-mz-red"
            onClick={() => onLogThisGarage(garage)}
          >
            Use for log
          </button>
        )}
      </div>
    </article>
  )
}
