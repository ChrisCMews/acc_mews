import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllOrderItems,
  fetchAllOutletItems,
  fetchAccountsForIds,
  fetchAllServices,
  fetchAllOutlets,
  fetchAllAccountingCategories,
  MewsApiError,
} from "@/lib/mews/client";
import { mapOrderItems, mapOutletItems } from "@/lib/mews/mappers";
import { defaultStartUtc, defaultEndUtc } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startUtc = searchParams.get("startUtc") ?? defaultStartUtc();
  const endUtc = searchParams.get("endUtc") ?? defaultEndUtc();

  try {
    // Step 1: fetch primary data in parallel
    const [rawOrderItems, outletResult, rawServices, rawOutlets, rawCategories] =
      await Promise.all([
        fetchAllOrderItems({ StartUtc: startUtc, EndUtc: endUtc }),
        fetchAllOutletItems({ StartUtc: startUtc, EndUtc: endUtc }).catch((err) => {
          if (err instanceof MewsApiError && (err.status === 404 || err.status === 400)) {
            return { outletItems: [], outletBills: [] };
          }
          throw err;
        }),
        fetchAllServices(),
        fetchAllOutlets(),
        fetchAllAccountingCategories(),
      ]);

    // Step 2: fetch accounts only for the IDs we actually have
    const accountIds = rawOrderItems.map((i) => i.AccountId);
    const rawAccounts = await fetchAccountsForIds(accountIds);

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
