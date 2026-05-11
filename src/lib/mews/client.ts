import type {
  MewsBillsResponse,
  MewsPaymentsResponse,
  MewsAccountingItemsResponse,
  MewsAccountsResponse,
  MewsServicesResponse,
  MewsOutletsResponse,
  MewsAccountingCategoriesResponse,
  MewsBill,
  MewsPayment,
  MewsAccountingItem,
  MewsAccount,
  MewsService,
  MewsOutlet,
  MewsAccountingCategory,
} from "./types";

const BASE_URL = process.env.MEWS_API_BASE_URL ?? "https://api.mews-demo.com";
const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN ?? "";
const ACCESS_TOKEN = process.env.MEWS_ACCESS_TOKEN ?? "";
const CLIENT_NAME = process.env.MEWS_CLIENT_NAME ?? "MewsAccountingExport/1.0";

const MAX_ITEMS = 10000;
const PAGE_SIZE = 1000;

class MewsApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "MewsApiError";
  }
}

async function mewsPost<TResponse>(path: string, body: Record<string, unknown>): Promise<TResponse> {
  const url = `${BASE_URL}${path}`;
  const payload = {
    ClientToken: CLIENT_TOKEN,
    AccessToken: ACCESS_TOKEN,
    Client: CLIENT_NAME,
    ...body,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    let details: unknown;
    try {
      details = await res.json();
    } catch {
      details = await res.text();
    }
    throw new MewsApiError(res.status, `Mews API error ${res.status}: ${res.statusText}`, details);
  }

  return res.json() as Promise<TResponse>;
}

async function paginatedFetch<TItem, TResponse extends { Cursor: string | null }>(
  path: string,
  baseBody: Record<string, unknown>,
  extractItems: (res: TResponse) => TItem[]
): Promise<TItem[]> {
  const all: TItem[] = [];
  let cursor: string | null = null;

  do {
    const body: Record<string, unknown> = {
      ...baseBody,
      Limitation: { Count: PAGE_SIZE, Cursor: cursor },
    };
    const res = await mewsPost<TResponse>(path, body);
    const items = extractItems(res);
    all.push(...items);
    cursor = res.Cursor;

    if (all.length >= MAX_ITEMS) break;
  } while (cursor);

  return all;
}

export async function fetchAllBills(params: {
  StartUtc: string;
  EndUtc: string;
  States?: string[];
}): Promise<MewsBill[]> {
  return paginatedFetch<MewsBill, MewsBillsResponse>(
    "/api/connector/v1/bills/getAll",
    {
      TimeFilter: "StartUtc",
      StartUtc: params.StartUtc,
      EndUtc: params.EndUtc,
      ...(params.States?.length ? { States: params.States } : {}),
    },
    (r) => r.Bills
  );
}

export async function fetchAllPayments(params: {
  StartUtc: string;
  EndUtc: string;
}): Promise<MewsPayment[]> {
  return paginatedFetch<MewsPayment, MewsPaymentsResponse>(
    "/api/connector/v1/payments/getAll",
    {
      TimeFilter: "StartUtc",
      StartUtc: params.StartUtc,
      EndUtc: params.EndUtc,
    },
    (r) => r.Payments
  );
}

export async function fetchAllAccountingItems(params: {
  StartUtc: string;
  EndUtc: string;
}): Promise<MewsAccountingItem[]> {
  return paginatedFetch<MewsAccountingItem, MewsAccountingItemsResponse>(
    "/api/connector/v1/accountingItems/getAll",
    {
      TimeFilter: "Consumed",
      StartUtc: params.StartUtc,
      EndUtc: params.EndUtc,
    },
    (r) => r.AccountingItems
  );
}

export async function fetchAllAccounts(): Promise<MewsAccount[]> {
  return paginatedFetch<MewsAccount, MewsAccountsResponse>(
    "/api/connector/v1/accounts/getAll",
    {},
    (r) => r.Accounts
  );
}

export async function fetchAllServices(): Promise<MewsService[]> {
  const res = await mewsPost<MewsServicesResponse>("/api/connector/v1/services/getAll", {});
  return res.Services;
}

export async function fetchAllOutlets(): Promise<MewsOutlet[]> {
  const res = await mewsPost<MewsOutletsResponse>("/api/connector/v1/outlets/getAll", {});
  return res.Outlets;
}

export async function fetchAllAccountingCategories(): Promise<MewsAccountingCategory[]> {
  const res = await mewsPost<MewsAccountingCategoriesResponse>(
    "/api/connector/v1/accountingCategories/getAll",
    {}
  );
  return res.AccountingCategories;
}
