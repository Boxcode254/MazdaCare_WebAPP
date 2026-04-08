import { Home, Car, MapPin, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function Navigation() {
  const navigate = useNavigate()
  return (
    <nav className="fixed bottom-0 left-0 z-40 w-full max-w-md border-t border-[rgba(153,23,40,0.08)] bg-[rgba(255,249,248,0.94)] pb-[calc(env(safe-area-inset-bottom,0px)+8px)] shadow-[0_-10px_40px_rgba(90,12,24,0.08)] backdrop-blur-xl flex items-center justify-around px-2 py-2.5 lg:hidden">
      <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#A31526]">
        <Home className="h-6 w-6" />
        <span className="text-xs">Home</span>
      </button>
      <button onClick={() => navigate("/garage")} className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#A31526]">
        <Car className="h-6 w-6" />
        <span className="text-xs">Garage</span>
      </button>
      <button onClick={() => navigate("/map")} className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#A31526]">
        <MapPin className="h-6 w-6" />
        <span className="text-xs">Map</span>
      </button>
      <button onClick={() => navigate("/settings")} className="flex flex-col items-center gap-1 text-gray-700 hover:text-[#A31526]">
        <Settings className="h-6 w-6" />
        <span className="text-xs">Settings</span>
      </button>
    </nav>
  )
}
