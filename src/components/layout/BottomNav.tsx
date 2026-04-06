import { Calendar, FileText, LayoutGrid, Navigation } from 'lucide-react'
import { NavLink, useLocation, useParams } from 'react-router-dom'

export function BottomNav() {
  const location = useLocation()

  // Grab any :vehicleId already present in the current URL so nav links stay contextual
  const { vehicleId } = useParams<{ vehicleId?: string }>()
  const vid = vehicleId ?? ''

  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutGrid, path: '/' },
    { label: 'Services', to: vid ? `/service/${vid}` : '/', icon: FileText, path: '/service' },
    { label: 'Map', to: '/map', icon: Navigation, path: '/map' },
    { label: 'Schedule', to: vid ? `/schedule/${vid}` : '/', icon: Calendar, path: '/schedule' },
  ]

  const isRouteActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }

    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 justify-around border-t border-[0.5px] border-t-mz-gray-300 bg-mz-white px-0 pt-[10px] pb-[calc(env(safe-area-inset-bottom,14px))]">
      <div className="flex w-full items-start justify-around">
        {navItems.map(({ icon: Icon, label, to, path }) => {
          const active = isRouteActive(path)

          return (
            <NavLink
              key={label}
              to={to}
              className="flex min-w-[60px] flex-col items-center gap-[3px] transition-transform duration-100 active:scale-[0.97]"
            >
              <Icon
                className={`h-5 w-5 ${active ? 'text-mz-red' : 'text-mz-gray-300'}`}
                strokeWidth={2.5}
              />
              <span
                className={`font-body text-[9px] font-semibold uppercase tracking-[0.08em] ${
                  active ? 'text-mz-red' : 'text-mz-gray-300'
                }`}
              >
                {label}
              </span>
              <span
                aria-hidden="true"
                className={`h-1 w-1 rounded-full bg-mz-red ${active ? 'visible' : 'invisible'}`}
              />
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
