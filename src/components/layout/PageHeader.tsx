import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  backTo?: string
  action?: ReactNode
}

function getBackLabel(backTo: string): string {
  if (backTo === '/') return 'Dashboard'
  if (backTo.startsWith('/service')) return 'Service History'
  if (backTo.startsWith('/schedule')) return 'Schedule'
  if (backTo.startsWith('/map')) return 'Map'
  if (backTo.startsWith('/add-car')) return 'Add Car'
  if (backTo.startsWith('/settings')) return 'Settings'

  const tail = backTo.split('/').filter(Boolean).at(-1) ?? 'Back'
  return tail
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function PageHeader({ title, subtitle, backTo, action }: PageHeaderProps) {
  return (
    <header className="-mx-4 -mt-6 mb-4 bg-mz-black" role="banner">
      <div className="relative px-4 pb-5 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        {backTo ? (
          <Link
            to={backTo}
            className="mb-2 inline-flex items-center gap-1 text-[12px] text-white/50"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{`← ${getBackLabel(backTo)}`}</span>
          </Link>
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1
              className="text-white"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '24px',
                fontWeight: 300,
                fontStyle: 'italic',
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-[2px] text-[11px] text-white/45" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      </div>
    </header>
  )
}