import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { Vehicle } from '@/types'

interface CarCardProps {
  vehicle: Vehicle
  onEditMileage?: (vehicle: Vehicle) => void
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

  useEffect(() => {
    setAnimatedProgress(0)

    const timer = window.setTimeout(() => {
      setAnimatedProgress(intervalUsed)
    }, 100)

    return () => window.clearTimeout(timer)
  }, [intervalUsed, vehicle.id])

  return (
    <article
      className="cursor-pointer overflow-hidden rounded-[16px] border border-[0.5px] border-black/6 bg-mz-white"
      onClick={() => navigate(`/service/${vehicle.id}`)}
    >
      <div className="relative min-h-[90px] bg-mz-black px-[14px] pb-[20px] pt-[14px]">
        <h3
          className="text-white"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '24px',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
          }}
        >
          Mazda {vehicle.model}
        </h3>
        <p className="mt-[2px] text-xs text-white/45" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {vehicle.year} • {vehicle.engineSize}
        </p>

        <span
          className="absolute right-[14px] top-[14px] rounded-[4px] bg-white/10 px-[9px] py-[3px] text-[11px] font-semibold text-white"
          style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.04em' }}
        >
          {vehicle.registration}
        </span>

        <span
          className={`absolute bottom-[14px] right-[14px] rounded-[20px] px-[9px] py-[3px] text-[10px] font-semibold uppercase text-white ${fuelBadgeClass}`}
          style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.04em' }}
        >
          {vehicle.fuelType}
        </span>
      </div>

      <div className="space-y-2 bg-mz-white px-[14px] py-[12px]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[18px] font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {vehicle.currentMileage.toLocaleString()} km
          </p>
          <p className="text-right text-xs text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Next service: {nextServiceMileage.toLocaleString()} km
          </p>
        </div>

        <div className="h-[5px] overflow-hidden rounded-[4px] bg-mz-gray-100">
          <div
            className="h-full rounded-[4px]"
            style={{ width: `${animatedProgress}%`, backgroundColor: progressColor, transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px]" style={{ fontFamily: 'Outfit, sans-serif', color: '#9B6163' }}>
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
