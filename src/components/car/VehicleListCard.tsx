import { ChevronRight } from 'lucide-react'
import { haptics } from '@/lib/haptics'
import { resolveVehicleServiceSnapshot, type VehicleServiceSnapshot } from '@/lib/serviceState'
import { getVehicleImage } from '@/lib/vehicleDisplay'
import type { Vehicle } from '@/types'

interface VehicleListCardProps {
  vehicle: Vehicle
  serviceSnapshot?: VehicleServiceSnapshot
  isSelected?: boolean
  onOpen: (vehicle: Vehicle) => void
}

export function VehicleListCard({
  vehicle,
  serviceSnapshot,
  isSelected = false,
  onOpen,
}: VehicleListCardProps) {
  const snapshot = serviceSnapshot ?? resolveVehicleServiceSnapshot(vehicle)
  const progressColor = snapshot.status === 'overdue'
    ? '#9B1B30'
    : snapshot.status === 'due-soon'
      ? '#B88A37'
      : snapshot.status === 'healthy'
        ? '#2C6A4A'
        : '#7A7073'

  let statusLabel = 'No service logged yet'
  let statusMeta = 'Log your first service to unlock exact next-service tracking.'

  if (snapshot.status === 'overdue') {
    statusLabel = 'Service overdue'
    statusMeta = snapshot.dueMileage != null
      ? `Target was ${snapshot.dueMileage.toLocaleString()} km`
      : snapshot.dueDate
        ? `Due by ${snapshot.dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
        : 'Reminder active'
  } else if (snapshot.status === 'due-soon') {
    statusLabel = 'Service due soon'
    statusMeta = snapshot.kmRemaining != null
      ? `${Math.max(snapshot.kmRemaining, 0).toLocaleString()} km remaining`
      : snapshot.dueDate
        ? `Due by ${snapshot.dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
        : 'Reminder active'
  } else if (snapshot.status === 'healthy') {
    statusLabel = snapshot.kmRemaining != null
      ? `${snapshot.kmRemaining.toLocaleString()} km until next service`
      : 'Service plan on track'
    statusMeta = snapshot.dueMileage != null
      ? `Next at ${snapshot.dueMileage.toLocaleString()} km`
      : snapshot.dueDate
        ? `Due by ${snapshot.dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
        : 'Latest service recorded'
  }

  return (
    <button
      type="button"
      onClick={() => {
        haptics.tap()
        onOpen(vehicle)
      }}
      className={`block w-full overflow-hidden rounded-[26px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,247,247,0.96))] text-left shadow-[0_14px_28px_rgba(15,10,11,0.05)] transition duration-200 active:scale-[0.995] ${isSelected ? 'border-[#D9B8C0] shadow-[0_18px_34px_rgba(143,19,38,0.12)]' : 'border-black/5 hover:border-[#E5D5D9]'}`}
    >
      <div className="flex items-center gap-3 px-4 pt-4">
        <div className="flex h-[58px] w-24 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,#F8F1F2_0%,#F2E8EA_100%)]">
          <img
            src={getVehicleImage(vehicle.model)}
            alt={`Mazda ${vehicle.model}`}
            className="h-full w-full object-contain px-1"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold tracking-[-0.02em] text-[#0F0A0B]">
            Mazda {vehicle.model}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-[#6D6165]">
            {vehicle.year} · {vehicle.fuelType} · {vehicle.engineSize}
          </p>
          <span className="mt-2 inline-flex rounded-full border border-[#D9CDD0] bg-[#F7F1F2] px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#3D3035]">
            {vehicle.registration}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 self-stretch pt-1">
          {snapshot.status === 'healthy' ? (
            <span className="h-2.5 w-2.5 rounded-full bg-[#D3E7DB]" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: progressColor }} />
          )}
          <ChevronRight className="h-4 w-4 text-[#C9C0C1]" />
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="text-[12px] font-semibold text-[#211A1D]">{statusLabel}</p>
          <p className="text-[10px] text-[#7A6E70]">{vehicle.currentMileage.toLocaleString()} km</p>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#F1E9EA]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${snapshot.progressPercent}%`, backgroundColor: progressColor }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[10px] text-[#7A6E70]">
            {snapshot.dueMileage != null ? `Next at ${snapshot.dueMileage.toLocaleString()} km` : 'Awaiting first precise schedule'}
          </span>
          <span className="text-right text-[10px] font-medium" style={{ color: progressColor }}>
            {statusMeta}
          </span>
        </div>
      </div>
    </button>
  )
}