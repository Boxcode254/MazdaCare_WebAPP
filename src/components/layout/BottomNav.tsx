import { CarFront, ClipboardList, LayoutDashboard, MapPinned } from 'lucide-react'
import { NavLink, useLocation, useParams } from 'react-router-dom'

export function BottomNav() {
  const location = useLocation()

  // Grab any :vehicleId already present in the current URL so nav links stay contextual
  const { vehicleId } = useParams<{ vehicleId?: string }>()
  const vid = vehicleId ?? ''

  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Service', to: vid ? `/service/${vid}` : '/', icon: ClipboardList },
    { label: 'Map', to: '/map', icon: MapPinned },
    { label: 'Schedule', to: vid ? `/schedule/${vid}` : '/', icon: CarFront },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 px-2 pb-3 pt-2 backdrop-blur">
      {navItems.map(({ icon: Icon, label, to }) => {
        const active =
          to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to.split('/')[1] ? `/${to.split('/')[1]}` : to)

        return (
          <NavLink
            key={label}
            to={to}
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition ${
              active ? 'bg-red-50 text-mazda-red' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
