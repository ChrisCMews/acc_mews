import { useMemo } from "react";
import { useBills } from "./use-bills";
import { usePayments } from "./use-payments";
import type { DashboardStats } from "@/types/app";

export function useDashboardStats(startUtc: string, endUtc: string): {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
} {
  const { bills, isLoading: billsLoading, error: billsError } = useBills({ startUtc, endUtc });
  const { payments, isLoading: paymentsLoading, error: paymentsError } = usePayments({ startUtc, endUtc });

  const stats = useMemo((): DashboardStats | null => {
    if (billsLoading || paymentsLoading) return null;

    const allCurrencies = [
      ...bills.map((b) => b.currency),
      ...payments.map((p) => p.currency),
    ].filter(Boolean);
    const currencyFreq = new Map<string, number>();
    for (const c of allCurrencies) currencyFreq.set(c, (currencyFreq.get(c) ?? 0) + 1);
    const primaryCurrency =
      Array.from(currencyFreq.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";
    const currencies = new Set(allCurrencies.filter(Boolean));

    const totalRevenue = bills
      .filter((b) => b.currency === primaryCurrency)
      .reduce((sum, b) => sum + b.grossAmount, 0);

    const totalPayments = payments
      .filter((p) => p.currency === primaryCurrency && p.state === "Charged")
      .reduce((sum, p) => sum + p.amount, 0);

    const outstandingBalance = bills
      .filter((b) => b.state === "Open" && b.currency === primaryCurrency)
      .reduce((sum, b) => sum + b.grossAmount, 0);

    return {
      totalRevenue,
      totalPayments,
      outstandingBalance,
      billCount: bills.length,
      currency: primaryCurrency,
      multiCurrency: currencies.size > 1,
    };
  }, [bills, payments, billsLoading, paymentsLoading]);

  return {
    stats,
    isLoading: billsLoading || paymentsLoading,
    error: billsError ?? paymentsError,
  };
}
