import { NextRequest, NextResponse } from "next/server";
import { MewsCallConfig } from "@/lib/mews/client";

const DEFAULT_BASE_URL = process.env.MEWS_API_BASE_URL ?? "https://api.mews-demo.com";
const DEFAULT_CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN ?? "";
const DEFAULT_ACCESS_TOKEN = process.env.MEWS_ACCESS_TOKEN ?? "";
const CLIENT_NAME = process.env.MEWS_CLIENT_NAME ?? "MewsAccountingExport/1.0";

function extractConfig(req: NextRequest): MewsCallConfig {
  return {
    clientToken: req.headers.get("x-mews-client-token") ?? undefined,
    accessToken: req.headers.get("x-mews-access-token") ?? undefined,
    baseUrl: req.headers.get("x-mews-base-url") ?? undefined,
  };
}

async function mewsPost(path: string, body: Record<string, unknown>, config: MewsCallConfig) {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const clientToken = config.clientToken || DEFAULT_CLIENT_TOKEN;
  const accessToken = config.accessToken || DEFAULT_ACCESS_TOKEN;
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ClientToken: clientToken, AccessToken: accessToken, Client: CLIENT_NAME, ...body }),
    cache: "no-store",
  });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text) };
  } catch {
    return { status: res.status, ok: false, body: text };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET(req: NextRequest) {
  const config = extractConfig(req);
  const { searchParams } = req.nextUrl;

  // Default to yesterday (safe: end must be 5+ minutes in the past)
  const date = searchParams.get("date") ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const entityType = searchParams.get("type") ?? "Bill";

  const interval = {
    StartUtc: `${date}T00:00:00Z`,
    EndUtc: `${date}T23:55:00Z`,
  };

  // Step 1: trigger the export
  const addResult = await mewsPost(
    "/api/connector/v1/exports/add",
    { EntityType: entityType, Filters: { UpdatedUtc: interval } },
    config
  );

  if (!addResult.ok || !addResult.body?.Export?.Id) {
    return NextResponse.json({ step: "add", date, entityType, result: addResult });
  }

  const exportId = addResult.body.Export.Id;

  // Step 2: poll up to 30s for completion
  let pollResult = null;
  let finalExport = null;
  for (let i = 0; i < 10; i++) {
    await sleep(3000);
    pollResult = await mewsPost(
      "/api/connector/v1/exports/getAll",
      { ExportIds: [exportId] },
      config
    );
    const exp = pollResult.body?.Exports?.[0];
    if (exp?.Status === "Success" || exp?.Status === "Failed" || exp?.Status === "Expired") {
      finalExport = exp;
      break;
    }
  }

  return NextResponse.json({
    date,
    entityType,
    exportId,
    status: finalExport?.Status ?? "Timeout",
    files: finalExport?.Files ?? [],
    fileSizes: (finalExport?.Files ?? []).map((f: Record<string, unknown>) => ({
      url: f.Url,
      sizeInBytes: f.SizeInBytes,
      sizeKb: typeof f.SizeInBytes === "number" ? Math.round(f.SizeInBytes / 1024) + " KB" : null,
    })),
    expiresUtc: finalExport?.ExpiresUtc,
    rawExport: finalExport,
    addResponse: addResult.body,
  });
}
