import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  Bell,
  Check,
  Wrench,
  CalendarDays,
  CarFront,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
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
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mz-red-light">
          <Wrench className="h-6 w-6 text-mz-red" />
        </div>
        <h2 className="mt-4 text-[16px] font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>Vehicle not found</h2>
        <p className="mt-[6px] text-[13px] text-mz-gray-500">This vehicle may have been removed.</p>
        <Button className="mt-5 bg-mz-red text-white hover:bg-mz-red-mid" size="sm" onClick={() => navigate('/')}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  if (!lastLog) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Service Schedule"
          subtitle={`${vehicle.model} ${vehicle.year}`}
          backTo="/"
          action={<CarFront className="h-5 w-5 text-white/60" />}
        />
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mz-red-light">
            <CalendarDays className="h-6 w-6 text-mz-red" />
          </div>
          <h2 className="mt-4 text-[16px] font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>No service history yet</h2>
          <p className="mt-[6px] max-w-[240px] text-center text-[13px] text-mz-gray-500">Log your first service to unlock schedule predictions.</p>
          <Button
            size="sm"
            className="mt-5 bg-mz-red text-white hover:bg-mz-red-mid"
            onClick={() => navigate(`/log-service/${vehicleId}`)}
          >
            Log First Service
          </Button>
        </div>
      </div>
    )
  }

  const nextSvc = calculateNextService(vehicle, lastLog)
  const { dueDate, kmRemaining, fractionUsed } = nextSvc
  const nextType = getNextType(lastLog.serviceType)
  const checklist = nextType === 'major' ? MAJOR_CHECKLIST : MINOR_CHECKLIST
  const progressFill = fractionUsed > 0.8 ? '#9B1B30' : fractionUsed >= 0.5 ? '#C49A3C' : '#2E7D4F'
  const serviceBadgeClass =
    nextType === 'major' ? 'bg-mz-black text-white' : 'bg-mz-red-light text-mz-red'

  return (
    <div className="space-y-5 bg-mz-gray-100 pb-4 animate-enter-up">
      <PageHeader
        title="Service Schedule"
        subtitle={`${vehicle.model} ${vehicle.year} · Next service readiness and timeline`}
        backTo="/"
        action={<CarFront className="h-5 w-5 text-white/60" />}
      />

      {/* ── Next service countdown ── */}
      <section className="mx-[-2px] mt-0 rounded-2xl bg-mz-black p-5 text-white">
        <p
          className="text-[10px] uppercase text-white/45"
          style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
        >
          NEXT SERVICE
        </p>
        <p
          className="mt-1 text-[36px] font-bold leading-none"
          style={{
            fontFamily: 'Outfit, sans-serif',
            color: kmRemaining > 0 ? '#FFFFFF' : '#9B1B30',
          }}
        >
          {kmRemaining > 0 ? `${kmRemaining.toLocaleString()} km` : 'OVERDUE'}
        </p>
        <p className="mt-1 text-xs text-white/45" style={{ fontFamily: 'Outfit, sans-serif' }}>
          or by {format(dueDate, 'dd MMM yyyy')} - whichever comes first
        </p>

        <div className="mt-4 h-1 overflow-hidden rounded bg-white/10">
          <div
            className="h-full rounded"
            style={{ width: `${Math.round(fractionUsed * 100)}%`, backgroundColor: progressFill }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-white/45" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <span>Last service: {format(parseISO(lastLog.serviceDate), 'dd MMM yyyy')}</span>
          <span>{vehicle.mileageInterval.toLocaleString()} km interval</span>
        </div>
      </section>

      {/* ── Reminder button ── */}
      <Button
        className="mx-[-2px] flex w-[calc(100%+4px)] items-center justify-center gap-2 rounded-xl border-[1.5px] border-mz-red bg-white py-3 text-[13px] font-semibold text-mz-red hover:bg-white/90"
        style={{ fontFamily: 'Outfit, sans-serif' }}
        onClick={requestReminder}
        disabled={notifState === 'denied' || notifState === 'unsupported'}
      >
        <Bell className="h-4 w-4 text-mz-red" />
        Set service reminder
      </Button>

      {/* ── Service checklist ── */}
      <section className="mx-[-2px] rounded-2xl bg-white p-[14px]">
        <h2
          className="mb-3 text-[11px] font-bold uppercase text-mz-red"
          style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
        >
          What's included
        </h2>
        <ul>
          {checklist.map((item) => (
            <li key={item} className="flex items-center gap-2.5 border-b border-b-[0.5px] border-b-mz-gray-100 py-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-mz-gray-300 bg-transparent">
                <Check className="h-3 w-3 text-transparent" />
              </span>
              <span className="flex-1 text-[13px] text-mz-gray-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {item}
              </span>
              <span
                className={`rounded-[8px] px-[7px] py-[2px] text-[9px] font-bold uppercase ${serviceBadgeClass}`}
                style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.04em' }}
              >
                {nextType}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Estimated cost card ── */}
      <section className="mx-[-2px] rounded-xl bg-mz-red-light p-[14px]">
        <h3 className="text-xs font-semibold text-mz-red" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Typical cost range - Nairobi
        </h3>
        <div className="mt-2 space-y-2 text-xs text-mz-gray-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <div className="flex items-center justify-between">
            <span>Minor</span>
            <span>KES 3,000–6,000</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Major</span>
            <span>KES 8,000–20,000</span>
          </div>
        </div>
      </section>

      {/* ── Past services timeline ── */}
      <div className="mx-[-2px]">
        <h2
          className="mb-2 text-[11px] font-bold uppercase text-mz-red"
          style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
        >
          Service history
        </h2>
        {sortedLogs.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-mz-gray-300">No logs yet.</p>
        ) : (
          <ol>
            {sortedLogs.map((log, idx) => (
              <li key={log.id} className="mb-3 flex items-start gap-3">
                <div className="flex w-5 flex-col items-center">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      log.serviceType === 'major'
                        ? 'bg-mz-black'
                        : log.serviceType === 'minor'
                          ? 'bg-mz-red'
                          : log.serviceType === 'oil_change'
                            ? 'bg-mz-gold'
                            : 'bg-mz-gray-300'
                    }`}
                  />
                  {idx !== sortedLogs.length - 1 ? <span className="mt-1 min-h-8 w-px flex-1 bg-mz-gray-100" /> : null}
                </div>

                <button
                  type="button"
                  className="flex flex-1 items-start justify-between gap-2 rounded-[10px] bg-white px-3 py-2 text-left"
                  onClick={() => navigate(`/service/${vehicleId}`)}
                >
                  <div>
                    <p className="text-xs font-semibold capitalize text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {log.serviceType.replace('_', ' ')}
                    </p>
                    <p className="mt-[2px] text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {log.mileageAtService.toLocaleString()} km
                    </p>
                  </div>
                  <p className="text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {format(parseISO(log.serviceDate), 'dd MMM yyyy')}
                  </p>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ── Log new service CTA ── */}
      <Button
        className="mx-[-2px] h-11 w-[calc(100%+4px)] bg-mz-red text-white hover:bg-mz-red-mid"
        onClick={() => navigate(`/log-service/${vehicleId}`)}
      >
        Log a Service
      </Button>
    </div>
  )
}
