import { NextRequest, NextResponse } from "next/server";
import { fetchAllPayments, fetchAllAccounts } from "@/lib/mews/client";
import { mapPayments } from "@/lib/mews/mappers";
import { defaultStartUtc, defaultEndUtc } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startUtc = searchParams.get("startUtc") ?? defaultStartUtc();
  const endUtc = searchParams.get("endUtc") ?? defaultEndUtc();

  try {
    const [rawPayments, rawAccounts] = await Promise.all([
      fetchAllPayments({ StartUtc: startUtc, EndUtc: endUtc }),
      fetchAllAccounts(),
    ]);
    const payments = mapPayments(rawPayments, rawAccounts);
    return NextResponse.json({ payments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
