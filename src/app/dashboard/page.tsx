"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { CredentialsCard } from "@/components/dashboard/credentials-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useLedger } from "@/hooks/use-ledger";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  Receipt,
  CreditCard,
  Wallet,
  Users,
  Building,
  type LucideIcon,
} from "lucide-react";
import type { LedgerActivity } from "@/types/app";

const _d = new Date(); _d.setDate(_d.getDate() - 10);
const today = _d.toISOString().slice(0, 10);

const LEDGER_CONFIG: {
  key: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "Revenue", label: "Total Revenue", icon: TrendingUp },
  { key: "NonRevenue", label: "Total Non-Revenue", icon: Receipt },
  { key: "Payment", label: "Payments", icon: CreditCard },
  { key: "Deposit", label: "Deposit Ledger", icon: Wallet },
  { key: "Guest", label: "Guest Ledger", icon: Users },
  { key: "City", label: "City Ledger", icon: Building },
];

function getActivity(activities: LedgerActivity[], ledgerType: string): LedgerActivity | undefined {
  return activities.find((a) => a.ledgerType === ledgerType);
}

export default function DashboardPage() {
  const [date, setDate] = useState<string>(today);
  const { report, error, isLoading } = useLedger(date);

  return (
    <div>
      <Header
        title="Ledger Activity Report"
        description="Daily ledger balances and activity from Mews"
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="ledger-date" className="text-sm text-muted-foreground">
              Date
            </label>
            <input
              id="ledger-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        }
      />
      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEDGER_CONFIG.map(({ key, label, icon: Icon }) => {
            const activity = report ? getActivity(report.activities, key) : undefined;
            const currency = activity?.currency ?? report?.currency ?? "EUR";
            return (
              <StatsCard
                key={key}
                title={label}
                value={activity ? formatCurrency(activity.grossActivity, currency) : isLoading ? "" : formatCurrency(0, currency)}
                icon={Icon}
                isLoading={isLoading}
              />
            );
          })}
        </div>

        <CredentialsCard />
      </div>
    </div>
  );
}
