import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Bell, Calendar, Navigation, Plus, Fuel, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CarCard } from '@/components/car/CarCard'
import { InstallAppBanner } from '@/components/layout/InstallAppBanner'
import { AlertBanner } from '@/components/schedule/AlertBanner'
import MazdaLogo from '@/components/ui/MazdaLogo'
import { GarageEmptyState } from '@/components/layout/EmptyState'
import { useVehicles } from '@/hooks/useVehicles'
import { useServiceLogs } from '@/hooks/useServiceLogs'
import { haptics } from '@/lib/haptics'
import { resolveVehicleServiceSnapshot } from '@/lib/serviceState'
import { useAppStore } from '@/stores/appStore'
import type { Vehicle, ServiceLog } from '@/types'

// ─── Skeleton ──────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
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

function initials(displayName: string | null | undefined): string {
  if (!displayName) return 'M'
  const words = displayName.split(' ').filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
}

function CarSilhouette({ width = 200, opacity = 0.2 }: { width?: number; opacity?: number }) {
  const height = Math.round(width * 0.4)

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ opacity }}
    >
      <path
        d="M19 53C22 44 29 38 42 35L61 30C67 19 81 13 104 13C126 13 141 19 152 30L168 34C176 36 181 41 184 48L188 53V59H179C177 65 171 69 163 69C155 69 149 65 147 59H56C54 65 48 69 40 69C32 69 26 65 24 59H13V55L19 53Z"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M69 29L82 22C88 19 96 18 109 18C123 18 133 20 142 29"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="58" r="8" stroke="white" strokeWidth="3" />
      <circle cx="163" cy="58" r="8" stroke="white" strokeWidth="3" />
    </svg>
  )
}

function OnboardingEmptyState({ onAddMazda }: { onAddMazda: () => void }) {
  const [cardVisible, setCardVisible] = useState(false)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setCardVisible(true))
    return () => window.cancelAnimationFrame(frameId)
  }, [])

  return (
    <div className="fixed inset-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col overflow-hidden bg-mz-black">
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
        <MazdaLogo variant="full" theme="dark" size="lg" />
        <div className="mt-8 flex justify-center">
          <CarSilhouette width={200} opacity={0.2} />
        </div>
      </div>

      <div
        className={`flex min-h-[60vh] flex-1 flex-col rounded-t-[28px] bg-white px-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] pt-8 transition-transform duration-300 ease-out ${
          cardVisible ? 'translate-y-0' : 'translate-y-12'
        }`}
      >
        <h2
          className="text-[28px] font-light italic leading-none text-mz-black"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Welcome to MazdaCare
        </h2>
        <p className="mt-[6px] text-[14px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Your garage is ready. Let’s add your first Mazda and set up reminders together.
        </p>

        <div className="mt-6 flex-1">
          {[
            {
              icon: Wrench,
              label: 'Track every service, oil, and cost',
              iconWrapClass: 'bg-mz-red-light',
              iconClass: 'text-mz-red',
            },
            {
              icon: Navigation,
              label: 'Find certified garages near you',
              iconWrapClass: 'bg-[#EDF2FF]',
              iconClass: 'text-[#1A3A6B]',
            },
            {
              icon: Bell,
              label: 'Get reminders before your next service',
              iconWrapClass: 'bg-mz-gold-light',
              iconClass: 'text-[#7A5C14]',
            },
          ].map(({ icon: Icon, label, iconWrapClass, iconClass }, index, rows) => (
            <div
              key={label}
              className={`flex items-center gap-3 py-[10px] ${index !== rows.length - 1 ? 'border-b border-b-[0.5px] border-b-mz-gray-100' : ''}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconWrapClass}`}>
                <Icon className={`h-4 w-4 ${iconClass}`} />
              </span>
              <span className="text-[13px] text-mz-gray-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-mz-red px-4 py-[14px] text-[14px] font-semibold text-white"
          style={{ fontFamily: 'Outfit, sans-serif' }}
          onClick={onAddMazda}
        >
          Add your first Mazda →
        </button>
      </div>
    </div>
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
  const { logs, fetchLogs, latestLogsByVehicle, fetchLatestLogs, loading: lLoading } = useServiceLogs()

  const [activeIdx, setActiveIdx] = useState(0)
  const [animatedMileage, setAnimatedMileage] = useState(0)
  const activeVehicle: Vehicle | undefined = vehicles[activeIdx]
  const hasAnimatedMileageRef = useRef(false)

  const loadData = useCallback(async () => {
    await fetchVehicles()
  }, [fetchVehicles])

  // Fetch vehicle list on mount
  useEffect(() => {
    void loadData()
  }, [loadData])

  // Fetch logs for the active vehicle
  useEffect(() => {
    if (activeVehicle?.id) {
      void fetchLogs(activeVehicle.id)
    }
  }, [activeVehicle?.id, fetchLogs])

  useEffect(() => {
    if (vehicles.length === 0) {
      return
    }

    void fetchLatestLogs(vehicles.map((vehicle) => vehicle.id)).catch(() => undefined)
  }, [fetchLatestLogs, vehicles])

  // Keep activeIdx in bounds when vehicles change
  useEffect(() => {
    if (activeIdx >= vehicles.length && vehicles.length > 0) {
      setActiveIdx(vehicles.length - 1)
    }
  }, [vehicles.length, activeIdx])

  usePullToRefresh(async () => {
    const refreshedVehicles = await fetchVehicles()
    await fetchLatestLogs(refreshedVehicles.map((vehicle) => vehicle.id))
    if (activeVehicle?.id) await fetchLogs(activeVehicle.id)
  })

  const sortedLogs = [...logs].sort(
    (a: ServiceLog, b: ServiceLog) =>
      new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime(),
  )
  const lastLog = sortedLogs[0]
  const recentLogs = sortedLogs.slice(0, 3)
  const serviceSnapshots = useMemo(
    () => vehicles.reduce<Record<string, ReturnType<typeof resolveVehicleServiceSnapshot>>>((acc, vehicle) => {
      acc[vehicle.id] = resolveVehicleServiceSnapshot(vehicle, latestLogsByVehicle[vehicle.id])
      return acc
    }, {}),
    [latestLogsByVehicle, vehicles],
  )
  const activeVehicleSnapshot = activeVehicle ? serviceSnapshots[activeVehicle.id] ?? null : null
  const activeLatestLog = activeVehicle
    ? latestLogsByVehicle[activeVehicle.id] ?? lastLog ?? null
    : null
  const isNewUser = Boolean(
    user?.created_at && new Date(user.created_at).getTime() > Date.now() - 86400000,
  )

  const name = firstName(user?.user_metadata?.full_name ?? user?.email)
  const userInitials = initials(user?.user_metadata?.full_name ?? user?.email)
  const handleAddVehicle = () => {
    haptics.medium()
    navigate('/add-car')
  }

  useEffect(() => {
    if (!activeVehicle) {
      setAnimatedMileage(0)
      return
    }

    const targetMileage = activeVehicle.currentMileage
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

    if (hasAnimatedMileageRef.current || targetMileage >= 500000) {
      setAnimatedMileage(targetMileage)
      return
    }

    hasAnimatedMileageRef.current = true
    setAnimatedMileage(0)

    let animationFrameId = 0
    const durationMs = 900
    const startTime = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1)
      const easedProgress = easeOutExpo(progress)
      setAnimatedMileage(Math.round(targetMileage * easedProgress))

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(tick)
      }
    }

    animationFrameId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [activeVehicle])

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
    if (isNewUser) {
      return <OnboardingEmptyState onAddMazda={handleAddVehicle} />
    }

    return <GarageEmptyState onAddVehicle={handleAddVehicle} />
  }

  return (
    <div className="space-y-5 pb-4 animate-enter-up">
      {/* ── Header ── */}
      <header className="-mx-4 -mt-6 mb-4 bg-mz-black text-white" role="banner">
        <div className="relative px-4 pb-5 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
          <button
            type="button"
            aria-label="Open settings"
            className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+14px)] flex h-9 w-9 items-center justify-center rounded-full bg-mz-red text-[13px] font-semibold text-white"
            style={{ fontFamily: 'Outfit, sans-serif' }}
            onClick={() => navigate('/settings')}
          >
            {userInitials}
          </button>

          <div className="flex items-center gap-2">
            <MazdaLogo variant="icon" theme="dark" size="sm" />
            <p
              className="text-[11px] uppercase text-white/45"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
            >
              {greeting()}
            </p>
          </div>
          <h1
            className="mt-1 text-[22px] font-semibold text-white"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {name ? `Hello, ${name}` : 'Hello'}
          </h1>
          <p className="mt-1 text-xs text-white/40" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} tracked
          </p>

          {activeVehicle ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs">
              <Fuel className="h-3.5 w-3.5" />
              <span className="capitalize">
                {activeVehicle.fuelType} service profile · {activeVehicle.registration}
              </span>
            </div>
          ) : null}
        </div>
      </header>

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
                serviceSnapshot={serviceSnapshots[v.id]}
                onEditMileage={async (veh) => {
                  const raw = window.prompt(`New mileage for ${veh.model}:`, String(veh.currentMileage))
                  const km = parseInt(raw ?? '', 10)
                  if (!isNaN(km) && km > veh.currentMileage) {
                    await updateVehicle(veh.id, { currentMileage: km })
                    const refreshedVehicles = await fetchVehicles()
                    await fetchLatestLogs(refreshedVehicles.map((vehicle) => vehicle.id))
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
                  i === activeIdx ? 'w-5 bg-mz-red' : 'w-1.5 bg-mz-gray-300'
                }`}
                onClick={() => setActiveIdx(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Stats grid ── */}
      {activeVehicle && (
        <div className="mb-[14px] grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[0.5px] border-black/6 bg-mz-white p-3">
            <p
              className="mb-1 text-[10px] font-medium uppercase text-mz-gray-500"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.06em' }}
            >
              Vehicles
            </p>
            <p className="text-[22px] font-semibold leading-none text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {vehicles.length}
            </p>
            <p className="mt-[2px] text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
              In garage
            </p>
          </div>

          <div className="rounded-xl border border-[0.5px] border-black/6 bg-mz-white p-3">
            <p
              className="mb-1 text-[10px] font-medium uppercase text-mz-gray-500"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.06em' }}
            >
              Current Mileage
            </p>
            <p className="text-[22px] font-semibold leading-none text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {animatedMileage.toLocaleString()}
            </p>
            <p className="mt-[2px] text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
              km
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-[0.5px] border-black/6 bg-mz-white p-3 text-left"
            onClick={() => navigate(`/schedule/${activeVehicle.id}`)}
          >
            <p
              className="mb-1 text-[10px] font-medium uppercase text-mz-gray-500"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.06em' }}
            >
              Next Service
            </p>
            <p
              className="text-[22px] font-semibold leading-none"
              style={{
                fontFamily: 'Outfit, sans-serif',
                color:
                  activeVehicleSnapshot?.status === 'overdue'
                    ? '#8F1326'
                    : activeVehicleSnapshot?.status === 'due-soon'
                      ? '#B88A37'
                      : '#111010',
              }}
            >
              {activeVehicleSnapshot?.kmRemaining != null
                ? `${Math.max(activeVehicleSnapshot.kmRemaining, 0).toLocaleString()}`
                : '--'}
            </p>
            <p className="mt-[2px] text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {activeVehicleSnapshot?.kmRemaining != null ? 'km remaining' : 'No service history'}
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-[0.5px] border-black/6 bg-mz-white p-3 text-left"
            onClick={() => navigate(`/service/${activeVehicle.id}`)}
          >
            <p
              className="mb-1 text-[10px] font-medium uppercase text-mz-gray-500"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.06em' }}
            >
              Last Service
            </p>
            <p className="truncate text-[22px] font-semibold capitalize leading-none text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {activeLatestLog ? activeLatestLog.serviceType.replace('_', ' ') : '--'}
            </p>
            <p className="mt-[2px] text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {activeLatestLog
                ? new Date(activeLatestLog.serviceDate).toLocaleDateString('en-KE', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'No logs yet'}
            </p>
          </button>
        </div>
      )}

      {/* ── Quick actions ── */}
      {activeVehicle && (
        <div className="mb-[14px] grid grid-cols-4 gap-2">
          {[
            {
              label: 'Log Service',
              icon: Plus,
              to: `/log-service/${activeVehicle.id}`,
              iconBg: 'bg-mz-red-light',
              iconText: 'text-mz-red',
            },
            {
              label: 'Find Garage',
              icon: Navigation,
              to: '/map',
              iconBg: 'bg-[#EDF2FF]',
              iconText: 'text-[#1A3A9B]',
            },
            {
              label: 'Schedule',
              icon: Calendar,
              to: `/schedule/${activeVehicle.id}`,
              iconBg: 'bg-mz-gold-light',
              iconText: 'text-[#7A5C14]',
            },
            {
              label: 'History',
              icon: Activity,
              to: `/service/${activeVehicle.id}`,
              iconBg: 'bg-[#EAFAF0]',
              iconText: 'text-[#1A6B33]',
            },
          ].map(({ label, icon: Icon, to, iconBg, iconText }, idx) => (
            <button
              key={label}
              type="button"
              className="stagger-enter flex cursor-pointer flex-col items-center gap-[5px] rounded-xl border border-[0.5px] border-black/6 bg-white px-1 pb-2 pt-2.5 transition-transform duration-100 active:scale-[0.96]"
              style={{ '--stagger-delay': `${80 + idx * 60}ms` } as CSSProperties}
              onClick={() => {
                haptics.tap()
                navigate(to)
              }}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className={`h-4.5 w-4.5 ${iconText}`} />
              </span>
              <span
                className="text-center text-[9px] font-semibold uppercase leading-[1.3] text-mz-gray-700"
                style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.04em' }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Recent service logs ── */}
      {activeVehicle && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2
              className="mb-2 text-[10px] font-semibold uppercase text-mz-red"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
            >
              Recent Services
            </h2>
            <button
              type="button"
              className="text-[11px] font-medium text-mz-red hover:underline"
              style={{ fontFamily: 'Outfit, sans-serif' }}
              onClick={() => navigate(`/service/${activeVehicle.id}`)}
            >
              See all →
            </button>
          </div>
          {lLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-mz-gray-300 py-8 text-center">
              <p className="text-[13px] text-mz-gray-500">No services logged yet.</p>
              <button
                type="button"
                className="mt-2 text-[12px] text-mz-red hover:underline"
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
                  className="stagger-enter flex items-center justify-between rounded-xl border border-[0.5px] border-black/6 bg-white px-4 py-3 transition active:scale-[0.995]"
                  style={{ '--stagger-delay': `${140 + idx * 55}ms` } as CSSProperties}
                  onClick={() => navigate(`/service/${activeVehicle.id}`)}
                >
                  <div>
                    <p className="text-[13px] font-medium capitalize text-mz-black">
                      {log.serviceType.replace('_', ' ')}
                    </p>
                    <p className="text-[11px] text-mz-gray-500">
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
                          ? 'bg-mz-red-light text-mz-red'
                          : 'bg-mz-gray-100 text-mz-gray-500'
                      }
                    >
                      {log.serviceType === 'major' ? 'Major' : 'Minor'}
                    </Badge>
                    {typeof log.serviceCost === 'number' && (
                      <p className="text-[11px] text-mz-gray-500">
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-mz-gray-300 py-3 text-[13px] text-mz-gray-500 hover:border-mz-gray-500 hover:text-mz-black"
        onClick={() => navigate('/add-car')}
      >
        <Plus className="h-4 w-4" />
        Add another vehicle
      </button>
    </div>
  )
}
