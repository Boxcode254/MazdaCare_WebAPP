import { useNavigate } from 'react-router-dom'
import { useVehicles } from '@/hooks/useVehicles'
import { CarCard } from '@/components/car/CarCard'
import { Plus } from 'lucide-react'

export default function VehiclesPage() {
  const { vehicles } = useVehicles()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f3fa] to-[#e6e0f7] pb-24">
      <header className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          My Vehicles
        </h1>
      </header>
      <div className="px-4 space-y-4">
        {vehicles.length === 0 ? (
          <div className="rounded-xl bg-white/80 p-8 text-center shadow">
            <p className="text-gray-500">No vehicles yet. Add your first car!</p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="rounded-2xl bg-white shadow flex items-center p-3 hover:shadow-md transition cursor-pointer"
              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
            >
              <img
                src={vehicle.imageUrl || '/default-car.png'}
                alt={vehicle.model}
                className="w-20 h-12 object-contain rounded-lg bg-gray-50 mr-4"
              />
              <div className="flex-1">
                <div className="font-semibold text-[16px] text-gray-900">{vehicle.make} {vehicle.model}</div>
                <div className="text-xs bg-[#F5E8EA] text-[#A31526] rounded-full px-3 py-1 inline-block mt-1 font-mono">
                  {vehicle.registration}
                </div>
              </div>
              <span className="ml-auto text-gray-300">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </div>
          ))
        )}
      </div>
      <button
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#A31526] text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-[#8B1220] transition"
        onClick={() => navigate('/add-car')}
        aria-label="Add Vehicle"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  )
}
