import { differenceInDays } from 'date-fns'
import { useCallback, useState } from 'react'
import { calculateServiceDueDate, getNextServiceMileage } from '@/lib/serviceState'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'
import type { ServiceAlert, Vehicle, ServiceLog } from '@/types'

interface AlertRow {
  id: string
  vehicle_id: string
  user_id: string
  alert_type: 'mileage' | 'date' | 'both'
  due_mileage: number | null
  due_date: string | null
  service_type: string
  is_dismissed: boolean
  created_at: string
}

function toAlert(row: AlertRow): ServiceAlert {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    alertType: row.alert_type,
    dueMileage: row.due_mileage ?? undefined,
    dueDate: row.due_date ?? undefined,
    serviceType: row.service_type,
    isDismissed: row.is_dismissed,
  }
}

export interface NextServiceInfo {
  dueMileage: number
  dueDate: Date
  kmRemaining: number
  daysRemaining: number
  /** 0–1 fraction of interval already consumed */
  fractionUsed: number
}

export function calculateNextService(
  vehicle: Vehicle,
  lastLog: ServiceLog,
): NextServiceInfo {
  const dueMileage = getNextServiceMileage(vehicle, lastLog)
  const dueDate = calculateServiceDueDate(lastLog)
  const kmRemaining = dueMileage - vehicle.currentMileage
  const daysRemaining = differenceInDays(dueDate, new Date())
  const intervalDistance = Math.max(dueMileage - lastLog.mileageAtService, 1)
  const fractionUsed = Math.min(
    1,
    Math.max(0, (vehicle.currentMileage - lastLog.mileageAtService) / intervalDistance),
  )

  return { dueMileage, dueDate, kmRemaining, daysRemaining, fractionUsed }
}

export function useAlerts() {
  const user = useAppStore((s) => s.user)
  const [alerts, setAlerts] = useState<ServiceAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolveUserId = useCallback(async () => {
    if (user?.id) return user.id
    const { data, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!data.user?.id) throw new Error('Not authenticated')
    return data.user.id
  }, [user?.id])

  const fetchAlerts = useCallback(
    async (userId?: string) => {
      setLoading(true)
      setError(null)
      try {
        const uid = userId ?? (await resolveUserId())
        const { data, error: fetchError } = await supabase
          .from('service_alerts')
          .select('*')
          .eq('user_id', uid)
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        const mapped = ((data ?? []) as AlertRow[]).map(toAlert)
        setAlerts(mapped)
        return mapped
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to load alerts.'
        setError(msg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [resolveUserId],
  )

  const dismissAlert = useCallback(async (id: string) => {
    const { error: updateError } = await supabase
      .from('service_alerts')
      .update({ is_dismissed: true })
      .eq('id', id)

    if (updateError) throw updateError
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return { alerts, loading, error, fetchAlerts, dismissAlert }
}
