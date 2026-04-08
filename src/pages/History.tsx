import { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LayoutGrid, List as ListIcon, FileDown } from 'lucide-react';
import { ServiceLogCard } from '@/components/service/ServiceLogCard';
import { ServiceHistoryTable } from '@/components/service/ServiceHistoryTable';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useServiceLogs } from '@/hooks/useServiceLogs';

export const HistoryPage = () => {
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { logs = [] } = useServiceLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service History</h1>
          <p className="text-sm text-muted-foreground">Detailed records for all vehicles</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop-only View Toggle */}
          {isDesktop && (
            <Tabs value={view} onValueChange={(v) => setView(v as 'cards' | 'table')}>
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="cards" className="gap-2">
                  <LayoutGrid className="h-4 w-4" /> Cards
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2">
                  <ListIcon className="h-4 w-4" /> Table
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <FileDown className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Responsive Rendering Logic */}
      {view === 'table' && isDesktop ? (
        <ServiceHistoryTable logs={logs} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {logs.map((log) => (
            <ServiceLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
};
