import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { CarFront, MapPin, ClipboardList, CalendarDays, Plus, Star, UserCircle, Fuel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CarCard } from '@/components/car/CarCard'
import { InstallAppBanner } from '@/components/layout/InstallAppBanner'
import { AlertBanner } from '@/components/schedule/AlertBanner'
import { useVehicles } from '@/hooks/useVehicles'
import { useServiceLogs } from '@/hooks/useServiceLogs'
import { calculateNextService } from '@/hooks/useAlerts'
import { useAppStore } from '@/stores/appStore'
import type { Vehicle, ServiceLog } from '@/types'

// ─── Skeleton ──────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />
}

// ─── Greeting ──────────────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstName(displayName: string | null | undefined): string {
  if (!displayName) return ''
  return displayName.split(' ')[0]
}

// ─── Circular progress ─────────────────────────────────────────────────────
function CircularProgress({ fraction, size = 80 }: { fraction: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(Math.max(fraction, 0), 1)
  const colour = fraction < 0.6 ? '#16a34a' : fraction < 0.9 ? '#ca8a04' : '#C00000'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={colour}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Pull-to-refresh hook ──────────────────────────────────────────────────
function usePullToRefresh(onRefresh: () => Promise<void>) {
  const startY = useRef(0)
  const pulling = useRef(false)

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      pulling.current = true
    }
  }, [])

  const onTouchEnd = useCallback(
    async (e: TouchEvent) => {
      if (!pulling.current) return
      const deltaY = e.changedTouches[0].clientY - startY.current
      pulling.current = false
      if (deltaY > 60) {
        await onRefresh()
      }
    },
    [onRefresh],
  )

  useEffect(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [onTouchStart, onTouchEnd])
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export function Dashboard() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)

  const { vehicles, fetchVehicles, updateVehicle, loading: vLoading } = useVehicles()
  const { logs, fetchLogs, loading: lLoading } = useServiceLogs()

  const [activeIdx, setActiveIdx] = useState(0)
  const activeVehicle: Vehicle | undefined = vehicles[activeIdx]

  const loadData = useCallback(async () => {
    await fetchVehicles()
  }, [fetchVehicles])

  // Fetch vehicle list on mount
  useEffect(() => {
    void loadData()
  }, [loadData])

  // Auto-navigate to AddCar on first open if no vehicles (and not still loading)
  useEffect(() => {
    if (!vLoading && vehicles.length === 0) {
      // Small delay so the user sees the dashboard briefly before redirect
      const t = setTimeout(() => navigate('/add-car'), 800)
      return () => clearTimeout(t)
    }
  }, [vLoading, vehicles.length, navigate])

  // Fetch logs for the active vehicle
  useEffect(() => {
    if (activeVehicle?.id) {
      void fetchLogs(activeVehicle.id)
    }
  }, [activeVehicle?.id, fetchLogs])

  // Keep activeIdx in bounds when vehicles change
  useEffect(() => {
    if (activeIdx >= vehicles.length && vehicles.length > 0) {
      setActiveIdx(vehicles.length - 1)
    }
  }, [vehicles.length, activeIdx])

  usePullToRefresh(async () => {
    await fetchVehicles()
    if (activeVehicle?.id) await fetchLogs(activeVehicle.id)
  })

  const sortedLogs = [...logs].sort(
    (a: ServiceLog, b: ServiceLog) =>
      new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime(),
  )
  const lastLog = sortedLogs[0]
  const recentLogs = sortedLogs.slice(0, 3)

  const nextSvc =
    activeVehicle && lastLog ? calculateNextService(activeVehicle, lastLog) : null

  const onEnterActivate = (event: React.KeyboardEvent<HTMLElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

  const name = firstName(user?.user_metadata?.full_name ?? user?.email)

  // ── Loading skeleton ──
  if (vLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-48" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  // ── Empty state ──
  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/70 bg-white/90 py-20 text-center shadow-sm backdrop-blur">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/60">
          <CarFront className="h-10 w-10 text-[#C00000]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">No vehicles yet</h2>
          <p className="mt-1 text-sm text-slate-500">Add your Mazda to start tracking services.</p>
        </div>
        <Button
          className="bg-[#C00000] text-white hover:bg-[#a00000]"
          onClick={() => navigate('/add-car')}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add your Mazda
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-4 animate-enter-up">
      {/* ── Header ── */}
      <div className="rounded-2xl bg-gradient-to-br from-[#C00000] via-[#a31207] to-[#7f1d1d] p-4 text-white shadow-[0_14px_34px_rgba(127,29,29,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-white/80">{greeting()}</p>
            <h1 className="text-xl font-semibold text-white">
              {name ? `Hello, ${name}` : 'Welcome back'}
            </h1>
            <p className="mt-1 text-xs text-white/80">Keep your Mazda running smoothly across Nairobi roads.</p>
          </div>
          <button
            type="button"
            aria-label="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/20"
            onClick={() => navigate('/settings')}
          >
            <UserCircle className="h-5 w-5" />
          </button>
        </div>

        {activeVehicle ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs">
            <Fuel className="h-3.5 w-3.5" />
            <span className="capitalize">
              {activeVehicle.fuelType} service profile · {activeVehicle.registration}
            </span>
          </div>
        ) : null}
      </div>

      {/* ── Install app prompt ── */}
      <InstallAppBanner />

      {/* ── Alert banner ── */}
      <AlertBanner vehicle={activeVehicle} />

      {/* ── Vehicle horizontal scroll ── */}
      <div>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {vehicles.map((v, i) => (
            <div
              key={v.id}
              className={`w-[88vw] max-w-sm shrink-0 snap-start transition-opacity ${i === activeIdx ? 'opacity-100' : 'opacity-60'}`}
              onClick={() => setActiveIdx(i)}
            >
              <CarCard
                vehicle={v}
                onEditMileage={async (veh) => {
                  const raw = window.prompt(`New mileage for ${veh.model}:`, String(veh.currentMileage))
                  const km = parseInt(raw ?? '', 10)
                  if (!isNaN(km) && km > veh.currentMileage) {
                    await updateVehicle(veh.id, { currentMileage: km })
                    await fetchVehicles()
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        {vehicles.length > 1 && (
          <div className="mt-2 flex justify-center gap-1.5">
            {vehicles.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Select vehicle ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIdx ? 'w-5 bg-[#C00000]' : 'w-1.5 bg-slate-300'
                }`}
                onClick={() => setActiveIdx(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Next service countdown ── */}
      {activeVehicle && (
        <Card
          className="cursor-pointer border-slate-200/80 bg-white/95 shadow-sm"
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/schedule/${activeVehicle.id}`)}
          onKeyDown={(event) => onEnterActivate(event, () => navigate(`/schedule/${activeVehicle.id}`))}
        >
          <CardContent className="flex items-center gap-5 pt-4">
            <div className="relative shrink-0">
              <CircularProgress fraction={nextSvc?.fractionUsed ?? 0} size={80} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-medium text-slate-500 leading-tight">used</span>
                <span className="text-xs font-bold text-slate-800">
                  {Math.round((nextSvc?.fractionUsed ?? 0) * 100)}%
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Next service</p>
              {lLoading ? (
                <Skeleton className="mt-1 h-6 w-32" />
              ) : nextSvc ? (
                <>
                  <p className="text-2xl font-bold text-slate-900 leading-tight">
                    {nextSvc.kmRemaining > 0
                      ? `${nextSvc.kmRemaining.toLocaleString()} km`
                      : 'Overdue'}
                  </p>
                  <p className="text-xs text-slate-500">
                    or {nextSvc.daysRemaining > 0 ? `in ${nextSvc.daysRemaining} days` : 'overdue'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400">No service history</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Last service card ── */}
      {lastLog && activeVehicle && (
        <Card
          className="cursor-pointer border-slate-200/80 bg-white/95 shadow-sm"
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/service/${activeVehicle.id}`)}
          onKeyDown={(event) => onEnterActivate(event, () => navigate(`/service/${activeVehicle.id}`))}
        >
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Last service</p>
                <p className="mt-0.5 text-sm font-semibold capitalize text-slate-800">
                  {lastLog.serviceType.replace('_', ' ')}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(lastLog.serviceDate).toLocaleDateString('en-KE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {lastLog.garageName ? ` · ${lastLog.garageName}` : ''}
                </p>
              </div>
              {lastLog.rating && (
                <div className="flex items-center gap-0.5 text-xs text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {lastLog.rating}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick actions ── */}
      {activeVehicle && (
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: 'Log Service',
              icon: ClipboardList,
              to: `/log-service/${activeVehicle.id}`,
              colour: 'bg-red-50 text-[#C00000]',
            },
            {
              label: 'Find Garage',
              icon: MapPin,
              to: '/map',
              colour: 'bg-blue-50 text-blue-600',
            },
            {
              label: 'Schedule',
              icon: CalendarDays,
              to: `/schedule/${activeVehicle.id}`,
              colour: 'bg-green-50 text-green-600',
            },
          ].map(({ label, icon: Icon, to, colour }, idx) => (
            <button
              key={label}
              type="button"
              className={`stagger-enter flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl py-3 text-xs font-semibold transition active:scale-[0.98] hover:opacity-80 ${colour}`}
              style={{ '--stagger-delay': `${80 + idx * 60}ms` } as CSSProperties}
              onClick={() => navigate(to)}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Recent service logs ── */}
      {activeVehicle && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Recent Services</h2>
            <button
              type="button"
              className="text-xs text-[#C00000] hover:underline"
              onClick={() => navigate(`/service/${activeVehicle.id}`)}
            >
              View all
            </button>
          </div>
          {lLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
              <p className="text-sm text-slate-400">No services logged yet.</p>
              <button
                type="button"
                className="mt-2 text-xs text-[#C00000] hover:underline"
                onClick={() => navigate(`/log-service/${activeVehicle.id}`)}
              >
                Log first service →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log, idx) => (
                <button
                  key={log.id}
                  type="button"
                  className="stagger-enter flex items-center justify-between rounded-xl border border-slate-100 bg-white/95 px-4 py-3 shadow-sm transition active:scale-[0.995]"
                  style={{ '--stagger-delay': `${140 + idx * 55}ms` } as CSSProperties}
                  onClick={() => navigate(`/service/${activeVehicle.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium capitalize text-slate-800">
                      {log.serviceType.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {log.mileageAtService.toLocaleString()} km ·{' '}
                      {new Date(log.serviceDate).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      className={
                        log.serviceType === 'major'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }
                    >
                      {log.serviceType === 'major' ? 'Major' : 'Minor'}
                    </Badge>
                    {typeof log.serviceCost === 'number' && (
                      <p className="text-xs text-slate-400">
                        KES {log.serviceCost.toLocaleString()}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add another vehicle ── */}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm text-slate-400 hover:border-slate-400 hover:text-slate-600"
        onClick={() => navigate('/add-car')}
      >
        <Plus className="h-4 w-4" />
        Add another vehicle
      </button>
    </div>
  )
}
