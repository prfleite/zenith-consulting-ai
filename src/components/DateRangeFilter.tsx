import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangeFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onChangeStart: (date: Date | undefined) => void;
  onChangeEnd: (date: Date | undefined) => void;
  onClear: () => void;
}

export function DateRangeFilter({ startDate, endDate, onChangeStart, onChangeEnd, onClear }: DateRangeFilterProps) {
  const hasFilter = startDate || endDate;

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs h-9", !startDate && "text-muted-foreground")}>
            <CalendarIcon className="w-3.5 h-3.5" />
            {startDate ? format(startDate, "dd/MM/yyyy") : "De"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={startDate} onSelect={onChangeStart} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs h-9", !endDate && "text-muted-foreground")}>
            <CalendarIcon className="w-3.5 h-3.5" />
            {endDate ? format(endDate, "dd/MM/yyyy") : "Até"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={endDate} onSelect={onChangeEnd} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
      {hasFilter && (
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={onClear}>
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
