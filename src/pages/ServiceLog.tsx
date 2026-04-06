import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
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
    <section className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Service History</h1>
        <p className="text-sm text-slate-600">Vehicle ID: {vehicleId}</p>
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="minor">Minor</TabsTrigger>
          <TabsTrigger value="major">Major</TabsTrigger>
          <TabsTrigger value="oil">Oil</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? <p className="text-sm text-slate-500">Loading service logs...</p> : null}

      {!loading && filteredLogs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          No logs found for this filter yet.
        </p>
      ) : null}

      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <ServiceLogCard key={log.id} log={log} />
        ))}
      </div>

      <Link
        to={`/log-service/${vehicleId}`}
        className="fixed bottom-24 right-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-mazda-red text-white shadow-lg"
        aria-label="Add service log"
      >
        <Plus className="h-5 w-5" />
      </Link>
    </section>
  )
}
