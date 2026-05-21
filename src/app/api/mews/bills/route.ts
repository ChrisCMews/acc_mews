import { NextRequest, NextResponse } from "next/server";
import { fetchAllBills, fetchAccountsForIds, MewsApiError, MewsCallConfig } from "@/lib/mews/client";
import { mapBills } from "@/lib/mews/mappers";
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
  const state = searchParams.get("state") ?? undefined;
  const config = extractConfig(req);

  try {
    const rawBills = await fetchAllBills({ StartUtc: startUtc, EndUtc: endUtc, State: state }, config);
    const accountIds = rawBills.map((b) => b.AccountId);
    const rawAccounts = await fetchAccountsForIds(accountIds, config);
    const bills = mapBills(rawBills, rawAccounts);
    return NextResponse.json({ bills });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err instanceof MewsApiError ? err.details : undefined;
    return NextResponse.json({ error: message, details }, { status: 502 });
  }
}
