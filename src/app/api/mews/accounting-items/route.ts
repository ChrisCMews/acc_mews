import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllOrderItems,
  fetchAllOutletItems,
  fetchAccountsForIds,
  fetchAllServices,
  fetchAllOutlets,
  fetchAllAccountingCategories,
  MewsApiError,
  MewsCallConfig,
} from "@/lib/mews/client";
import { mapOrderItems, mapOutletItems } from "@/lib/mews/mappers";
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
    // Step 1: fetch primary data in parallel
    const [rawOrderItems, outletResult, rawServices, rawOutlets, rawCategories] =
      await Promise.all([
        fetchAllOrderItems({ StartUtc: startUtc, EndUtc: endUtc }, config),
        fetchAllOutletItems({ StartUtc: startUtc, EndUtc: endUtc }, config).catch((err) => {
          if (err instanceof MewsApiError && (err.status === 404 || err.status === 400)) {
            return { outletItems: [], outletBills: [] };
          }
          throw err;
        }),
        fetchAllServices(config),
        fetchAllOutlets(config),
        fetchAllAccountingCategories(config),
      ]);

    // Step 2: fetch accounts only for the IDs we actually have
    const accountIds = rawOrderItems.map((i) => i.AccountId);
    const rawAccounts = await fetchAccountsForIds(accountIds, config);

    const items = [
      ...mapOrderItems(rawOrderItems, rawAccounts, rawServices, rawCategories),
      ...mapOutletItems(outletResult.outletItems, outletResult.outletBills, rawOutlets, rawCategories),
    ];
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err instanceof MewsApiError ? err.details : undefined;
    return NextResponse.json({ error: message, details }, { status: 502 });
  }
}
