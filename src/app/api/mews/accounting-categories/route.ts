import { NextResponse } from "next/server";
import { fetchAllAccountingCategories } from "@/lib/mews/client";
import { mapAccountingCategories } from "@/lib/mews/mappers";

export async function GET() {
  try {
    const raw = await fetchAllAccountingCategories();
    const categories = mapAccountingCategories(raw);
    return NextResponse.json({ categories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
