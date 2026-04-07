import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { haptics } from '@/lib/haptics'
import type { Vehicle } from '@/types'

interface CarCardProps {
  vehicle: Vehicle
  onEditMileage?: (vehicle: Vehicle) => void
}

function maskVin(vin: string): string {
  if (vin.length <= 7) {
    return vin
  }

  return `${vin.slice(0, 3)}...${vin.slice(-4)}`
}

export function CarCard({ vehicle, onEditMileage }: CarCardProps) {
  const navigate = useNavigate()
  const nextServiceMileage = vehicle.nextServiceMileage ?? vehicle.currentMileage + vehicle.mileageInterval
  const intervalUsed = Math.min((vehicle.currentMileage / nextServiceMileage) * 100, 100)
  const kmLeft = Math.max(nextServiceMileage - vehicle.currentMileage, 0)
  const progressColor =
    intervalUsed < 60 ? '#2E7D4F' : intervalUsed <= 90 ? '#C49A3C' : '#9B1B30'
  const fuelBadgeClass = vehicle.fuelType === 'diesel' ? 'bg-[#1A3A6B]' : 'bg-mz-red'
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [showFullVin, setShowFullVin] = useState(false)

  useEffect(() => {
    setAnimatedProgress(0)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnimatedProgress(intervalUsed)
      return
    }

    const timer = window.setTimeout(() => {
      setAnimatedProgress(intervalUsed)
    }, 100)

    return () => window.clearTimeout(timer)
  }, [intervalUsed, vehicle.id])

  return (
    <article
      className="brand-panel brand-outline cursor-pointer overflow-hidden rounded-[22px]"
      onClick={() => {
        haptics.tap()
        navigate(`/service/${vehicle.id}`)
      }}
    >
      <div className="brand-panel-strong relative min-h-[104px] overflow-hidden px-[16px] pb-[22px] pt-[16px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]" />
        <h3
          className="relative z-10 text-white"
          style={{
            fontSize: '26px',
            fontWeight: 520,
            letterSpacing: '-0.03em',
          }}
        >
          Mazda {vehicle.model}
        </h3>
        <p className="relative z-10 mt-[3px] text-xs text-white/65" style={{ letterSpacing: '0.03em' }}>
          {vehicle.year} • {vehicle.engineSize}
        </p>

        <span
          className="absolute right-[14px] top-[14px] z-10 rounded-full border border-white/15 bg-white/12 px-[10px] py-[4px] text-[11px] font-semibold text-white backdrop-blur-md"
          style={{ letterSpacing: '0.05em' }}
        >
          {vehicle.registration}
        </span>

        <span
          className={`absolute bottom-[14px] right-[14px] z-10 rounded-full px-[10px] py-[4px] text-[10px] font-semibold uppercase text-white shadow-sm ${fuelBadgeClass}`}
          style={{ letterSpacing: '0.06em' }}
        >
          {vehicle.fuelType}
        </span>
      </div>

      <div className="space-y-3 bg-transparent px-[16px] py-[14px]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[20px] font-semibold text-mz-black">
            {vehicle.currentMileage.toLocaleString()} km
          </p>
          <p className="text-right text-[11px] text-mz-gray-500">
            Next service: {nextServiceMileage.toLocaleString()} km
          </p>
        </div>

        <div className="space-y-1.5 rounded-[16px] border border-[rgba(153,23,40,0.08)] bg-[rgba(255,255,255,0.66)] px-3.5 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium uppercase tracking-[0.04em] text-mz-gray-500">Registration</span>
            <span className="font-semibold text-mz-black">{vehicle.registration}</span>
          </div>
          {vehicle.vin ? (
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium uppercase tracking-[0.04em] text-mz-gray-500">VIN</span>
              <button
                type="button"
                className="font-semibold text-mz-black underline-offset-2 hover:underline"
                onClick={(event) => {
                  event.stopPropagation()
                  setShowFullVin((current) => !current)
                }}
              >
                {showFullVin ? `VIN: ${vehicle.vin}` : `VIN: ${maskVin(vehicle.vin)}`}
              </button>
            </div>
          ) : null}
        </div>

        <div className="h-[5px] overflow-hidden rounded-[4px] bg-mz-gray-100">
          <div
            className="carcard-progress-fill h-full rounded-[4px]"
            style={{ width: `${animatedProgress}%`, backgroundColor: progressColor }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px]" style={{ color: '#8F666D' }}>
          <span>{Math.round(intervalUsed)}% of interval used</span>
          <span style={{ color: progressColor, fontWeight: 600 }}>{kmLeft.toLocaleString()} km left</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-10"
          onClick={(event) => {
            event.stopPropagation()
            onEditMileage?.(vehicle)
          }}
        >
          <Pencil className="h-4 w-4" />
          Update mileage
        </Button>
      </div>
    </article>
  )
}
