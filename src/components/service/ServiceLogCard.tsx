import { CalendarDays, CarFront, Coins, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

export function ServiceLogCard({ log }: ServiceLogCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{SERVICE_LABELS[log.serviceType]}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date(log.serviceDate).toLocaleDateString()}
          </span>
        </div>

        <p className="inline-flex items-center gap-1 text-sm font-medium text-slate-800">
          <CarFront className="h-4 w-4 text-mazda-red" />
          {log.mileageAtService.toLocaleString()} km
        </p>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{log.garageName || 'No garage name'}</span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-500" />
            {log.rating ?? '-'}
          </span>
        </div>

        <p className="inline-flex items-center gap-1 text-sm text-slate-700">
          <Coins className="h-4 w-4 text-emerald-600" />
          {typeof log.serviceCost === 'number' ? `KES ${log.serviceCost.toLocaleString()}` : 'Cost not recorded'}
        </p>
      </CardContent>
    </Card>
  )
}
