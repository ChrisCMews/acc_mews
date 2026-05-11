"use client";

import { useState } from "react";
import { startOfMonth, endOfDay } from "date-fns";
import { DollarSign, CreditCard, AlertCircle, FileText } from "lucide-react";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { formatCurrency } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });

  const startUtc = dateRange?.from?.toISOString() ?? startOfMonth(new Date()).toISOString();
  const endUtc = dateRange?.to?.toISOString() ?? endOfDay(new Date()).toISOString();

  const { stats, isLoading, error } = useDashboardStats(startUtc, endUtc);

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of Mews accounting data"
        actions={<DateRangePicker value={dateRange} onChange={setDateRange} />}
      />
      <div className="p-6">
        {error && (
          <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {stats?.multiCurrency && (
          <div className="mb-4 rounded-md border bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Multiple currencies detected. Metrics show {stats.currency} only.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={stats ? formatCurrency(stats.totalRevenue, stats.currency) : "—"}
            subtitle="Gross billed amount"
            icon={DollarSign}
            isLoading={isLoading}
          />
          <StatsCard
            title="Total Payments"
            value={stats ? formatCurrency(stats.totalPayments, stats.currency) : "—"}
            subtitle="Charged payments"
            icon={CreditCard}
            isLoading={isLoading}
          />
          <StatsCard
            title="Outstanding Balance"
            value={stats ? formatCurrency(stats.outstandingBalance, stats.currency) : "—"}
            subtitle="Open bills"
            icon={AlertCircle}
            isLoading={isLoading}
          />
          <StatsCard
            title="Total Bills"
            value={stats ? String(stats.billCount) : "—"}
            subtitle="All bill types"
            icon={FileText}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
