import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllAccountingItems,
  fetchAllAccounts,
  fetchAllServices,
  fetchAllOutlets,
  fetchAllAccountingCategories,
  MewsApiError,
} from "@/lib/mews/client";
import { mapAccountingItems } from "@/lib/mews/mappers";
import { defaultStartUtc, defaultEndUtc } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startUtc = searchParams.get("startUtc") ?? defaultStartUtc();
  const endUtc = searchParams.get("endUtc") ?? defaultEndUtc();

  try {
    const [rawItems, rawAccounts, rawServices, rawOutlets, rawCategories] = await Promise.all([
      fetchAllAccountingItems({ StartUtc: startUtc, EndUtc: endUtc }),
      fetchAllAccounts(),
      fetchAllServices(),
      fetchAllOutlets(),
      fetchAllAccountingCategories(),
    ]);
    const items = mapAccountingItems(rawItems, rawAccounts, rawServices, rawOutlets, rawCategories);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err instanceof MewsApiError ? err.details : undefined;
    return NextResponse.json({ error: message, details }, { status: 502 });
  }
}
