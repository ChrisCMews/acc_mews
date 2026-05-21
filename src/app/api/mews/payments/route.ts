import { NextRequest, NextResponse } from "next/server";
import { fetchAllPayments, fetchAccountsForIds, MewsApiError, MewsCallConfig } from "@/lib/mews/client";
import { mapPayments } from "@/lib/mews/mappers";
import { defaultStartUtc, defaultEndUtc } from "@/lib/utils";

function extractConfig(req: NextRequest): MewsCallConfig {
  return {
    clientToken: req.headers.get("x-mews-client-token") ?? undefined,
    accessToken: req.headers.get("x-mews-access-token") ?? undefined,
    baseUrl: req.headers.get("x-mews-base-url") ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startUtc = searchParams.get("startUtc") ?? defaultStartUtc();
  const endUtc = searchParams.get("endUtc") ?? defaultEndUtc();
  const config = extractConfig(req);

  try {
    const rawPayments = await fetchAllPayments({ StartUtc: startUtc, EndUtc: endUtc }, config);
    const accountIds = rawPayments.map((p) => p.AccountId);
    const rawAccounts = await fetchAccountsForIds(accountIds, config);
    const payments = mapPayments(rawPayments, rawAccounts);
    return NextResponse.json({ payments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err instanceof MewsApiError ? err.details : undefined;
    return NextResponse.json({ error: message, details }, { status: 502 });
  }
}
