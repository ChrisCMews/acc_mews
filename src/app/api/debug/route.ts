import { NextRequest, NextResponse } from "next/server";
import { MewsCallConfig } from "@/lib/mews/client";

const DEFAULT_BASE_URL = process.env.MEWS_API_BASE_URL ?? "https://api.mews-demo.com";
const DEFAULT_CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN ?? "";
const DEFAULT_ACCESS_TOKEN = process.env.MEWS_ACCESS_TOKEN ?? "";
const CLIENT_NAME = process.env.MEWS_CLIENT_NAME ?? "MewsAccountingExport/1.0";

function extractConfig(req: NextRequest): MewsCallConfig {
  return {
    clientToken: req.headers.get("x-mews-client-token") ?? undefined,
    accessToken: req.headers.get("x-mews-access-token") ?? undefined,
    baseUrl: req.headers.get("x-mews-base-url") ?? undefined,
  };
}

async function fetchRaw(path: string, body: Record<string, unknown>, config: MewsCallConfig) {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const clientToken = config.clientToken || DEFAULT_CLIENT_TOKEN;
  const accessToken = config.accessToken || DEFAULT_ACCESS_TOKEN;
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ClientToken: clientToken, AccessToken: accessToken, Client: CLIENT_NAME, ...body }),
    });
    const json = await res.json();
    return { status: res.status, ok: res.ok, body: json };
  } catch (err) {
    return { status: 0, ok: false, error: String(err) };
  }
}

export async function GET(req: NextRequest) {
  const config = extractConfig(req);
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;

  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const interval = { StartUtc: ninetyDaysAgo.toISOString(), EndUtc: now.toISOString() };

  // Fetch 3 raw bills — return the full object so we can see every field
  const billsRaw = await fetchRaw(
    "/api/connector/v1/bills/getAll",
    { IssuedUtc: interval, Limitation: { Count: 3 } },
    config
  );

  // Also try UpdatedUtc filter in case IssuedUtc returns nothing
  const billsUpdated = await fetchRaw(
    "/api/connector/v1/bills/getAll",
    { UpdatedUtc: interval, Limitation: { Count: 3 } },
    config
  );

  // Fetch 3 raw payments
  const paymentsRaw = await fetchRaw(
    "/api/connector/v1/payments/getAll",
    { ChargedUtc: interval, Limitation: { Count: 3 } },
    config
  );

  return NextResponse.json({
    activeBaseUrl: baseUrl,
    usingCustomCredentials: !!(config.clientToken || config.accessToken),
    dateRange: interval,
    // Full raw objects so we can inspect every field
    billsByIssuedUtc: billsRaw.ok
      ? { count: billsRaw.body?.Bills?.length ?? 0, sample: billsRaw.body?.Bills ?? [] }
      : billsRaw,
    billsByUpdatedUtc: billsUpdated.ok
      ? { count: billsUpdated.body?.Bills?.length ?? 0, sample: billsUpdated.body?.Bills ?? [] }
      : billsUpdated,
    payments: paymentsRaw.ok
      ? { count: paymentsRaw.body?.Payments?.length ?? 0, sample: paymentsRaw.body?.Payments ?? [] }
      : paymentsRaw,
  });
}
