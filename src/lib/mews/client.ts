import type {
  MewsAccountingCategoriesResponse,
  MewsAccountingCategory,
} from "./types";

const BASE_URL = process.env.MEWS_API_BASE_URL ?? "https://api.mews-demo.com";
const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN ?? "";
const ACCESS_TOKEN = process.env.MEWS_ACCESS_TOKEN ?? "";
const CLIENT_NAME = process.env.MEWS_CLIENT_NAME ?? "MewsAccountingExport/1.0";

export interface MewsCallConfig {
  clientToken?: string;
  accessToken?: string;
  baseUrl?: string;
}

export class MewsApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "MewsApiError";
  }
}

async function mewsPost<TResponse>(
  path: string,
  body: Record<string, unknown>,
  config?: MewsCallConfig
): Promise<TResponse> {
  const baseUrl = config?.baseUrl || BASE_URL;
  const clientToken = config?.clientToken || CLIENT_TOKEN;
  const accessToken = config?.accessToken || ACCESS_TOKEN;

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ClientToken: clientToken,
      AccessToken: accessToken,
      Client: CLIENT_NAME,
      ...body,
    }),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    let details: unknown;
    try { details = await res.json(); } catch { details = await res.text(); }
    throw new MewsApiError(res.status, `Mews API error ${res.status} at ${path}: ${res.statusText}`, details);
  }

  return res.json() as Promise<TResponse>;
}

export async function fetchAllAccountingCategories(
  config?: MewsCallConfig
): Promise<MewsAccountingCategory[]> {
  try {
    const res = await mewsPost<MewsAccountingCategoriesResponse>(
      "/api/connector/v1/accountingCategories/getAll",
      {},
      config
    );
    return res.AccountingCategories;
  } catch (err) {
    if (err instanceof MewsApiError && err.status === 404) return [];
    throw err;
  }
}
