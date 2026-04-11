import { Car, Home, User, CheckCircle2, Bell } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

export function BottomNav() {
  const location = useLocation()

  const navItems = [
    { label: 'Home', to: '/', icon: Home, matches: ['/'] },
    {
      label: 'Vehicles',
      to: '/vehicles',
      icon: Car,
      matches: ['/vehicles'],
    },
    {
      label: 'Events',
      to: '/events',
      icon: CheckCircle2,
      matches: ['/events'],
    },
    {
      label: 'Notifications',
      to: '/notifications',
      icon: Bell,
      matches: ['/notifications'],
    },
    { label: 'Settings', to: '/settings', icon: User, matches: ['/settings'] },
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
