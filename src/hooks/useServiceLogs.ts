import { useCallback, useState } from 'react'
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

        const { error: alertError } = await supabase.from('service_alerts').insert({
          vehicle_id: payload.vehicleId,
          user_id: userId,
          alert_type: 'mileage',
          due_mileage: payload.nextServiceMileage,
          due_date: dueDate.toISOString().slice(0, 10),
          service_type: payload.serviceType,
          is_dismissed: false,
        })

        if (alertError) {
          throw alertError
        }

        setLogs((current) => [created, ...current])
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

      try {
        const userId = await resolveUserId()
        const { error: deleteError } = await supabase.from('service_logs').delete().eq('id', id).eq('user_id', userId)

        if (deleteError) {
          throw deleteError
        }

        setLogs((current) => current.filter((log) => log.id !== id))
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
    loading,
    error,
    fetchLogs,
    addLog,
    deleteLog,
  }
}
