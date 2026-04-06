import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import { useAppStore } from '@/stores/appStore'
import { calculateNextService } from '@/hooks/useAlerts'
import type { Vehicle } from '@/types'

interface AlertBannerProps {
  /** The active vehicle to check alerts for */
  vehicle: Vehicle | undefined
}

export function AlertBanner({ vehicle }: AlertBannerProps) {
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

  const shouldShow = kmRemaining <= 500 || daysRemaining <= 14
  if (!shouldShow) return null

  const urgency = kmRemaining <= 0 || daysRemaining <= 0 ? 'overdue' : 'soon'

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
        urgency === 'overdue'
          ? 'bg-red-600 text-white'
          : 'bg-red-50 text-red-800 ring-1 ring-red-200'
      }`}
    >
      <Bell className="mt-0.5 h-4 w-4 shrink-0" />
      <button
        type="button"
        className="flex-1 text-left"
        onClick={() => navigate(`/schedule/${vehicle.id}`)}
      >
        <span className="font-semibold">
          {urgency === 'overdue' ? 'Service overdue!' : 'Service due soon'}
        </span>
        <span className="ml-1">
          {kmRemaining > 0 && isFinite(kmRemaining)
            ? `${kmRemaining.toLocaleString()} km`
            : ''}
          {kmRemaining > 0 && isFinite(kmRemaining) && daysRemaining > 0 && isFinite(daysRemaining)
            ? ' · '
            : ''}
          {daysRemaining > 0 && isFinite(daysRemaining) ? `${daysRemaining}d` : ''}
          {' remaining — tap to view'}
        </span>
      </button>
      <button
        type="button"
        aria-label="Dismiss alert"
        className="ml-auto mt-0.5 shrink-0 opacity-70 hover:opacity-100"
        onClick={() => void dismissAlert(alert.id)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Re-export calculateNextService so consumers can import from one place
export { calculateNextService }
