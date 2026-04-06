import { CalendarDays, ClipboardList, LayoutDashboard, Map } from 'lucide-react'
import { NavLink, useLocation, useParams } from 'react-router-dom'

export function BottomNav() {
  const location = useLocation()

  // Grab any :vehicleId already present in the current URL so nav links stay contextual
  const { vehicleId } = useParams<{ vehicleId?: string }>()
  const vid = vehicleId ?? ''

  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard, path: '/' },
    { label: 'Service', to: vid ? `/service/${vid}` : '/', icon: ClipboardList, path: '/service' },
    { label: 'Map', to: '/map', icon: Map, path: '/map' },
    { label: 'Schedule', to: vid ? `/schedule/${vid}` : '/', icon: CalendarDays, path: '/schedule' },
  ]

  const isRouteActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }

    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-slate-200/70 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-100/80 p-1">
        {navItems.map(({ icon: Icon, label, to, path }) => {
          const active = isRouteActive(path)

          return (
            <NavLink
              key={label}
              to={to}
              className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold transition ${
                active
                  ? 'bg-white text-mazda-red shadow-sm'
                  : 'text-slate-500 hover:bg-white/80 hover:text-slate-900'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
