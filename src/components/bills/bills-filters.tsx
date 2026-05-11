"use client";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRange } from "react-day-picker";
import type { BillState } from "@/types/app";

interface BillsFiltersProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  statusFilter: BillState | "All";
  onStatusChange: (status: BillState | "All") => void;
  onApply: () => void;
}

export function BillsFilters({
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusChange,
  onApply,
}: BillsFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 p-4 border-b bg-white">
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">Date Range</p>
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>
      <div className="w-36">
        <p className="mb-1 text-xs font-medium text-slate-600">Status</p>
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusChange(v as BillState | "All")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onApply}>Apply Filters</Button>
    </div>
  );
}
