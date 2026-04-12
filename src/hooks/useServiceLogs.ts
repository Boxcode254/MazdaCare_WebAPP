import { useCallback, useState } from 'react'
import { buildLatestServiceLogMap } from '@/lib/serviceState'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'
import type { ServiceLog } from '@/types'

export type ServiceType = ServiceLog['serviceType']

export interface AddServiceLogPayload {
  vehicleId: string
  serviceDate: string
  serviceType: ServiceType
  mileageAtService: number
  nextServiceMileage: number
  oilBrand?: string
  oilGrade?: string
  oilQuantityLitres?: number
  garageName?: string
  serviceCost?: number
  notes?: string
  rating?: number
}

interface ServiceLogRow {
  id: string
  vehicle_id: string
  service_date: string
  service_type: ServiceType
  mileage_at_service: number
  next_service_mileage: number
  oil_brand: string | null
  oil_grade: string | null
  oil_quantity_litres: number | null
  garage_id: string | null
  garage_name: string | null
  service_cost: number | null
  notes: string | null
  rating: number | null
  created_at: string
}

const REMINDER_THRESHOLD_OPTIONS = [250, 500, 1000, 2000] as const
const DEFAULT_REMINDER_THRESHOLD = 500

function readReminderThreshold(): number {
  if (typeof window === 'undefined') {
    return DEFAULT_REMINDER_THRESHOLD
  }

  const rawValue = Number(window.localStorage.getItem('mc_reminder_km_threshold'))
  return REMINDER_THRESHOLD_OPTIONS.includes(rawValue as (typeof REMINDER_THRESHOLD_OPTIONS)[number])
    ? rawValue
    : DEFAULT_REMINDER_THRESHOLD
}

function toServiceLog(row: ServiceLogRow): ServiceLog {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    serviceDate: row.service_date,
    serviceType: row.service_type,
    mileageAtService: row.mileage_at_service,
    nextServiceMileage: row.next_service_mileage,
    oilBrand: row.oil_brand ?? undefined,
    oilGrade: row.oil_grade ?? undefined,
    oilQuantityLitres: row.oil_quantity_litres ?? undefined,
    garageId: row.garage_id ?? undefined,
    garageName: row.garage_name ?? undefined,
    serviceCost: row.service_cost ?? undefined,
    notes: row.notes ?? undefined,
    rating: row.rating ?? undefined,
  }
}

export function useServiceLogs() {
  const user = useAppStore((state) => state.user)
  const [logs, setLogs] = useState<ServiceLog[]>([])
  const [latestLogsByVehicle, setLatestLogsByVehicle] = useState<Record<string, ServiceLog>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolveUserId = useCallback(async () => {
    if (user?.id) {
      return user.id
    }

    const { data, error: authError } = await supabase.auth.getUser()

    if (authError) {
      throw authError
    }

    if (!data.user?.id) {
      throw new Error('You must be logged in to manage service logs.')
    }

    return data.user.id
  }, [user?.id])

  const fetchLogs = useCallback(
    async (vehicleId: string) => {
      setLoading(true)
      setError(null)

      try {
        const userId = await resolveUserId()
        const { data, error: fetchError } = await supabase
          .from('service_logs')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .eq('user_id', userId)
          .order('service_date', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        const mapped = ((data ?? []) as ServiceLogRow[]).map(toServiceLog)
        setLogs(mapped)
        return mapped
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load service logs.'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [resolveUserId]
  )

  const fetchLatestLogs = useCallback(
    async (vehicleIds?: string[]) => {
      if (vehicleIds && vehicleIds.length === 0) {
        setLatestLogsByVehicle({})
        return {}
      }

      setLoading(true)
      setError(null)

      try {
        const userId = await resolveUserId()
        let query = supabase
          .from('service_logs')
          .select('*')
          .eq('user_id', userId)
          .order('service_date', { ascending: false })
          .order('created_at', { ascending: false })

        if (vehicleIds?.length) {
          query = query.in('vehicle_id', vehicleIds)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
          throw fetchError
        }

        const mapped = ((data ?? []) as ServiceLogRow[]).map(toServiceLog)
        const latestMap = buildLatestServiceLogMap(mapped)
        setLatestLogsByVehicle(latestMap)
        return latestMap
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load latest service logs.'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [resolveUserId]
  )

  const addLog = useCallback(
    async (payload: AddServiceLogPayload) => {
      setLoading(true)
      setError(null)

      try {
        const userId = await resolveUserId()
        const { data, error: insertError } = await supabase
          .from('service_logs')
          .insert({
            vehicle_id: payload.vehicleId,
            user_id: userId,
            service_date: payload.serviceDate,
            service_type: payload.serviceType,
            mileage_at_service: payload.mileageAtService,
            next_service_mileage: payload.nextServiceMileage,
            oil_brand: payload.oilBrand ?? null,
            oil_grade: payload.oilGrade ?? null,
            oil_quantity_litres: payload.oilQuantityLitres ?? null,
            garage_name: payload.garageName ?? null,
            service_cost: payload.serviceCost ?? null,
            notes: payload.notes ?? null,
            rating: payload.rating ?? null,
          })
          .select('*')
          .single()

        if (insertError) {
          throw insertError
        }

        const created = toServiceLog(data as ServiceLogRow)

        const { error: vehicleUpdateError } = await supabase
          .from('vehicles')
          .update({
            current_mileage: payload.mileageAtService,
          })
          .eq('id', payload.vehicleId)
          .eq('user_id', userId)

        if (vehicleUpdateError) {
          throw vehicleUpdateError
        }

        const dueDate = new Date(payload.serviceDate)
        dueDate.setMonth(dueDate.getMonth() + (payload.serviceType === 'major' ? 6 : 3))
        const reminderThreshold = readReminderThreshold()
        const dueMileage = Math.max(payload.nextServiceMileage - reminderThreshold, 0)

        const { error: alertError } = await supabase.from('service_alerts').insert({
          vehicle_id: payload.vehicleId,
          user_id: userId,
          alert_type: 'mileage',
          due_mileage: dueMileage,
          due_date: dueDate.toISOString().slice(0, 10),
          service_type: payload.serviceType,
          is_dismissed: false,
        })

        if (alertError) {
          throw alertError
        }

        setLogs((current) => [created, ...current])
        setLatestLogsByVehicle((current) => {
          const existing = current[created.vehicleId]
          if (existing && new Date(existing.serviceDate).getTime() > new Date(created.serviceDate).getTime()) {
            return current
          }

          return {
            ...current,
            [created.vehicleId]: created,
          }
        })
        return created
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to save service log.'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [resolveUserId]
  )

  const deleteLog = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      const deletedLog = logs.find((log) => log.id === id) ?? null

      try {
        const userId = await resolveUserId()
        const { error: deleteError } = await supabase.from('service_logs').delete().eq('id', id).eq('user_id', userId)

        if (deleteError) {
          throw deleteError
        }

        setLogs((current) => current.filter((log) => log.id !== id))
        if (deletedLog) {
          setLatestLogsByVehicle((current) => {
            if (current[deletedLog.vehicleId]?.id !== id) {
              return current
            }

            const nextLatest = logs
              .filter((log) => log.vehicleId === deletedLog.vehicleId && log.id !== id)
              .sort((left, right) => new Date(right.serviceDate).getTime() - new Date(left.serviceDate).getTime())[0]

            if (!nextLatest) {
              const { [deletedLog.vehicleId]: _removed, ...rest } = current
              return rest
            }

            return {
              ...current,
              [deletedLog.vehicleId]: nextLatest,
            }
          })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to delete service log.'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [resolveUserId]
  )

  return {
    logs,
    latestLogsByVehicle,
    loading,
    error,
    fetchLogs,
    fetchLatestLogs,
    addLog,
    deleteLog,
  }
}
