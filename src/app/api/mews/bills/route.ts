import { NextRequest, NextResponse } from "next/server";
import { fetchAllBills, fetchAllAccounts, MewsApiError } from "@/lib/mews/client";
import { mapBills } from "@/lib/mews/mappers";
import { defaultStartUtc, defaultEndUtc } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startUtc = searchParams.get("startUtc") ?? defaultStartUtc();
  const endUtc = searchParams.get("endUtc") ?? defaultEndUtc();
  const states = searchParams.getAll("state");

  try {
    const [rawBills, rawAccounts] = await Promise.all([
      fetchAllBills({ StartUtc: startUtc, EndUtc: endUtc, States: states.length ? states : undefined }),
      fetchAllAccounts(),
    ]);
    const bills = mapBills(rawBills, rawAccounts);
    return NextResponse.json({ bills });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err instanceof MewsApiError ? err.details : undefined;
    return NextResponse.json({ error: message, details }, { status: 502 });
  }
}
