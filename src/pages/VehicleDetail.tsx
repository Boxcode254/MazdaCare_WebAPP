import { useParams, useNavigate } from 'react-router-dom'
import { useVehicles } from '@/hooks/useVehicles'
import { useServiceLogs } from '@/hooks/useServiceLogs'
import { ChevronLeft } from 'lucide-react'

export default function VehicleDetailPage() {
  const { id } = useParams()
  const { vehicles } = useVehicles()
  const { logs } = useServiceLogs()
  const navigate = useNavigate()
  const vehicle = vehicles.find((v) => v.id === id)
  const vehicleLogs = logs.filter((log) => log.vehicleId === id)

  if (!vehicle) {
    return (
      <div className="p-8 text-center text-gray-500">Vehicle not found.</div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f3fa] to-[#e6e0f7] pb-24">
      <header className="flex items-center px-4 pt-8 pb-4">
        <button onClick={() => navigate(-1)} className="mr-2 p-2 rounded-full bg-white/80 hover:bg-white">
          <ChevronLeft className="w-6 h-6 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{vehicle.model}</h1>
          <div className="text-xs text-gray-500">{vehicle.year} {vehicle.make}</div>
        </div>
      </header>
      <div className="px-4">
        <div className="flex flex-col items-center mb-6">
          <img
            src={vehicle.imageUrl || '/default-car.png'}
            alt={vehicle.model}
            className="w-full max-w-xs h-32 object-contain rounded-2xl bg-white shadow"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl bg-white/90 p-4 text-center shadow">
            <div className="text-xs text-gray-500 mb-1">Engine</div>
            <div className="font-bold text-gray-900">{vehicle.fuelType} {vehicle.engineSize}</div>
          </div>
          <div className="rounded-xl bg-white/90 p-4 text-center shadow">
            <div className="text-xs text-gray-500 mb-1">Current Mileage</div>
            <div className="font-bold text-gray-900">{vehicle.currentMileage.toLocaleString()} km</div>
          </div>
          <div className="rounded-xl bg-white/90 p-4 text-center shadow">
            <div className="text-xs text-gray-500 mb-1">Next Service</div>
            <div className="font-bold text-gray-900">{(vehicle.nextServiceMileage || (vehicle.currentMileage + vehicle.mileageInterval)).toLocaleString()} km</div>
          </div>
          <div className="rounded-xl bg-white/90 p-4 text-center shadow">
            <div className="text-xs text-gray-500 mb-1">Registration</div>
            <div className="font-bold text-gray-900">{vehicle.registration}</div>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">Recent Activities</div>
            {/* <button className="text-xs text-[#A31526]">Modify</button> */}
          </div>
          {vehicleLogs.length === 0 ? (
            <div className="rounded-xl bg-white/80 p-4 text-center text-gray-500 shadow">No recent activities.</div>
          ) : (
            <div className="space-y-2">
              {vehicleLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="rounded-xl bg-white/90 p-3 shadow text-sm text-gray-700">
                  <div className="font-medium text-gray-900 mb-1">{log.serviceType.replace('_', ' ').toUpperCase()}</div>
                  <div>{log.notes || 'No notes'}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(log.serviceDate).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
