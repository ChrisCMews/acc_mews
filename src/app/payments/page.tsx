"use client";

import { useState } from "react";
import { startOfMonth, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Header } from "@/components/layout/header";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { PaymentsTable } from "@/components/payments/payments-table";
import { usePayments } from "@/hooks/use-payments";

export default function PaymentsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });
  const [applied, setApplied] = useState({
    startUtc: startOfMonth(new Date()).toISOString(),
    endUtc: endOfDay(new Date()).toISOString(),
  });

  function applyFilters() {
    setApplied({
      startUtc: dateRange?.from?.toISOString() ?? applied.startUtc,
      endUtc: dateRange?.to?.toISOString() ?? applied.endUtc,
    });
  }

  const { payments, isLoading, error } = usePayments(applied);

  return (
    <div>
      <Header
        title="Payments"
        description={`${payments.length} payment${payments.length !== 1 ? "s" : ""} found`}
      />
      <div className="flex flex-wrap items-end gap-3 border-b bg-white p-4">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-600">Date Range</p>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
        <Button onClick={applyFilters}>Apply Filters</Button>
      </div>
      {error && (
        <div className="m-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <PaymentsTable payments={payments} isLoading={isLoading} />
    </div>
  );
}
