import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllBills,
  fetchAllPayments,
  fetchAllAccountingItems,
  fetchAllAccounts,
  fetchAllServices,
  fetchAllOutlets,
  fetchAllAccountingCategories,
} from "@/lib/mews/client";
import { mapBills, mapPayments, mapAccountingItems } from "@/lib/mews/mappers";
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
    return NextResponse.json({ error: "Missing required fields: type, startUtc, endUtc" }, { status: 400 });
  }

  try {
    let csv = "";
    const dateLabel = startUtc.slice(0, 10);

    if (type === "bills") {
      const [rawBills, rawAccounts] = await Promise.all([
        fetchAllBills({ StartUtc: startUtc, EndUtc: endUtc }),
        fetchAllAccounts(),
      ]);
      csv = generateCsv(mapBills(rawBills, rawAccounts), billsCsvSchema);
    } else if (type === "payments") {
      const [rawPayments, rawAccounts] = await Promise.all([
        fetchAllPayments({ StartUtc: startUtc, EndUtc: endUtc }),
        fetchAllAccounts(),
      ]);
      csv = generateCsv(mapPayments(rawPayments, rawAccounts), paymentsCsvSchema);
    } else if (type === "accounting-items") {
      const [rawItems, rawAccounts, rawServices, rawOutlets, rawCategories] = await Promise.all([
        fetchAllAccountingItems({ StartUtc: startUtc, EndUtc: endUtc }),
        fetchAllAccounts(),
        fetchAllServices(),
        fetchAllOutlets(),
        fetchAllAccountingCategories(),
      ]);
      csv = generateCsv(
        mapAccountingItems(rawItems, rawAccounts, rawServices, rawOutlets, rawCategories),
        accountingItemsCsvSchema
      );
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
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
