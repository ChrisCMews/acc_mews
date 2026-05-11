"use client";

import { useState } from "react";
import { startOfMonth, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Header } from "@/components/layout/header";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { AccountingItemsTable } from "@/components/accounting-items/accounting-items-table";
import { useAccountingItems } from "@/hooks/use-accounting-items";

export default function AccountingItemsPage() {
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

  const { items, isLoading, error } = useAccountingItems(applied);

  const totalNet = items.reduce((s, i) => s + i.netAmount, 0);
  const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);

  return (
    <div>
      <Header
        title="Accounting Items"
        description={`${items.length} item${items.length !== 1 ? "s" : ""} — Net: ${totalNet.toFixed(2)} | Tax: ${totalTax.toFixed(2)}`}
      />
      <div className="flex flex-wrap items-end gap-3 border-b bg-white p-4">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-600">Consumed Date Range</p>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
        <Button onClick={applyFilters}>Apply Filters</Button>
      </div>
      {error && (
        <div className="m-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <AccountingItemsTable items={items} isLoading={isLoading} />
    </div>
  );
}
