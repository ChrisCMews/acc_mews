import { NextResponse } from "next/server";

const BASE_URL = process.env.MEWS_API_BASE_URL ?? "https://api.mews-demo.com";
const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN ?? "";
const ACCESS_TOKEN = process.env.MEWS_ACCESS_TOKEN ?? "";
const CLIENT_NAME = process.env.MEWS_CLIENT_NAME ?? "MewsAccountingExport/1.0";

const ENDPOINTS = [
  "/api/connector/v1/bills/getAll",
  "/api/connector/v1/payments/getAll",
  "/api/connector/v1/accountingItems/getAll",
  "/api/connector/v1/accounts/getAll",
  "/api/connector/v1/customers/getAll",
  "/api/connector/v1/services/getAll",
  "/api/connector/v1/outlets/getAll",
  "/api/connector/v1/accountingCategories/getAll",
];

async function probe(path: string): Promise<{ path: string; status: number; ok: boolean; error?: string }> {
  try {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ClientToken: CLIENT_TOKEN,
        AccessToken: ACCESS_TOKEN,
        Client: CLIENT_NAME,
        StartUtc: monthAgo.toISOString(),
        EndUtc: now.toISOString(),
        Limitation: { Count: 1 },
      }),
    });
    return { path, status: res.status, ok: res.ok };
  } catch (err) {
    return { path, status: 0, ok: false, error: String(err) };
  }
}

export async function GET() {
  const results = await Promise.all(ENDPOINTS.map(probe));
  return NextResponse.json({
    baseUrl: BASE_URL,
    hasClientToken: !!CLIENT_TOKEN,
    hasAccessToken: !!ACCESS_TOKEN,
    endpoints: results,
  });
}
