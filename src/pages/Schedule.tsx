import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  Bell,
  BellOff,
  CheckCircle2,
  Circle,
  Wrench,
  CalendarDays,
  TrendingUp,
  ChevronRight,
  CarFront,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useVehicles } from '@/hooks/useVehicles'
import { useServiceLogs } from '@/hooks/useServiceLogs'
import { calculateNextService } from '@/hooks/useAlerts'
import { toast } from 'sonner'
import type { ServiceLog } from '@/types'

// ─── Service checklists ────────────────────────────────────────────────────
const MINOR_CHECKLIST = [
  'Engine oil + filter change',
  'Air filter inspection',
  'Tyre pressure check',
  'Coolant level check',
  'Brake fluid level check',
  'Windscreen washer fluid top-up',
]

const MAJOR_CHECKLIST = [
  ...MINOR_CHECKLIST,
  'Brake pads & discs inspection',
  'Spark plugs replacement',
  'Transmission fluid change',
  'Timing belt / chain inspection',
  'Fuel filter replacement',
  'Cabin air filter replacement',
]

// Progress bar colour based on fraction used (0–1)
function progressColour(fractionUsed: number): string {
  if (fractionUsed < 0.6) return 'bg-green-500'
  if (fractionUsed < 0.9) return 'bg-yellow-400'
  return 'bg-red-500'
}

type NotifState = 'idle' | 'granted' | 'denied' | 'unsupported'

function getNextType(lastType: ServiceLog['serviceType']): 'minor' | 'major' {
  return lastType === 'major' ? 'minor' : 'major'
}

export function Schedule() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const navigate = useNavigate()

  const { vehicles, fetchVehicles, loading: vLoading } = useVehicles()
  const { logs, fetchLogs, loading: lLoading } = useServiceLogs()
  const [notifState, setNotifState] = useState<NotifState>('idle')

  const vehicle = vehicles.find((v) => v.id === vehicleId)
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime(),
  )
  const lastLog = sortedLogs[0]

  useEffect(() => {
    void fetchVehicles()
    if (vehicleId) void fetchLogs(vehicleId)
    // check existing notification permission
    if (!('Notification' in window)) {
      setNotifState('unsupported')
    } else {
      if (Notification.permission === 'granted') setNotifState('granted')
      else if (Notification.permission === 'denied') setNotifState('denied')
    }
  }, [vehicleId, fetchVehicles, fetchLogs])

  async function requestReminder() {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser.')
      return
    }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      setNotifState('granted')
      if (vehicle && lastLog) {
        const { dueMileage, dueDate } = calculateNextService(vehicle, lastLog)
        new Notification('MazdaCare — Service Reminder', {
          body: `Your ${vehicle.model} is due for service by ${format(dueDate, 'dd MMM yyyy')} or at ${dueMileage.toLocaleString()} km.`,
          icon: '/icons/icon-192.png',
        })
      }
      toast.success('Reminder set! You will receive a browser notification.')
    } else {
      setNotifState('denied')
      toast.error('Notifications blocked. Please enable them in browser settings.')
    }
  }

  const loading = vLoading || lLoading

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Wrench className="h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-500">Vehicle not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  if (!lastLog) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">
          {vehicle.model} {vehicle.year}
        </h1>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <CalendarDays className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">No service history yet.</p>
          <Button
            size="sm"
            className="bg-[#C00000] text-white hover:bg-[#a00000]"
            onClick={() => navigate(`/log-service/${vehicleId}`)}
          >
            Log First Service
          </Button>
        </div>
      </div>
    )
  }

  const nextSvc = calculateNextService(vehicle, lastLog)
  const { dueMileage, dueDate, kmRemaining, daysRemaining, fractionUsed } = nextSvc
  const nextType = getNextType(lastLog.serviceType)
  const checklist = nextType === 'major' ? MAJOR_CHECKLIST : MINOR_CHECKLIST
  const barColour = progressColour(fractionUsed)

  // Urgency label
  const urgentKm = kmRemaining <= 500
  const urgentDays = daysRemaining <= 14
  const urgencyLabel = urgentKm || urgentDays ? 'Due Soon' : kmRemaining <= 1500 ? 'Upcoming' : 'On Track'
  const urgencyColour =
    urgentKm || urgentDays
      ? 'bg-red-100 text-red-700'
      : kmRemaining <= 1500
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-green-100 text-green-700'

  return (
    <div className="space-y-5 pb-4 animate-enter-up">
      <div className="rounded-2xl border border-white/70 bg-white/92 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {vehicle.model} {vehicle.year}
            </h1>
            <p className="text-xs text-slate-500">Next service readiness and timeline</p>
          </div>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-mazda-red">
            <CarFront className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold">
          <Badge className={urgencyColour}>{urgencyLabel}</Badge>
        </div>
      </div>

      {/* ── Next service countdown ── */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <TrendingUp className="h-4 w-4 text-[#C00000]" />
            Next Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-bold text-slate-900">
            {kmRemaining > 0
              ? `${kmRemaining.toLocaleString()} km`
              : 'Overdue'}
          </p>
          <p className="text-sm text-slate-500">
            or by{' '}
            <span className="font-medium text-slate-700">
              {format(dueDate, 'dd MMM yyyy')}
            </span>{' '}
            · {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'} remaining
          </p>
          <p className="text-xs text-slate-400">
            Service type: <span className="font-medium capitalize">{nextType}</span> · Due at{' '}
            {dueMileage.toLocaleString()} km
          </p>

          {/* Coloured progress bar */}
          <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${barColour}`}
              style={{ width: `${Math.round(fractionUsed * 100)}%` }}
            />
          </div>
          <p className="text-right text-xs text-slate-400">
            {Math.round(fractionUsed * 100)}% of interval used
          </p>
        </CardContent>
      </Card>

      {/* ── Reminder button ── */}
      <Button
        className="h-11 w-full gap-2"
        variant="outline"
        onClick={requestReminder}
        disabled={notifState === 'denied' || notifState === 'unsupported'}
      >
        {notifState === 'granted' ? (
          <>
            <Bell className="h-4 w-4 text-green-600" />
            Reminder set
          </>
        ) : notifState === 'denied' ? (
          <>
            <BellOff className="h-4 w-4 text-slate-400" />
            Notifications blocked
          </>
        ) : notifState === 'unsupported' ? (
          <>
            <BellOff className="h-4 w-4 text-slate-400" />
            Not supported
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" />
            Schedule reminder
          </>
        )}
      </Button>

      {/* ── Service checklist ── */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-[#C00000]" />
            {nextType === 'major' ? 'Major' : 'Minor'} Service Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ── Estimated cost card ── */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Wrench className="h-4 w-4 text-[#C00000]" />
            Cost Estimate (Nairobi)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Minor Service</span>
            <span className="font-medium text-slate-800">KES 3,000 – 6,000</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Major Service</span>
            <span className="font-medium text-slate-800">KES 8,000 – 20,000</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Estimates for independent garages in Nairobi. Mazda dealer prices may be higher.
          </p>
          <div
            className={`mt-2 rounded-lg p-3 ${nextType === 'major' ? 'bg-orange-50' : 'bg-blue-50'}`}
          >
            <p className="text-xs font-medium text-slate-700">
              Your upcoming{' '}
              <span className="capitalize">{nextType}</span> service estimate:
            </p>
            <p className="text-base font-bold text-slate-900">
              {nextType === 'major' ? 'KES 8,000 – 20,000' : 'KES 3,000 – 6,000'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Past services timeline ── */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarDays className="h-4 w-4 text-[#C00000]" />
          Service Timeline
        </h2>
        {sortedLogs.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No logs yet.</p>
        ) : (
          <ol className="relative border-l-2 border-slate-200 pl-5">
            {sortedLogs.map((log, idx) => (
              <li key={log.id} className={`relative pb-5 ${idx === sortedLogs.length - 1 ? '' : ''}`}>
                {/* Timeline dot */}
                <span className="absolute -left-[1.15rem] flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-slate-200">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      log.serviceType === 'major' ? 'bg-[#C00000]' : 'bg-slate-400'
                    }`}
                  />
                </span>

                <button
                  type="button"
                  className="flex w-full items-start justify-between text-left"
                  onClick={() => navigate(`/service/${vehicleId}`)}
                >
                  <div>
                    <p className="text-xs font-medium text-slate-800">
                      {format(parseISO(log.serviceDate), 'dd MMM yyyy')}
                    </p>
                    <p className="text-xs capitalize text-slate-500">
                      {log.serviceType.replace('_', ' ')} ·{' '}
                      {log.mileageAtService.toLocaleString()} km
                    </p>
                    {log.garageName && (
                      <p className="text-xs text-slate-400">{log.garageName}</p>
                    )}
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ── Log new service CTA ── */}
      <Button
        className="h-11 w-full bg-[#C00000] text-white hover:bg-[#a00000]"
        onClick={() => navigate(`/log-service/${vehicleId}`)}
      >
        Log a Service
      </Button>
    </div>
  )
}
