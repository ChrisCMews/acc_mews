import { NextRequest, NextResponse } from "next/server";
import { fetchAllAccountingCategories, MewsCallConfig } from "@/lib/mews/client";
import { mapAccountingCategories } from "@/lib/mews/mappers";

function extractConfig(req: NextRequest): MewsCallConfig {
  return {
    clientToken: req.headers.get("x-mews-client-token") ?? undefined,
    accessToken: req.headers.get("x-mews-access-token") ?? undefined,
    baseUrl: req.headers.get("x-mews-base-url") ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  const config = extractConfig(req);
  try {
    const raw = await fetchAllAccountingCategories(config);
    const categories = mapAccountingCategories(raw);
    return NextResponse.json({ categories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
