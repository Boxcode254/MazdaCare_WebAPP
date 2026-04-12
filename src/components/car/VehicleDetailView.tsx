import {
  Calendar,
  ChevronLeft,
  Droplets,
  Fuel,
  Gauge,
  Wrench,
} from 'lucide-react'
import { resolveVehicleServiceSnapshot, type VehicleServiceSnapshot } from '@/lib/serviceState'
import { getVehicleImage } from '@/lib/vehicleDisplay'
import type { ServiceLog, Vehicle } from '@/types'

interface VehicleDetailViewProps {
  vehicle: Vehicle
  logs: ServiceLog[]
  serviceSnapshot?: VehicleServiceSnapshot
  isDesktopPane?: boolean
  onBack?: () => void
  onOpenMileageSheet?: () => void
  onLogService?: () => void
  onOpenManual?: () => void
  onSeeAllHistory?: () => void
}

function formatServiceType(serviceType: ServiceLog['serviceType']) {
  return serviceType.replace(/_/g, ' ')
}

export function VehicleDetailView({
  vehicle,
  logs,
  serviceSnapshot,
  isDesktopPane = false,
  onBack,
  onOpenMileageSheet,
  onLogService,
  onOpenManual,
  onSeeAllHistory,
}: VehicleDetailViewProps) {
  const vehicleLogs = logs.filter((log) => log.vehicleId === vehicle.id)
  const lastLog = vehicleLogs[0] ?? null
  const snapshot = serviceSnapshot ?? resolveVehicleServiceSnapshot(vehicle, lastLog)
  const nextServiceMileage = snapshot.dueMileage
  const kmRemaining = snapshot.kmRemaining != null ? Math.max(snapshot.kmRemaining, 0) : null
  const serviceTone =
    snapshot.status === 'overdue' ? '#9B1B30' : snapshot.status === 'due-soon' ? '#B88A37' : '#2C6A4A'
  const lastServiceLabel = lastLog
    ? new Date(lastLog.serviceDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'No service logged'
  const dueSubtext = nextServiceMileage != null
    ? `Next at ${nextServiceMileage.toLocaleString()} km`
    : snapshot.dueDate
      ? `Due by ${snapshot.dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
      : 'Log a service to unlock exact reminders'
  const recentActivities = vehicleLogs.slice(0, 3)
  const metricCards = [
    {
      label: 'Service Due',
      value:
        snapshot.status === 'overdue'
          ? 'Overdue'
          : kmRemaining != null
            ? `${kmRemaining.toLocaleString()} km`
            : 'Track service',
      subtext: dueSubtext,
      icon: Wrench,
      accent: serviceTone,
    },
    {
      label: 'Current Mileage',
      value: `${vehicle.currentMileage.toLocaleString()} km`,
      subtext: 'Latest recorded reading',
      icon: Gauge,
      accent: '#7A6E70',
    },
    {
      label: 'Engine',
      value: vehicle.engineSize,
      subtext: `${vehicle.fuelType} engine`,
      icon: Fuel,
      accent: '#7A6E70',
    },
    {
      label: 'Last Service',
      value: lastServiceLabel,
      subtext: lastLog ? formatServiceType(lastLog.serviceType) : 'Waiting for first log',
      icon: Calendar,
      accent: '#7A6E70',
    },
  ]

  return (
    <div className={`${isDesktopPane ? 'min-h-full bg-transparent pb-0' : 'min-h-full bg-[#F5F1F1] pb-28'}`}>
      <div className={`sticky top-0 z-20 grid h-14 grid-cols-[40px_1fr_40px] items-center border-b border-black/5 bg-[#FDFAFA] px-4 ${isDesktopPane ? 'lg:rounded-t-[32px]' : ''}`}>
        <div className="flex items-center justify-start">
          {onBack && !isDesktopPane ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#3D3035] transition hover:bg-[#F5F1F1]"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="text-center">
          <h1
            className="text-[28px] leading-none text-[#0F0A0B]"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontWeight: 500,
            }}
          >
            Mazda {vehicle.model}
          </h1>
          <p className="mt-1 text-[11px] font-medium text-[#7A6E70]">
            {vehicle.year} {vehicle.make} · {vehicle.registration}
          </p>
        </div>

        <div className="flex items-center justify-end">
          {snapshot.status !== 'healthy' ? (
            <span
              className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ backgroundColor: `${serviceTone}16`, color: serviceTone }}
            >
              {snapshot.status === 'overdue' ? 'Needs attention' : 'Due soon'}
            </span>
          ) : null}
        </div>
      </div>

      <div className={`${isDesktopPane ? 'px-6 pb-6 pt-6' : 'px-4 pt-4'}`}>
        <section className="rounded-[28px] border border-black/5 bg-[#FDFAFA] p-4 shadow-[0_18px_40px_rgba(15,10,11,0.06)]">
          <div className="overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(163,21,38,0.12),rgba(255,255,255,0)_60%),linear-gradient(180deg,#fff,#f7f1f1)] px-4 py-5">
            <div className="mx-auto flex h-44 max-w-sm items-center justify-center">
              <img
                src={getVehicleImage(vehicle.model)}
                alt={`Mazda ${vehicle.model}`}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {metricCards.map(({ label, value, subtext, icon: Icon, accent }) => (
              <div
                key={label}
                className="rounded-[16px] border border-black/5 bg-white p-3.5 shadow-[0_8px_20px_rgba(15,10,11,0.03)]"
              >
                <div className="mb-2 flex items-center gap-2 text-[#7A6E70]">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${accent}14` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">
                    {label}
                  </span>
                </div>
                <p className="text-[14px] font-bold text-[#0F0A0B]">{value}</p>
                <p className="mt-1 text-[11px] text-[#7A6E70]">{subtext}</p>
              </div>
            ))}
          </div>

          {onOpenMileageSheet || onLogService || onOpenManual ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {onOpenMileageSheet ? (
                <button
                  type="button"
                  onClick={onOpenMileageSheet}
                  className="flex-1 rounded-xl bg-[#A31526] px-4 py-3 text-[13px] font-semibold text-white"
                >
                  Update mileage
                </button>
              ) : null}
              {onLogService ? (
                <button
                  type="button"
                  onClick={onLogService}
                  className="flex-1 rounded-xl border border-[#E3CDD1] bg-white px-4 py-3 text-[13px] font-semibold text-[#A31526]"
                >
                  Log service
                </button>
              ) : null}
              {onOpenManual ? (
                <button
                  type="button"
                  onClick={onOpenManual}
                  className="rounded-xl border border-black/8 bg-white px-4 py-3 text-[13px] font-semibold text-[#3D3035]"
                >
                  Manual
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-[20px] border border-black/5 bg-[#FDFAFA] p-4 shadow-[0_14px_30px_rgba(15,10,11,0.04)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold text-[#0F0A0B]">Recent Activities</h2>
              <p className="mt-1 text-[11px] text-[#7A6E70]">
                Latest service actions for this vehicle
              </p>
            </div>
            {onSeeAllHistory ? (
              <button
                type="button"
                onClick={onSeeAllHistory}
                className="text-[11px] font-semibold text-[#A31526]"
              >
                See all
              </button>
            ) : null}
          </div>

          {recentActivities.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[#C9C0C1] bg-white px-4 py-5 text-center text-[13px] text-[#7A6E70]">
              No recent activities yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentActivities.map((log) => (
                <div
                  key={log.id}
                  className="rounded-[16px] border border-black/5 bg-white px-4 py-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[#0F0A0B] capitalize">
                        {formatServiceType(log.serviceType)}
                      </p>
                      <p className="mt-1 text-[12px] text-[#7A6E70]">
                        {log.notes || log.garageName || 'Service activity logged'}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F1F1] px-2.5 py-1 text-[10px] font-semibold text-[#7A6E70]">
                      <Droplets className="h-3 w-3" />
                      {new Date(log.serviceDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}