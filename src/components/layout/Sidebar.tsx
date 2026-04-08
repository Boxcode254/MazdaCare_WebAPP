export function Sidebar() {
  return (
    <nav className="flex flex-col gap-4 p-6">
      <div className="font-bold text-lg text-[#A31526] mb-4">MazdaCare</div>
      <a href="/" className="text-gray-800 hover:text-[#A31526] font-medium">Dashboard</a>
      <a href="/garage" className="text-gray-800 hover:text-[#A31526] font-medium">Garage</a>
      <a href="/map" className="text-gray-800 hover:text-[#A31526] font-medium">Map</a>
      <a href="/settings" className="text-gray-800 hover:text-[#A31526] font-medium">Settings</a>
    </nav>
  )
}
