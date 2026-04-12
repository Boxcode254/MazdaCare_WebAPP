import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { VehicleListCard } from '@/components/car/VehicleListCard'
import { useAlerts } from '@/hooks/useAlerts'
import { useServiceLogs } from '@/hooks/useServiceLogs'
import { useVehicles } from '@/hooks/useVehicles'
import { resolveVehicleServiceSnapshot } from '@/lib/serviceState'

export default function VehiclesPage() {
  const { vehicles, fetchVehicles } = useVehicles()
  const { alerts, fetchAlerts } = useAlerts()
  const { latestLogsByVehicle, fetchLatestLogs } = useServiceLogs()
  const navigate = useNavigate()
  const alertByVehicleId = useMemo(
    () => new Map(alerts.map((alert) => [alert.vehicleId, alert])),
    [alerts],
  )
  const serviceSnapshots = useMemo(
    () => Object.fromEntries(
      vehicles.map((vehicle) => [
        vehicle.id,
        resolveVehicleServiceSnapshot(vehicle, latestLogsByVehicle[vehicle.id], alertByVehicleId.get(vehicle.id)),
      ]),
    ),
    [alertByVehicleId, latestLogsByVehicle, vehicles],
  )

  useEffect(() => {
    void fetchVehicles().catch(() => undefined)
  }, [fetchVehicles])

  useEffect(() => {
    void fetchAlerts().catch(() => undefined)
  }, [fetchAlerts])

  useEffect(() => {
    void fetchLatestLogs(vehicles.map((vehicle) => vehicle.id)).catch(() => undefined)
  }, [fetchLatestLogs, vehicles])

  return (
    <div className="min-h-screen bg-[#F5F1F1] pb-24">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-[#FDFAFA] px-4 py-3">
        <h1 className="text-center text-[26px] text-gray-900" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          My Vehicles
        </h1>
      </header>
      <div className="space-y-2.5 px-3 py-3">
        {vehicles.length === 0 ? (
          <div className="rounded-2xl bg-white/80 p-8 text-center shadow">
            <p className="text-gray-500">No vehicles yet. Add your first car!</p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <VehicleListCard
              key={vehicle.id}
              vehicle={vehicle}
              serviceSnapshot={serviceSnapshots[vehicle.id]}
              onOpen={(selectedVehicle) => navigate(`/vehicles/${selectedVehicle.id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}
