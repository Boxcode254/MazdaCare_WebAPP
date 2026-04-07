import { Car, Home, MapPin, User } from 'lucide-react'
import { NavLink, useLocation, useParams } from 'react-router-dom'

export function BottomNav() {
  const location = useLocation()

  // Grab any :vehicleId already present in the current URL so nav links stay contextual
  const { vehicleId } = useParams<{ vehicleId?: string }>()
  const vid = vehicleId ?? ''

  const navItems = [
    { label: 'Home', to: '/', icon: Home, matches: ['/'] },
    {
      label: 'My Garage',
      to: vid ? `/service/${vid}` : '/add-car',
      icon: Car,
      matches: ['/service', '/add-car', '/schedule', '/log-service'],
    },
    { label: 'Services', to: '/map', icon: MapPin, matches: ['/map'] },
    { label: 'Profile', to: '/settings', icon: User, matches: ['/settings'] },
  ]

  const isRouteActive = (matches: string[]) => {
    if (matches.includes('/')) {
      return location.pathname === '/'
    }

    return matches.some((path) => location.pathname.startsWith(path))
  }

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 justify-around border-t border-black/5 bg-white/98 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,14px)+6px)] backdrop-blur supports-[backdrop-filter]:bg-white/94">
      <div className="flex w-full items-start justify-around">
        {navItems.map(({ icon: Icon, label, to, matches }) => {
          const active = isRouteActive(matches)

          return (
            <NavLink
              key={label}
              to={to}
              className="flex min-w-[68px] flex-col items-center gap-1 rounded-2xl px-2 py-1.5 transition-transform duration-100 active:scale-[0.97]"
            >
              <Icon
                className={`${active ? 'text-[#A31526]' : 'text-mz-gray-300'} h-5 w-5`}
                strokeWidth={2.25}
              />
              <span
                className={`font-body text-xs font-medium leading-none ${
                  active ? 'text-[#A31526]' : 'text-mz-gray-500'
                }`}
              >
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
