import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, X } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import { useAppStore } from '@/stores/appStore'
import { calculateNextService } from '@/hooks/useAlerts'
import { haptics } from '@/lib/haptics'
import type { Vehicle } from '@/types'

interface AlertBannerProps {
  /** The active vehicle to check alerts for */
  vehicle: Vehicle | undefined
  /** Optional explicit dismiss affordance */
  dismissible?: boolean
}

export function AlertBanner({ vehicle, dismissible = false }: AlertBannerProps) {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const { alerts, fetchAlerts, dismissAlert } = useAlerts()

  useEffect(() => {
    if (user?.id) {
      void fetchAlerts(user.id)
    }
  }, [user?.id, fetchAlerts])

  if (!vehicle || alerts.length === 0) return null

  // Find the most urgent alert for this vehicle
  const vehicleAlerts = alerts.filter((a) => a.vehicleId === vehicle.id)
  if (vehicleAlerts.length === 0) return null

  const alert = vehicleAlerts[0]

  // Only show if within 500 km or 14 days
  const kmRemaining =
    alert.dueMileage != null ? alert.dueMileage - vehicle.currentMileage : Infinity
  const daysRemaining =
    alert.dueDate != null
      ? Math.ceil(
          (new Date(alert.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )
      : Infinity

  const shouldShow = kmRemaining < 1500 || daysRemaining <= 14
  if (!shouldShow) return null

  const isOverdue = kmRemaining < 0 || daysRemaining <= 0
  const line1 = isOverdue
    ? 'Service overdue'
    : isFinite(kmRemaining)
      ? `Service due in ${Math.max(kmRemaining, 0).toLocaleString()} km`
      : 'Service due in 0 km'

  const stripBgClass = isOverdue
    ? 'bg-mz-red-dark'
    : kmRemaining < 500 || daysRemaining <= 14
      ? 'bg-mz-red'
      : 'bg-[#7A5C14]'

  return (
    <div
      className={`relative -mx-4 flex items-center justify-between px-4 py-[10px] text-white ${stripBgClass}`}
    >
      <div className="flex items-center gap-[10px]">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
          <AlertCircle className="h-[14px] w-[14px] text-white" />
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif' }}>
          <p className="text-xs font-medium text-white">{line1}</p>
          <p className="text-[10px] text-white/60">{vehicle.registration}</p>
        </div>
      </div>

      <button
        type="button"
        className="rounded-[20px] bg-white/20 px-[10px] py-[2px] text-[10px] font-bold tracking-[0.05em] text-white"
        style={{ fontFamily: 'Outfit, sans-serif' }}
        onClick={() => navigate(`/schedule/${vehicle.id}`)}
      >
        SCHEDULE →
      </button>

      {dismissible ? (
        <button
          type="button"
          aria-label="Dismiss alert"
          className="absolute right-[10px] top-1/2 -translate-y-1/2 text-white/40"
          onClick={() => {
            haptics.light()
            void dismissAlert(alert.id)
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

// Re-export calculateNextService so consumers can import from one place
export { calculateNextService }
