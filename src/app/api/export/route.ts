import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllBills,
  fetchAllPayments,
  fetchAllLedgerEntries,
  fetchAllOutletItems,
  fetchAccountsForIds,
  fetchAllOutlets,
  fetchAllAccountingCategories,
  MewsApiError,
  MewsCallConfig,
} from "@/lib/mews/client";
import { mapBills, mapPayments, mapLedgerEntries, mapOutletItems } from "@/lib/mews/mappers";
import { generateCsv } from "@/lib/csv/generate";
import { billsCsvSchema, paymentsCsvSchema, accountingItemsCsvSchema } from "@/lib/csv/schemas";
import type { ExportType } from "@/types/app";

function extractConfig(req: NextRequest): MewsCallConfig {
  return {
    clientToken: req.headers.get("x-mews-client-token") ?? undefined,
    accessToken: req.headers.get("x-mews-access-token") ?? undefined,
    baseUrl: req.headers.get("x-mews-base-url") ?? undefined,
  };
}

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

  const config = extractConfig(req);

  try {
    let csv = "";
    const dateLabel = startUtc.slice(0, 10);

    if (type === "bills") {
      const rawBills = await fetchAllBills({ StartUtc: startUtc, EndUtc: endUtc }, config);
      const rawAccounts = await fetchAccountsForIds(rawBills.map((b) => b.AccountId), config);
      csv = generateCsv(mapBills(rawBills, rawAccounts), billsCsvSchema);
    } else if (type === "payments") {
      const rawPayments = await fetchAllPayments({ StartUtc: startUtc, EndUtc: endUtc }, config);
      const rawAccounts = await fetchAccountsForIds(rawPayments.map((p) => p.AccountId), config);
      csv = generateCsv(mapPayments(rawPayments, rawAccounts), paymentsCsvSchema);
    } else if (type === "accounting-items") {
      const [rawLedgerEntries, outletResult, rawOutlets, rawCategories] =
        await Promise.all([
          fetchAllLedgerEntries({ StartUtc: startUtc, EndUtc: endUtc }, config),
          fetchAllOutletItems({ StartUtc: startUtc, EndUtc: endUtc }, config).catch((err) => {
            if (err instanceof MewsApiError && (err.status === 404 || err.status === 400)) {
              return { outletItems: [], outletBills: [] };
            }
            throw err;
          }),
          fetchAllOutlets(config),
          fetchAllAccountingCategories(config),
        ]);

      const accountIds = rawLedgerEntries
        .map((e) => e.AccountId)
        .filter((id): id is string => !!id);
      const rawAccounts = await fetchAccountsForIds(accountIds, config);
      const items = [
        ...mapLedgerEntries(rawLedgerEntries, rawAccounts, rawCategories),
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
