import { useMemo, useState } from 'react'
import type { ServiceLog } from '@/types'

type PeriodKey = 'all' | 'current' | 'previous'

interface CostAnalyticsProps {
  serviceLogs: ServiceLog[]
  vehicleId: string
}

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

const monthLabelFormatter = new Intl.DateTimeFormat('en', { month: 'short' })

function roundAmount(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0)
}

function formatKes(value: number) {
  const rounded = roundAmount(value)
  if (rounded >= 1000) {
    return `KES ${Math.round(rounded / 1000)}K`
  }

  const formatted = currencyFormatter.format(rounded)
  return formatted.replace('Ksh', 'KES')
}

function serviceTypeLabel(value: ServiceLog['serviceType']) {
  switch (value) {
    case 'oil_change':
      return 'Oil change'
    case 'tyre_rotation':
      return 'Tyre rotation'
    case 'brake_service':
      return 'Brake service'
    default:
      return value.charAt(0).toUpperCase() + value.slice(1)
  }
}

function getTypePillStyle(type: ServiceLog['serviceType']) {
  if (type === 'major') {
    return { background: '#F5E8EA', color: '#9B1B30' }
  }

  if (type === 'minor') {
    return { background: '#F0ECEC', color: '#6B6163' }
  }

  if (type === 'oil_change') {
    return { background: '#F8EECF', color: '#9A6B00' }
  }

  return { background: '#EEF0F2', color: '#5F6670' }
}

function toOrdinal(rank: number) {
  if (rank === 1) return '1st'
  if (rank === 2) return '2nd'
  if (rank === 3) return '3rd'
  return `${rank}th`
}

export function CostAnalytics({ serviceLogs, vehicleId }: CostAnalyticsProps) {
  const currentYear = new Date().getFullYear()
  const [period, setPeriod] = useState<PeriodKey>('current')
  const [showAllMonths, setShowAllMonths] = useState(false)

  const periodLabel = period === 'current' ? 'This year' : period === 'previous' ? 'Prev year' : 'All time'

  const periodLogs = useMemo(() => {
    const filteredByVehicle = serviceLogs.filter((log) => log.vehicleId === vehicleId)
    return filteredByVehicle.filter((log) => {
      const logYear = new Date(log.serviceDate).getFullYear()
      if (period === 'current') return logYear === currentYear
      if (period === 'previous') return logYear === currentYear - 1
      return true
    })
  }, [currentYear, period, serviceLogs, vehicleId])

  const totalSpent = useMemo(
    () => roundAmount(periodLogs.reduce((sum, log) => sum + roundAmount(log.serviceCost ?? 0), 0)),
    [periodLogs]
  )

  const servicesCount = periodLogs.length
  const avgCost = servicesCount > 0 ? roundAmount(totalSpent / servicesCount) : 0

  const compactValue = (value: number) => {
    const rounded = roundAmount(value)
    if (rounded >= 1000) return `${Math.round(rounded / 1000)}K`
    return `${rounded}`
  }

  const monthlyRows = useMemo(() => {
    const now = new Date()
    const monthKeys: Array<{ key: string; date: Date; label: string; isFuture: boolean }> = []

    if (period === 'all') {
      for (let offset = 11; offset >= 0; offset -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthKeys.push({
          key,
          date,
          label: monthLabelFormatter.format(date),
          isFuture: date.getTime() > new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
        })
      }
    } else {
      const selectedYear = period === 'current' ? currentYear : currentYear - 1
      for (let month = 0; month < 12; month += 1) {
        const date = new Date(selectedYear, month, 1)
        const key = `${selectedYear}-${String(month + 1).padStart(2, '0')}`
        monthKeys.push({
          key,
          date,
          label: monthLabelFormatter.format(date),
          isFuture: selectedYear === currentYear && month > now.getMonth(),
        })
      }
    }

    const monthSpend = new Map<string, number>()
    for (const log of periodLogs) {
      const date = new Date(log.serviceDate)
      if (Number.isNaN(date.getTime())) continue
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthSpend.set(key, roundAmount((monthSpend.get(key) ?? 0) + roundAmount(log.serviceCost ?? 0)))
    }

    const maxSpend = Math.max(...monthKeys.map((row) => monthSpend.get(row.key) ?? 0), 0)

    return monthKeys.map((row) => {
      const amount = roundAmount(monthSpend.get(row.key) ?? 0)
      const widthPercent = maxSpend > 0 ? Math.round((amount / maxSpend) * 100) : 0
      const barColor = amount > 0 && !row.isFuture ? '#9B1B30' : '#C4BABB'
      return {
        ...row,
        amount,
        widthPercent,
        barColor,
      }
    })
  }, [currentYear, period, periodLogs])

  // Only show last 4 months by default, show all if toggled
  const visibleMonthlyRows = showAllMonths ? monthlyRows : monthlyRows.slice(-4)

  const byServiceType = useMemo(() => {
    const totals = new Map<ServiceLog['serviceType'], number>()
    for (const log of periodLogs) {
      totals.set(log.serviceType, roundAmount((totals.get(log.serviceType) ?? 0) + roundAmount(log.serviceCost ?? 0)))
    }

    return Array.from(totals.entries())
      .filter(([, amount]) => amount > 0)
      .map(([serviceType, amount]) => ({
        serviceType,
        amount,
        percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [periodLogs, totalSpent])

  const topGarages = useMemo(() => {
    const garageMap = new Map<string, { visits: number; total: number }>()
    for (const log of periodLogs) {
      const name = (log.garageName ?? '').trim()
      if (!name) continue

      const current = garageMap.get(name) ?? { visits: 0, total: 0 }
      garageMap.set(name, {
        visits: current.visits + 1,
        total: roundAmount(current.total + roundAmount(log.serviceCost ?? 0)),
      })
    }

    return Array.from(garageMap.entries())
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
  }, [periodLogs])

  return (
    <div className="space-y-4 pb-2">
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {[
            { key: 'current' as const, label: `${currentYear}` },
            { key: 'previous' as const, label: `${currentYear - 1}` },
            { key: 'all' as const, label: 'All time' },
          ].map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setPeriod(chip.key)}
              className="rounded-full px-4 py-2 text-[12px] font-semibold"
              style={{
                background: period === chip.key ? '#9B1B30' : '#F0ECEC',
                color: period === chip.key ? '#FFFFFF' : '#3D3536',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B1B30]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Total spent
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#F0ECEC] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6B6163]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {periodLabel}
            </p>
            <p className="mt-1 text-[32px] leading-none font-bold text-[#9B1B30]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {compactValue(totalSpent)}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#6B6163]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              KES
            </p>
          </div>

          <div className="rounded-xl bg-[#F0ECEC] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6B6163]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Services
            </p>
            <p className="mt-1 text-[32px] leading-none font-bold text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {Math.round(servicesCount)}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#6B6163]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              logged
            </p>
          </div>

          <div className="rounded-xl bg-[#F0ECEC] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6B6163]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Avg cost
            </p>
            <p className="mt-1 text-[26px] leading-none font-bold text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {compactValue(avgCost)}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#6B6163]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              KES
            </p>
          </div>
        </div>
      </div>


      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B1B30]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Monthly breakdown (KES)
        </p>
        <div className="mt-3 space-y-2.5">
          {visibleMonthlyRows.map((row) => {
            const showInside = row.widthPercent >= 35 && row.amount > 0
            return (
              <div key={row.key} className="flex items-center gap-2">
                <span className="w-7 text-[10px] text-[#6B6163]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {row.label}
                </span>
                <div className="relative h-[20px] flex-1 overflow-hidden rounded-[4px] bg-[#EEE8E9]">
                  <div
                    className="h-full rounded-[4px]"
                    style={{ width: `${row.widthPercent}%`, background: row.barColor }}
                  >
                    {showInside ? (
                      <span
                        className="ml-2 inline-flex h-full items-center text-[10px] font-semibold text-white"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {formatKes(row.amount)}
                      </span>
                    ) : null}
                  </div>
                </div>
                {!showInside ? (
                  <span className="min-w-[58px] text-right text-[10px] text-[#6B6163]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {row.amount > 0 ? formatKes(row.amount) : '—'}
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
        {monthlyRows.length > 4 && !showAllMonths && (
          <button
            type="button"
            className="mt-3 w-full rounded-lg border border-[#9B1B30] py-1.5 text-[13px] font-semibold text-[#9B1B30] hover:bg-[#F5E8EA] transition"
            style={{ fontFamily: 'Outfit, sans-serif' }}
            onClick={() => setShowAllMonths(true)}
          >
            Show More
          </button>
        )}
        {showAllMonths && monthlyRows.length > 4 && (
          <button
            type="button"
            className="mt-2 w-full rounded-lg border border-[#9B1B30] py-1.5 text-[13px] font-semibold text-[#9B1B30] hover:bg-[#F5E8EA] transition"
            style={{ fontFamily: 'Outfit, sans-serif' }}
            onClick={() => setShowAllMonths(false)}
          >
            Show Less
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9B1B30]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          By service type
        </p>
        <div className="mt-3 space-y-2.5">
          {byServiceType.length === 0 ? (
            <p className="text-[12px] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
              No spend data for this period.
            </p>
          ) : (
            byServiceType.map((row) => (
              <div key={row.serviceType} className="flex items-center gap-3">
                <p className="flex-1 text-[13px] font-medium text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {serviceTypeLabel(row.serviceType)}
                </p>
                <p className="text-[13px] font-semibold text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {formatKes(row.amount)}
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ ...getTypePillStyle(row.serviceType), fontFamily: 'Outfit, sans-serif' }}
                >
                  {row.percent}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {topGarages.length > 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Top garages by spend
          </p>
          <div className="mt-3 space-y-2.5">
            {topGarages.map((garage, index) => (
              <div key={garage.name} className="flex items-center gap-3">
                <span className="w-7 text-[10px] font-semibold text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {toOrdinal(index + 1)}
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {garage.name}
                  </p>
                  <p className="text-[11px] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {garage.visits} visit{garage.visits === 1 ? '' : 's'}
                  </p>
                </div>
                <p className="text-[12px] font-semibold text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {formatKes(garage.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}