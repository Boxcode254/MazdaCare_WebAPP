import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ServiceEmptyState } from '@/components/layout/EmptyState'
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
    return <p className="text-[13px] text-mz-gray-500">No vehicle selected.</p>
  }

  return (
    <section className="flex flex-col flex-1 gap-4 pb-4 animate-enter-up">
      <PageHeader
        title="Service History"
        subtitle={`Vehicle ID: ${vehicleId}`}
        backTo="/"
        action={<ClipboardList className="h-5 w-5 text-white/60" />}
      />

      <div className="rounded-xl border border-[0.5px] border-black/6 bg-white px-3 py-2 text-[12px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {filteredLogs.length} records in this view
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterTab)}>
        <TabsList className="grid h-11 w-full grid-cols-4 rounded-xl bg-mz-gray-100 p-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="minor">Minor</TabsTrigger>
          <TabsTrigger value="major">Major</TabsTrigger>
          <TabsTrigger value="oil">Oil</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[60px] rounded-[12px]" />
          ))}
        </div>
      ) : null}

      {!loading && logs.length === 0 ? (
        <ServiceEmptyState vehicleId={vehicleId} />
      ) : null}

      {!loading && logs.length > 0 && filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <ClipboardList className="h-7 w-7 text-mz-gray-400" />
          <p className="mt-2 text-[13px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
            No {filter === 'all' ? '' : filter} records found.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {filteredLogs.map((log, idx) => (
          <div
            key={log.id}
            className="service-log-stagger-enter"
            style={{ '--stagger-delay': `${idx * 50}ms` } as CSSProperties}
          >
            <ServiceLogCard log={log} />
          </div>
        ))}
      </div>

      <Link
        to={`/log-service/${vehicleId}`}
        className="mt-auto self-end inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-mz-red text-white"
        aria-label="Add service log"
      >
        <Plus strokeWidth={2.5} className="h-[22px] w-[22px]" />
      </Link>
    </section>
  )
}
