import { useState } from 'react'
import { MapPin, Phone, Star, Navigation } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'
import { toast } from 'sonner'
import type { GarageResult } from '@/lib/maps'

interface GarageCardProps {
  garage: GarageResult
  distanceKm?: number
  onLogThisGarage?: (garage: GarageResult) => void
}

const TYPE_LABELS: Record<GarageResult['type'], string> = {
  garage: 'Garage',
  petrol_station: 'Petrol Station',
  dealer: 'Mazda Dealer',
}

const TYPE_COLORS: Record<GarageResult['type'], string> = {
  garage: 'bg-red-100 text-red-700',
  petrol_station: 'bg-blue-100 text-blue-700',
  dealer: 'bg-yellow-100 text-yellow-800',
}

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          className="p-0 leading-none"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              n <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function GarageCard({ garage, distanceKm, onLogThisGarage }: GarageCardProps) {
  const user = useAppStore((s) => s.user)
  const [userRating, setUserRating] = useState(0)
  const [saving, setSaving] = useState(false)

  const googleRating = garage.rating

  function openDirections() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${garage.lat},${garage.lng}&destination_place_id=${garage.placeId}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function saveRating(stars: number) {
    if (!user) {
      toast.error('Sign in to rate garages')
      return
    }
    setUserRating(stars)
    setSaving(true)
    try {
      // Upsert garage record, then update avg rating
      const { data: existing, error: fetchErr } = await supabase
        .from('garages')
        .select('id, avg_rating, total_reviews')
        .eq('google_place_id', garage.placeId)
        .maybeSingle()

      if (fetchErr) throw fetchErr

      if (existing) {
        const newTotal = (existing.total_reviews ?? 0) + 1
        const newAvg =
          ((existing.avg_rating ?? 0) * (existing.total_reviews ?? 0) + stars) / newTotal
        await supabase
          .from('garages')
          .update({ avg_rating: newAvg, total_reviews: newTotal })
          .eq('id', existing.id)
      } else {
        await supabase.from('garages').insert({
          google_place_id: garage.placeId,
          name: garage.name,
          type: garage.type === 'dealer' ? 'dealer' : garage.type,
          address: garage.address,
          lat: garage.lat,
          lng: garage.lng,
          avg_rating: stars,
          total_reviews: 1,
        })
      }
      toast.success('Rating saved!')
    } catch {
      toast.error('Failed to save rating')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur">
      {/* Header */}
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight text-slate-900">{garage.name}</h3>
        <Badge className={`shrink-0 text-xs ${TYPE_COLORS[garage.type]}`}>
          {TYPE_LABELS[garage.type]}
        </Badge>
      </div>

      {/* Address */}
      <p className="mb-2 flex items-start gap-1 text-xs text-slate-500">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {garage.address}
      </p>

      {/* Meta row */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        {googleRating !== undefined && (
          <span className="flex items-center gap-0.5">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span>{googleRating.toFixed(1)}</span>
            {garage.userRatingsTotal !== undefined && (
              <span className="text-slate-400">({garage.userRatingsTotal})</span>
            )}
          </span>
        )}
        {distanceKm !== undefined && (
          <span className="flex items-center gap-0.5">
            <Navigation className="h-3.5 w-3.5" />
            {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
          </span>
        )}
        {garage.phone && (
          <a
            href={`tel:${garage.phone}`}
            className="flex items-center gap-0.5 text-blue-600 underline-offset-2 hover:underline"
          >
            <Phone className="h-3.5 w-3.5" />
            {garage.phone}
          </a>
        )}
      </div>

      {/* Rate this garage */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-medium text-slate-700">Rate this garage</p>
        <StarPicker value={userRating} onChange={saveRating} />
        {saving && <p className="mt-1 text-xs text-slate-400">Saving…</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="min-h-10 flex-1 gap-1 text-xs"
          onClick={openDirections}
        >
          <Navigation className="h-3.5 w-3.5" />
          Get Directions
        </Button>
        {onLogThisGarage && (
          <Button
            size="sm"
            className="min-h-10 flex-1 gap-1 bg-[#C00000] text-xs text-white hover:bg-[#a00000]"
            onClick={() => onLogThisGarage(garage)}
          >
            Add to Log
          </Button>
        )}
      </div>
    </div>
  )
}
