import { addMonths, differenceInCalendarDays, isValid, parseISO } from 'date-fns'
import type { ServiceAlert, ServiceLog, Vehicle } from '@/types'

const REMINDER_THRESHOLD_OPTIONS = [250, 500, 1000, 2000] as const
const DEFAULT_REMINDER_THRESHOLD = 500

export type VehicleServiceStatus = 'no-history' | 'healthy' | 'due-soon' | 'overdue'
export type VehicleServiceSource = 'log' | 'alert' | 'none'

export interface VehicleServiceSnapshot {
  status: VehicleServiceStatus
  source: VehicleServiceSource
  latestLog: ServiceLog | null
  dueMileage: number | null
  dueDate: Date | null
  kmRemaining: number | null
  daysRemaining: number | null
  fractionUsed: number | null
  progressPercent: number
  hasActiveAlert: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function readReminderThreshold() {
  if (typeof window === 'undefined') {
    return DEFAULT_REMINDER_THRESHOLD
  }

  const rawValue = Number(window.localStorage.getItem('mc_reminder_km_threshold'))
  return REMINDER_THRESHOLD_OPTIONS.includes(rawValue as (typeof REMINDER_THRESHOLD_OPTIONS)[number])
    ? rawValue
    : DEFAULT_REMINDER_THRESHOLD
}

function toDate(value?: string) {
  if (!value) {
    return null
  }

  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

export function calculateServiceDueDate(log: ServiceLog) {
  const monthsToAdd = log.serviceType === 'major' ? 6 : 3
  return addMonths(parseISO(log.serviceDate), monthsToAdd)
}

export function getNextServiceMileage(vehicle: Vehicle, latestLog: ServiceLog) {
  if (latestLog.nextServiceMileage > 0) {
    return latestLog.nextServiceMileage
  }

  return latestLog.mileageAtService + vehicle.mileageInterval
}

export function buildLatestServiceLogMap(logs: ServiceLog[]) {
  return logs.reduce<Record<string, ServiceLog>>((map, log) => {
    if (!map[log.vehicleId]) {
      map[log.vehicleId] = log
    }

    return map
  }, {})
}

export function resolveVehicleServiceSnapshot(
  vehicle: Vehicle,
  latestLog?: ServiceLog | null,
  alert?: ServiceAlert | null,
): VehicleServiceSnapshot {
  const resolvedLatestLog = latestLog ?? null
  const dueMileage = resolvedLatestLog ? getNextServiceMileage(vehicle, resolvedLatestLog) : null
  const dueDateFromLog = resolvedLatestLog ? calculateServiceDueDate(resolvedLatestLog) : null
  const dueDateFromAlert = toDate(alert?.dueDate)
  const dueDate = dueDateFromAlert ?? dueDateFromLog
  const kmRemaining = dueMileage == null ? null : dueMileage - vehicle.currentMileage
  const daysRemaining = dueDate ? differenceInCalendarDays(dueDate, new Date()) : null
  const hasActiveAlert = Boolean(alert && !alert.isDismissed)
  const reminderThreshold = readReminderThreshold()

  let status: VehicleServiceStatus = 'no-history'
  if (resolvedLatestLog || hasActiveAlert) {
    const overdueByMileage = kmRemaining != null && kmRemaining <= 0
    const overdueByDate = daysRemaining != null && daysRemaining <= 0
    const dueSoonByMileage = kmRemaining != null && kmRemaining <= reminderThreshold
    const dueSoonByDate = daysRemaining != null && daysRemaining <= 14

    if (overdueByMileage || overdueByDate) {
      status = 'overdue'
    } else if (hasActiveAlert || dueSoonByMileage || dueSoonByDate) {
      status = 'due-soon'
    } else {
      status = 'healthy'
    }
  }

  const fractionUsed = resolvedLatestLog && dueMileage != null
    ? clamp(
        (vehicle.currentMileage - resolvedLatestLog.mileageAtService) /
          Math.max(dueMileage - resolvedLatestLog.mileageAtService, 1),
        0,
        1,
      )
    : null

  const progressPercent = fractionUsed == null
    ? status === 'overdue'
      ? 100
      : status === 'due-soon'
        ? 82
        : status === 'healthy'
          ? 24
          : 8
    : Math.min(100, Math.max(8, Math.round(fractionUsed * 100)))

  return {
    status,
    source: resolvedLatestLog ? 'log' : hasActiveAlert ? 'alert' : 'none',
    latestLog: resolvedLatestLog,
    dueMileage,
    dueDate,
    kmRemaining,
    daysRemaining,
    fractionUsed,
    progressPercent,
    hasActiveAlert,
  }
}