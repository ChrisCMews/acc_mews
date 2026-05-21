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
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch {
    return { status: res.status, ok: false, data: text };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  const config = extractConfig(req);
  const body = await req.json();
  const { entityType, startUtc, endUtc } = body as {
    entityType: string;
    startUtc: string;
    endUtc: string;
  };

  if (!entityType || !startUtc || !endUtc) {
    return NextResponse.json({ error: "Missing entityType, startUtc or endUtc" }, { status: 400 });
  }

  // Step 1: create the export job
  const addResult = await mewsPost(
    "/api/connector/v1/exports/add",
    { EntityType: entityType, Filters: { UpdatedUtc: { StartUtc: startUtc, EndUtc: endUtc } } },
    config
  );

  if (!addResult.ok) {
    return NextResponse.json({ step: "add", error: addResult.data }, { status: 502 });
  }

  const exportId: string = addResult.data?.Export?.Id;
  if (!exportId) {
    return NextResponse.json({ step: "add", error: "No export ID returned", raw: addResult.data }, { status: 502 });
  }

  // Step 2: poll up to 45s for completion
  for (let i = 0; i < 15; i++) {
    await sleep(3000);
    const pollResult = await mewsPost(
      "/api/connector/v1/exports/getAll",
      { ExportIds: [exportId] },
      config
    );
    const exp = pollResult.data?.Exports?.[0];
    if (!exp) continue;

    if (exp.Status === "Success" || exp.Status === "Failed" || exp.Status === "Expired") {
      return NextResponse.json({
        exportId,
        status: exp.Status,
        entityType,
        filters: exp.Filters,
        files: (exp.Files ?? []).map((f: Record<string, unknown>) => ({
          url: f.Url,
          sizeInBytes: f.SizeInBytes,
          sizeKb: typeof f.SizeInBytes === "number" ? Math.round((f.SizeInBytes as number) / 1024) : null,
        })),
        expiresUtc: exp.ExpiresUtc,
        createdUtc: exp.CreatedUtc,
        raw: exp,
      });
    }
  }

  return NextResponse.json({ exportId, status: "Timeout", error: "Export did not complete within 45s" }, { status: 504 });
}
