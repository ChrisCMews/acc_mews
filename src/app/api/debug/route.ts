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
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const interval = { StartUtc: thirtyDaysAgo.toISOString(), EndUtc: now.toISOString() };

  // Fetch 2 raw bills to inspect the actual amount field structure
  const billsRaw = await fetchRaw(
    "/api/connector/v1/bills/getAll",
    { IssuedUtc: interval, Limitation: { Count: 2 } },
    config
  );

  // Fetch 2 raw payments for the same reason
  const paymentsRaw = await fetchRaw(
    "/api/connector/v1/payments/getAll",
    { ChargedUtc: interval, Limitation: { Count: 2 } },
    config
  );

  // Summarise what amount fields are present on each bill
  const billSample = billsRaw.ok
    ? (billsRaw.body?.Bills ?? []).map((b: Record<string, unknown>) => ({
        Id: b.Id,
        State: b.State,
        Type: b.Type,
        TaxedNet: b.TaxedNet,
        TaxedTax: b.TaxedTax,
        TaxedGross: b.TaxedGross,
        // capture any other amount-like fields
        Revenue: b.Revenue,
        Amount: b.Amount,
      }))
    : billsRaw;

  const paymentSample = paymentsRaw.ok
    ? (paymentsRaw.body?.Payments ?? []).map((p: Record<string, unknown>) => ({
        Id: p.Id,
        State: p.State,
        Amount: p.Amount,
        Currency: p.Currency,
      }))
    : paymentsRaw;

  return NextResponse.json({
    activeBaseUrl: baseUrl,
    usingCustomCredentials: !!(config.clientToken || config.accessToken),
    billSample,
    paymentSample,
  });
}
