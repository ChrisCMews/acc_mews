import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllOrderItems,
  fetchAllOutletItems,
  fetchAllAccounts,
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
    const [rawOrderItems, outletResult, rawAccounts, rawServices, rawOutlets, rawCategories] =
      await Promise.all([
        fetchAllOrderItems({ StartUtc: startUtc, EndUtc: endUtc }),
        fetchAllOutletItems({ StartUtc: startUtc, EndUtc: endUtc }).catch((err) => {
          // Outlet items are optional — return empty if endpoint unavailable
          if (err instanceof MewsApiError && (err.status === 404 || err.status === 400)) {
            return { outletItems: [], outletBills: [] };
          }
          throw err;
        }),
        fetchAllAccounts(),
        fetchAllServices(),
        fetchAllOutlets(),
        fetchAllAccountingCategories(),
      ]);

    const orderItems = mapOrderItems(rawOrderItems, rawAccounts, rawServices, rawCategories);
    const outletItems = mapOutletItems(
      outletResult.outletItems,
      outletResult.outletBills,
      rawOutlets,
      rawCategories
    );

    const items = [...orderItems, ...outletItems];
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err instanceof MewsApiError ? err.details : undefined;
    return NextResponse.json({ error: message, details }, { status: 502 });
  }
}
