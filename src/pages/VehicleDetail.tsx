import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { VehicleDetailView } from '@/components/car/VehicleDetailView'
import { useVehicles } from '@/hooks/useVehicles'
import { useServiceLogs } from '@/hooks/useServiceLogs'

export default function VehicleDetailPage() {
  const { id } = useParams()
  const { vehicles, fetchVehicles, loading: vehiclesLoading } = useVehicles()
  const { logs, fetchLogs, loading: logsLoading } = useServiceLogs()
  const navigate = useNavigate()
  const vehicle = useMemo(() => vehicles.find((v) => v.id === id), [id, vehicles])
  const vehicleLogs = useMemo(() => logs.filter((log) => log.vehicleId === id), [id, logs])

  useEffect(() => {
    void fetchVehicles().catch(() => undefined)
  }, [fetchVehicles])

  useEffect(() => {
    if (!id) {
      return
    }

    void fetchLogs(id).catch(() => undefined)
  }, [fetchLogs, id])

  if ((vehiclesLoading || logsLoading) && !vehicle) {
    return <div className="p-8 text-center text-gray-500">Loading vehicle…</div>
  }

  if (!vehicle) {
    return <div className="p-8 text-center text-gray-500">Vehicle not found.</div>
  }

  return (
    <VehicleDetailView
      vehicle={vehicle}
      logs={vehicleLogs}
      onBack={() => navigate(-1)}
    />
  )
}
