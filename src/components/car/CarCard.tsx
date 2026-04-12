import { Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { haptics } from '@/lib/haptics'
import {
  resolveVehicleServiceSnapshot,
  type VehicleServiceSnapshot,
} from '@/lib/serviceState'
import type { Vehicle } from '@/types'

interface CarCardProps {
  vehicle: Vehicle
  serviceSnapshot?: VehicleServiceSnapshot
  onEditMileage?: (vehicle: Vehicle) => void
  disableNavigation?: boolean
}

export function CarCard({
  vehicle,
  serviceSnapshot,
  onEditMileage,
  disableNavigation = false,
}: CarCardProps) {
  const navigate = useNavigate()
  const snapshot = serviceSnapshot ?? resolveVehicleServiceSnapshot(vehicle)
  const nextServiceLabel = snapshot.dueMileage != null
    ? `${snapshot.dueMileage.toLocaleString()} km`
    : snapshot.dueDate
      ? snapshot.dueDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Awaiting first log'
  const statusTone = snapshot.status === 'overdue'
    ? '#8F1326'
    : snapshot.status === 'due-soon'
      ? '#B88A37'
      : snapshot.status === 'healthy'
        ? '#2C6A4A'
        : '#7B7073'
  const statusLabel = snapshot.status === 'overdue'
    ? 'Service overdue'
    : snapshot.status === 'due-soon'
      ? snapshot.kmRemaining != null
        ? `${Math.max(snapshot.kmRemaining, 0).toLocaleString()} km remaining`
        : 'Service due soon'
      : snapshot.status === 'healthy'
        ? snapshot.kmRemaining != null
          ? `${snapshot.kmRemaining.toLocaleString()} km remaining`
          : 'Service on track'
        : 'No service history yet'

  return (
    <article
      className={`bg-card border rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow ${disableNavigation ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={() => {
        if (disableNavigation) {
          return
        }

        haptics.tap()
        navigate(`/vehicles/${vehicle.id}`)
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Icon and Model Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-[#F5E8EA] rounded-full flex items-center justify-center">
            {/* Replace with your Car icon */}
            <svg viewBox="0 0 24 24" fill="none" className="text-[#A31526] w-6 h-6 lg:w-8 lg:h-8"><circle cx="12" cy="12" r="10" stroke="#A31526" strokeWidth="2" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-lg lg:text-xl">Mazda {vehicle.model}</h3>
            <p className="text-xs lg:text-sm text-muted-foreground uppercase">{vehicle.registration}</p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: statusTone }}>
              {statusLabel}
            </p>
          </div>
        </div>

        {/* Desktop-only metadata grid */}
        <div className="grid grid-cols-2 lg:flex gap-4 lg:gap-8 border-t lg:border-t-0 pt-4 lg:pt-0">
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Current Mileage</p>
            <p className="font-mono font-semibold">{vehicle.currentMileage.toLocaleString()} km</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Next Service</p>
            <p className="font-mono font-semibold" style={{ color: statusTone }}>{nextServiceLabel}</p>
          </div>
        </div>

        {/* Update mileage button */}
        <div className="flex items-center gap-2 mt-4 lg:mt-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              onEditMileage?.(vehicle)
            }}
          >
            <Pencil className="h-4 w-4" />
            Update mileage
          </Button>
        </div>
      </div>
    </article>
  )
}
