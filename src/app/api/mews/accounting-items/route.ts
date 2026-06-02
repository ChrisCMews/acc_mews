import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllLedgerEntries,
  fetchAllLedgerBalances,
  fetchAllOutletItems,
  fetchAccountsForIds,
  fetchAllOutlets,
  fetchAllAccountingCategories,
  MewsApiError,
  MewsCallConfig,
} from "@/lib/mews/client";
import { mapLedgerEntries, mapLedgerBalances, mapOutletItems } from "@/lib/mews/mappers";
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
    // Fetch ledger entries, balances, outlet items, and reference data in parallel
    const [rawLedgerEntries, rawBalances, outletResult, rawOutlets, rawCategories] =
      await Promise.all([
        fetchAllLedgerEntries({ StartUtc: startUtc, EndUtc: endUtc }, config),
        fetchAllLedgerBalances({ StartUtc: startUtc, EndUtc: endUtc }, config),
        fetchAllOutletItems({ StartUtc: startUtc, EndUtc: endUtc }, config).catch((err) => {
          if (err instanceof MewsApiError && (err.status === 404 || err.status === 400)) {
            return { outletItems: [], outletBills: [] };
          }
          throw err;
        }),
        fetchAllOutlets(config),
        fetchAllAccountingCategories(config),
      ]);

    // Fetch accounts only for the IDs present in ledger entries
    const accountIds = rawLedgerEntries
      .map((e) => e.AccountId)
      .filter((id): id is string => !!id);
    const rawAccounts = await fetchAccountsForIds(accountIds, config);

    const items = [
      ...mapLedgerEntries(rawLedgerEntries, rawAccounts, rawCategories),
      ...mapOutletItems(outletResult.outletItems, outletResult.outletBills, rawOutlets, rawCategories),
    ];
    const balances = mapLedgerBalances(rawBalances, rawAccounts);

    return NextResponse.json({ items, balances });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err instanceof MewsApiError ? err.details : undefined;
    return NextResponse.json({ error: message, details }, { status: 502 });
  }
}
