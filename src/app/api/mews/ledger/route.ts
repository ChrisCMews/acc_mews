import { NextRequest, NextResponse } from "next/server";
import { fetchAllLedgerBalances, MewsCallConfig, MewsApiError } from "@/lib/mews/client";
import type { LedgerActivity, LedgerReport } from "@/types/app";

export const maxDuration = 60;

function extractConfig(req: NextRequest): MewsCallConfig {
  return {
    clientToken: req.headers.get("x-mews-client-token") ?? undefined,
    accessToken: req.headers.get("x-mews-access-token") ?? undefined,
    baseUrl: req.headers.get("x-mews-base-url") ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const _d = new Date(); _d.setDate(_d.getDate() - 10);
  const date = searchParams.get("date") ?? _d.toISOString().slice(0, 10);
  const config = extractConfig(req);

  try {
    const { balances, failedTypes } = await fetchAllLedgerBalances({ Start: date, End: date }, config);

    const byType = new Map<string, { grossActivity: number; netActivity: number; currency: string }>();

    for (const b of balances) {
      const grossActivity = b.ClosingBalance.GrossValue - b.OpeningBalance.GrossValue;
      const netActivity = b.ClosingBalance.NetValue - b.OpeningBalance.NetValue;
      const currency = b.ClosingBalance.Currency;
      // Mews UI merges Tax into NonRevenue — do the same here
      const key = b.LedgerType === "Tax" ? "NonRevenue" : b.LedgerType;
      const existing = byType.get(key);
      if (existing) {
        existing.grossActivity += grossActivity;
        existing.netActivity += netActivity;
      } else {
        byType.set(key, { grossActivity, netActivity, currency });
      }
    }

    const activities: LedgerActivity[] = Array.from(byType.entries()).map(([ledgerType, vals]) => ({
      ledgerType,
      grossActivity: vals.grossActivity,
      netActivity: vals.netActivity,
      taxActivity: vals.grossActivity - vals.netActivity,
      currency: vals.currency,
    }));

    const currency = activities[0]?.currency ?? "EUR";
    const netBalance = activities.reduce((sum, a) => sum + a.grossActivity, 0);
    const isBalanced = Math.abs(netBalance) < 0.01;

    const report: LedgerReport = { date, activities, netBalance, currency, isBalanced };
    return NextResponse.json({ report, failedTypes: failedTypes.length ? failedTypes : undefined });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err instanceof MewsApiError ? err.details : undefined;
    return NextResponse.json({ error: message, details }, { status: 502 });
  }
}
