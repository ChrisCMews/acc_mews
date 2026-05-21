"use client";

import { useState } from "react";
import { startOfMonth, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Header } from "@/components/layout/header";
import { BillsFilters } from "@/components/bills/bills-filters";
import { BillsTable } from "@/components/bills/bills-table";
import { useBills } from "@/hooks/use-bills";
import type { BillState } from "@/types/app";

export default function BillsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });
  const [statusFilter, setStatusFilter] = useState<BillState | "All">("All");
  const [applied, setApplied] = useState({
    startUtc: startOfMonth(new Date()).toISOString(),
    endUtc: endOfDay(new Date()).toISOString(),
    state: undefined as BillState | "All" | undefined,
  });

  function applyFilters() {
    setApplied({
      startUtc: dateRange?.from?.toISOString() ?? applied.startUtc,
      endUtc: dateRange?.to?.toISOString() ?? applied.endUtc,
      state: statusFilter,
    });
  }

  const { bills, isLoading, error } = useBills({
    startUtc: applied.startUtc,
    endUtc: applied.endUtc,
    state: applied.state,
  });

  return (
    <div>
      <Header
        title="Bills"
        description={`${bills.length} bill${bills.length !== 1 ? "s" : ""} found`}
      />
      <BillsFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onApply={applyFilters}
      />
      {error && (
        <div className="m-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <BillsTable bills={bills} isLoading={isLoading} />
    </div>
  );
}
