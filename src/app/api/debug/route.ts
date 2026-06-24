import { NextRequest, NextResponse } from "next/server";
import { fetchAllAccountingCategories, MewsCallConfig } from "@/lib/mews/client";

function extractConfig(req: NextRequest): MewsCallConfig {
  return {
    clientToken: req.headers.get("x-mews-client-token") ?? undefined,
    accessToken: req.headers.get("x-mews-access-token") ?? undefined,
    baseUrl: req.headers.get("x-mews-base-url") ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  const config = extractConfig(req);
  const baseUrl = config.baseUrl || process.env.MEWS_API_BASE_URL || "https://api.mews-demo.com";

  try {
    const categories = await fetchAllAccountingCategories(config);
    return NextResponse.json({
      activeBaseUrl: baseUrl,
      usingCustomCredentials: !!(config.clientToken || config.accessToken),
      accountingCategoriesCount: categories.length,
      sample: categories.slice(0, 3),
    });
  } catch (err) {
    return NextResponse.json({
      activeBaseUrl: baseUrl,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 502 });
  }
}
