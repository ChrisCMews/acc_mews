import type {
  MewsAccountingCategoriesResponse,
  MewsAccountingCategory,
  MewsLedgerBalance,
  MewsLedgerBalancesResponse,
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

async function paginatedFetch<TItem, TResponse>(
  path: string,
  body: Record<string, unknown>,
  getItems: (response: TResponse) => TItem[],
  config?: MewsCallConfig,
  getCursor?: (response: TResponse) => string | null | undefined
): Promise<TItem[]> {
  const all: TItem[] = [];
  let cursor: string | undefined = undefined;

  do {
    const requestBody: Record<string, unknown> = cursor
      ? { ...body, Cursor: cursor, Limitation: { Count: 100 } }
      : { ...body, Limitation: { Count: 100 } };
    const res = await mewsPost<TResponse>(path, requestBody, config);
    const items = getItems(res);
    all.push(...items);
    cursor = getCursor ? (getCursor(res) ?? undefined) : undefined;
  } while (cursor);

  return all;
}

const ALL_LEDGER_TYPES = ["Revenue", "Tax", "Payment", "Deposit", "Guest", "City", "NonRevenue"];

// Mews returns 500 when multiple LedgerTypes are requested together — fetch each type separately.
export async function fetchAllLedgerBalances(
  params: { Start: string; End: string; LedgerTypes?: string[] },
  config?: MewsCallConfig
): Promise<{ balances: MewsLedgerBalance[]; failedTypes: string[] }> {
  const types = params.LedgerTypes ?? ALL_LEDGER_TYPES;
  const results = await Promise.allSettled(
    types.map((ledgerType) =>
      paginatedFetch<MewsLedgerBalance, MewsLedgerBalancesResponse>(
        "/api/connector/v1/ledgerBalances/getAll",
        {
          Date: { Start: params.Start, End: params.End },
          LedgerTypes: [ledgerType],
        },
        (r) => r.LedgerBalances,
        config,
        (r) => r.Cursor
      )
    )
  );

  const failedTypes: string[] = [];
  const balances: MewsLedgerBalance[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      balances.push(...result.value);
    } else {
      failedTypes.push(types[i]);
    }
  });

  if (failedTypes.length === types.length) {
    throw new Error(`All LedgerType requests failed. First error: ${results[0].status === "rejected" ? String((results[0] as PromiseRejectedResult).reason) : "unknown"}`);
  }

  return { balances, failedTypes };
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
