import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'
import type { MazdaModel } from '@/lib/mazda-models'
import type { Vehicle } from '@/types'

interface VehiclePayload {
  model: MazdaModel
  year: number
  fuelType: 'petrol' | 'diesel'
  engineSize: string
  registration: string
  currentMileage: number
  mileageInterval: 5000 | 10000
  color?: string
}

interface VehicleRow {
  id: string
  user_id: string
  make: string
  model: string
  year: number
  fuel_type: 'petrol' | 'diesel'
  engine_size: string
  registration: string
  current_mileage: number
  mileage_interval: 5000 | 10000
  color: string | null
  created_at: string
}

function toVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    userId: row.user_id,
    make: row.make,
    model: row.model,
    year: row.year,
    fuelType: row.fuel_type,
    engineSize: row.engine_size,
    registration: row.registration,
    currentMileage: row.current_mileage,
    mileageInterval: row.mileage_interval,
    color: row.color ?? undefined,
    nextServiceMileage: row.current_mileage + row.mileage_interval,
  }
}

export function useVehicles() {
  const user = useAppStore((state) => state.user)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
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
      throw new Error('You must be logged in to manage vehicles.')
    }

    return data.user.id
  }, [user?.id])

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const userId = await resolveUserId()
      const { data, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      const mapped = ((data ?? []) as VehicleRow[]).map(toVehicle)
      setVehicles(mapped)
      return mapped
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch vehicles.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [resolveUserId])

  const addVehicle = useCallback(
    async (payload: VehiclePayload) => {
      setLoading(true)
      setError(null)

      try {
        const userId = await resolveUserId()
        const { data, error: insertError } = await supabase
          .from('vehicles')
          .insert({
            user_id: userId,
            make: 'Mazda',
            model: payload.model,
            year: payload.year,
            fuel_type: payload.fuelType,
            engine_size: payload.engineSize,
            registration: payload.registration,
            current_mileage: payload.currentMileage,
            mileage_interval: payload.mileageInterval,
            color: payload.color ?? null,
          })
          .select('*')
          .single()

        if (insertError) {
          throw insertError
        }

        const created = toVehicle(data as VehicleRow)
        setVehicles((current) => [created, ...current])
        return created
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to add vehicle.'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [resolveUserId]
  )

  const updateVehicle = useCallback(
    async (id: string, data: Partial<Pick<VehiclePayload, 'currentMileage' | 'mileageInterval' | 'color'>>) => {
      setLoading(true)
      setError(null)

      try {
        const userId = await resolveUserId()
        const { data: updatedRow, error: updateError } = await supabase
          .from('vehicles')
          .update({
            current_mileage: data.currentMileage,
            mileage_interval: data.mileageInterval,
            color: data.color,
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select('*')
          .single()

        if (updateError) {
          throw updateError
        }

        const updated = toVehicle(updatedRow as VehicleRow)
        setVehicles((current) => current.map((vehicle) => (vehicle.id === id ? updated : vehicle)))
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to update vehicle.'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [resolveUserId]
  )

  const deleteVehicle = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)

      try {
        const userId = await resolveUserId()
        const { error: deleteError } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)

        if (deleteError) {
          throw deleteError
        }

        setVehicles((current) => current.filter((vehicle) => vehicle.id !== id))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to delete vehicle.'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [resolveUserId]
  )

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  }
}
