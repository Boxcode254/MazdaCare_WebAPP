import { Disc, Droplets, Star, CircleDot, Wrench, Hammer } from 'lucide-react'
import type { ServiceLog } from '@/types'

interface ServiceLogCardProps {
  log: ServiceLog
}

const SERVICE_LABELS: Record<ServiceLog['serviceType'], string> = {
  minor: 'Minor Service',
  major: 'Major Service',
  oil_change: 'Oil Change',
  tyre_rotation: 'Tyre Rotation',
  brake_service: 'Brake Service',
  other: 'Other',
}

function serviceMeta(serviceType: ServiceLog['serviceType']) {
  if (serviceType === 'minor') {
    return {
      icon: Wrench,
      badgeClass: 'bg-mz-red-light text-mz-red',
      badgeText: 'MINOR',
    }
  }

  if (serviceType === 'major') {
    return {
      icon: Hammer,
      badgeClass: 'bg-mz-black text-white',
      badgeText: 'MAJOR',
    }
  }

  if (serviceType === 'oil_change') {
    return {
      icon: Droplets,
      badgeClass: 'bg-mz-gold-light text-[#7A5C14]',
      badgeText: 'OIL',
    }
  }

  if (serviceType === 'tyre_rotation') {
    return {
      icon: CircleDot,
      badgeClass: 'bg-mz-gray-100 text-mz-gray-700',
      badgeText: 'OTHER',
    }
  }

  if (serviceType === 'brake_service') {
    return {
      icon: Disc,
      badgeClass: 'bg-mz-gray-100 text-mz-gray-700',
      badgeText: 'OTHER',
    }
  }

  return {
    icon: Wrench,
    badgeClass: 'bg-mz-gray-100 text-mz-gray-700',
    badgeText: 'OTHER',
  }
}

export function ServiceLogCard({ log }: ServiceLogCardProps) {
  const { icon: Icon, badgeClass, badgeText } = serviceMeta(log.serviceType)
  const rating = typeof log.rating === 'number' ? log.rating : null

  return (
    <article className="mb-2 flex items-start gap-3 rounded-xl border border-[0.5px] border-black/6 bg-white px-[14px] py-3">
      <div className="flex h-9 w-9 min-w-9 items-center justify-center rounded-lg bg-mz-red-light">
        <Icon className="h-4 w-4 text-mz-red" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[13px] font-semibold text-mz-black"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {SERVICE_LABELS[log.serviceType]}
        </p>
        <p className="mt-[2px] text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {log.garageName || 'No garage name'}
        </p>

        {rating != null ? (
          <div className="mt-[2px] flex gap-[2px]">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-[11px] w-[11px] ${n <= rating ? 'fill-current text-mz-gold' : 'text-[#E8E2E3]'}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 text-right" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <p className="text-[11px] text-mz-gray-500">
          {new Date(log.serviceDate).toLocaleDateString('en-KE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>

        <p className="mt-[2px] text-[12px] font-semibold text-mz-black">
          {typeof log.serviceCost === 'number' ? `KES ${log.serviceCost.toLocaleString()}` : '—'}
        </p>

        <span
          className={`mt-[4px] inline-flex rounded-[8px] px-[7px] py-[2px] text-[9px] font-bold uppercase ${badgeClass}`}
          style={{ letterSpacing: '0.04em' }}
        >
          {badgeText}
        </span>
      </div>
    </article>
  )
}
