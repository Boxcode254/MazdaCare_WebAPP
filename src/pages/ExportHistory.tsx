import { useMemo, useState } from 'react'
import { FileText, Grid3X3, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { haptics } from '@/lib/haptics'
import { exportToCSV, exportToPDF, shareToWhatsApp } from '@/lib/export'
import type { DateRange } from '@/lib/export'
import type { ServiceLog, Vehicle } from '@/types'

type ExportMode = 'pdf' | 'csv' | 'whatsapp'

interface ExportHistoryProps {
  vehicle: Vehicle
  logs: ServiceLog[]
}

export function ExportHistory({ vehicle, logs }: ExportHistoryProps) {
  const today = new Date()
  const [mode, setMode] = useState<ExportMode>('pdf')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [includeCosts, setIncludeCosts] = useState(true)
  const [includeGarage, setIncludeGarage] = useState(true)
  const [includeOil, setIncludeOil] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(true)

  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!from || !to) return undefined
    return { from: new Date(from), to: new Date(to) }
  }, [from, to])

  const filteredLogs = useMemo(() => {
    if (!dateRange) {
      return logs
    }

    const fromTs = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime()
    const toTs = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime()

    return logs.filter((log) => {
      const value = new Date(log.serviceDate)
      if (Number.isNaN(value.getTime())) return false
      const ts = new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
      return ts >= fromTs && ts <= toTs
    })
  }, [dateRange, logs])

  const includes = {
    costs: includeCosts,
    garage: includeGarage,
    oil: includeOil,
    notes: includeNotes,
  }

  const runExport = (selectedMode: ExportMode) => {
    haptics.medium()
    if (selectedMode === 'pdf') {
      exportToPDF(vehicle, filteredLogs, dateRange, includes)
      return
    }
    if (selectedMode === 'csv') {
      exportToCSV(vehicle, filteredLogs, dateRange, includes)
      return
    }
    shareToWhatsApp(vehicle, filteredLogs, dateRange)
  }

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h2
          className="text-[#111010]"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '28px',
            fontStyle: 'italic',
            fontWeight: 300,
            lineHeight: 1.1,
          }}
        >
          Export history
        </h2>
        <p className="mt-1 text-[11px] text-black/45" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {vehicle.registration} · {filteredLogs.length} records
        </p>
      </div>

      <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        {[
          {
            key: 'pdf' as const,
            title: 'PDF Report',
            description: 'Formatted report — for dealers, warranty claims',
            actionLabel: 'Export PDF',
            icon: <FileText className="h-4 w-4 text-[#9B1B30]" />,
            iconBg: '#F5E8EA',
          },
          {
            key: 'csv' as const,
            title: 'CSV Data',
            description: 'Raw data — for insurance, personal records',
            actionLabel: 'Export CSV',
            icon: <Grid3X3 className="h-4 w-4 text-[#1A3A6B]" />,
            iconBg: '#EDF5FF',
          },
          {
            key: 'whatsapp' as const,
            title: 'Share via WhatsApp',
            description: 'Quick text summary — share with your mechanic',
            actionLabel: 'Share',
            icon: <MessageCircle className="h-4 w-4 text-[#1F8A4C]" />,
            iconBg: '#EAFAF0',
          },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#FCFAFA] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: item.iconBg }}>
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>{item.title}</p>
              <p className="text-[11px] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>{item.description}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode(item.key)
                runExport(item.key)
              }}
              className="text-[12px] font-semibold text-[#9B1B30]"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {item.actionLabel}
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Date range
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>From</label>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] outline-none focus:border-[#9B1B30]"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>To</label>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] outline-none focus:border-[#9B1B30]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            {
              label: 'All time',
              onClick: () => {
                setFrom('')
                setTo('')
              },
            },
            {
              label: 'This year',
              onClick: () => {
                setFrom(`${today.getFullYear()}-01-01`)
                setTo(`${today.getFullYear()}-12-31`)
              },
            },
            {
              label: 'Last 6 months',
              onClick: () => {
                const start = new Date(today.getFullYear(), today.getMonth() - 5, 1)
                const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                setFrom(start.toISOString().slice(0, 10))
                setTo(end.toISOString().slice(0, 10))
              },
            },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.onClick}
              className="rounded-full bg-[#F0ECEC] px-3 py-1.5 text-[11px] font-semibold text-[#3D3536]"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Include in export
        </p>

        {[
          { label: 'Costs', checked: includeCosts, onCheckedChange: setIncludeCosts },
          { label: 'Garage details', checked: includeGarage, onCheckedChange: setIncludeGarage },
          { label: 'Oil brands', checked: includeOil, onCheckedChange: setIncludeOil },
          { label: 'Notes', checked: includeNotes, onCheckedChange: setIncludeNotes },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <p className="text-[13px] text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>{row.label}</p>
            <Switch checked={row.checked} onCheckedChange={row.onCheckedChange} />
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={() => runExport(mode)}
        className="h-11 w-full rounded-xl bg-[#9B1B30] text-white hover:bg-[#841629]"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        Generate export
      </Button>
    </div>
  )
}