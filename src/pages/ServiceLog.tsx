import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { ServiceLogCard } from '@/components/service/ServiceLogCard'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useServiceLogs } from '@/hooks/useServiceLogs'

type FilterTab = 'all' | 'minor' | 'major' | 'oil'

export function ServiceLog() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const { logs, fetchLogs, loading } = useServiceLogs()
  const [filter, setFilter] = useState<FilterTab>('all')

  useEffect(() => {
    if (!vehicleId) {
      return
    }

    void fetchLogs(vehicleId)
  }, [fetchLogs, vehicleId])

  const filteredLogs = useMemo(() => {
    if (filter === 'all') {
      return logs
    }

    if (filter === 'oil') {
      return logs.filter((log) => log.serviceType === 'oil_change')
    }

    return logs.filter((log) => log.serviceType === filter)
  }, [filter, logs])

  if (!vehicleId) {
    return <p className="text-sm text-slate-600">No vehicle selected.</p>
  }

  return (
    <section className="space-y-4 pb-20 animate-enter-up">
      <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Service History</h1>
            <p className="text-sm text-slate-600">Vehicle ID: {vehicleId}</p>
          </div>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-mazda-red">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {filteredLogs.length} records in this view
        </div>
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterTab)}>
        <TabsList className="grid h-11 w-full grid-cols-4 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="minor">Minor</TabsTrigger>
          <TabsTrigger value="major">Major</TabsTrigger>
          <TabsTrigger value="oil">Oil</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? <p className="text-sm text-slate-500">Loading service logs...</p> : null}

      {!loading && filteredLogs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          No logs found for this filter yet.
        </p>
      ) : null}

      <div className="space-y-3">
        {filteredLogs.map((log, idx) => (
          <div
            key={log.id}
            className="stagger-enter"
            style={{ '--stagger-delay': `${60 + idx * 45}ms` } as CSSProperties}
          >
            <ServiceLogCard log={log} />
          </div>
        ))}
      </div>

      <Link
        to={`/log-service/${vehicleId}`}
        className="fixed bottom-24 right-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-mazda-red text-white shadow-[0_10px_25px_rgba(192,0,0,0.35)]"
        aria-label="Add service log"
      >
        <Plus className="h-5 w-5" />
      </Link>
    </section>
  )
}
