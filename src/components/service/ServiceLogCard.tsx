
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit2, Trash2, FileDown } from "lucide-react";
import type { ServiceLog } from '@/types';

export const ServiceLogCard = ({ log }: { log: ServiceLog }) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="group relative bg-card border rounded-xl p-4 transition-all duration-200 lg:hover:border-[#A31526]/30 lg:hover:shadow-md lg:cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm lg:text-base group-hover:text-[#A31526] transition-colors">
                {log.serviceType}
              </h4>
              <p className="text-xs text-muted-foreground">{log.serviceDate}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-sm">{log.mileageAtService.toLocaleString()} km</p>
              <p className="text-[10px] text-muted-foreground uppercase">{log.garageName}</p>
            </div>
          </div>
          {/* Subtle indicator for desktop hover */}
          <div className="hidden lg:block absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-muted-foreground italic">Right-click for options</span>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => {/* handleEdit */}} className="gap-2">
          <Edit2 className="h-4 w-4" /> Edit Entry
        </ContextMenuItem>
        <ContextMenuItem onClick={() => {/* handleExport */}} className="gap-2">
          <FileDown className="h-4 w-4" /> Export PDF
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => {/* handleDelete */}} 
          className="gap-2 text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
