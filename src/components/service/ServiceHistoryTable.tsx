import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit2, Trash2, FileDown, MoreHorizontal } from "lucide-react";

export const ServiceHistoryTable = ({ logs }: { logs: any[] }) => {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Service Type</TableHead>
            <TableHead>Garage</TableHead>
            <TableHead className="text-right">Mileage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <ContextMenu key={log.id}>
              <ContextMenuTrigger asChild>
                <TableRow className="group cursor-default hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-xs">{log.serviceDate}</TableCell>
                  <TableCell>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                      {log.registration || log.vehicleRegistration || log.vehicleId}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">{log.serviceType}</TableCell>
                  <TableCell className="text-muted-foreground">{log.garageName}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {log.mileageAtService.toLocaleString()} km
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TableCell>
                </TableRow>
              </ContextMenuTrigger>

              <ContextMenuContent className="w-48">
                <ContextMenuItem className="gap-2"><Edit2 className="h-4 w-4" /> Edit</ContextMenuItem>
                <ContextMenuItem className="gap-2"><FileDown className="h-4 w-4" /> Export PDF</ContextMenuItem>
                <ContextMenuItem className="gap-2 text-red-600"><Trash2 className="h-4 w-4" /> Delete</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
