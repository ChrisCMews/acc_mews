import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllBills,
  fetchAllPayments,
  fetchAllOrderItems,
  fetchAllOutletItems,
  fetchAccountsForIds,
  fetchAllServices,
  fetchAllOutlets,
  fetchAllAccountingCategories,
  MewsApiError,
} from "@/lib/mews/client";
import { mapBills, mapPayments, mapOrderItems, mapOutletItems } from "@/lib/mews/mappers";
import { generateCsv } from "@/lib/csv/generate";
import { billsCsvSchema, paymentsCsvSchema, accountingItemsCsvSchema } from "@/lib/csv/schemas";
import type { ExportType } from "@/types/app";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, startUtc, endUtc } = body as {
    type: ExportType;
    startUtc: string;
    endUtc: string;
  };

  if (!type || !startUtc || !endUtc) {
    return NextResponse.json(
      { error: "Missing required fields: type, startUtc, endUtc" },
      { status: 400 }
    );
  }

  try {
    let csv = "";
    const dateLabel = startUtc.slice(0, 10);

    if (type === "bills") {
      const rawBills = await fetchAllBills({ StartUtc: startUtc, EndUtc: endUtc });
      const rawAccounts = await fetchAccountsForIds(rawBills.map((b) => b.AccountId));
      csv = generateCsv(mapBills(rawBills, rawAccounts), billsCsvSchema);
    } else if (type === "payments") {
      const rawPayments = await fetchAllPayments({ StartUtc: startUtc, EndUtc: endUtc });
      const rawAccounts = await fetchAccountsForIds(rawPayments.map((p) => p.AccountId));
      csv = generateCsv(mapPayments(rawPayments, rawAccounts), paymentsCsvSchema);
    } else if (type === "accounting-items") {
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

      const rawAccounts = await fetchAccountsForIds(rawOrderItems.map((i) => i.AccountId));
      const items = [
        ...mapOrderItems(rawOrderItems, rawAccounts, rawServices, rawCategories),
        ...mapOutletItems(outletResult.outletItems, outletResult.outletBills, rawOutlets, rawCategories),
      ];
      csv = generateCsv(items, accountingItemsCsvSchema);
    } else {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mews-${type}-${dateLabel}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err instanceof MewsApiError ? err.details : undefined;
    return NextResponse.json({ error: message, details }, { status: 502 });
  }
}
