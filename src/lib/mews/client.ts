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
    // Include the path so the caller knows exactly which endpoint failed
    throw new MewsApiError(
      res.status,
      `Mews API error ${res.status} at ${path}: ${res.statusText}`,
      details
    );
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
    const limitation: Record<string, unknown> = { Count: PAGE_SIZE };
    if (cursor) limitation.Cursor = cursor;
    const body: Record<string, unknown> = {
      ...baseBody,
      Limitation: limitation,
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
      TimeFilter: "ChargedUtc",
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

// Legacy customer shape returned by /customers/getAll
interface MewsCustomer {
  Id: string;
  FirstName: string | null;
  LastName: string | null;
  Email: string | null;
}
interface MewsCustomersResponse {
  Customers: MewsCustomer[];
  Cursor: string | null;
}

async function fetchAllCustomers(): Promise<MewsAccount[]> {
  const customers = await paginatedFetch<MewsCustomer, MewsCustomersResponse>(
    "/api/connector/v1/customers/getAll",
    {},
    (r) => r.Customers
  );
  return customers.map((c) => ({
    Id: c.Id,
    Type: "Customer" as const,
    Name: [c.FirstName, c.LastName].filter(Boolean).join(" ") || null,
    Email: c.Email,
    TaxIdentificationNumber: null,
  }));
}

export async function fetchAllAccounts(): Promise<MewsAccount[]> {
  try {
    // Prefer the unified accounts endpoint (newer API versions)
    return await paginatedFetch<MewsAccount, MewsAccountsResponse>(
      "/api/connector/v1/accounts/getAll",
      {},
      (r) => r.Accounts
    );
  } catch (err) {
    if (err instanceof MewsApiError && err.status === 404) {
      // Fall back to legacy customers endpoint (older demo environments)
      return fetchAllCustomers();
    }
    throw err;
  }
}

export async function fetchAllServices(): Promise<MewsService[]> {
  try {
    const res = await mewsPost<MewsServicesResponse>("/api/connector/v1/services/getAll", {});
    return res.Services;
  } catch (err) {
    if (err instanceof MewsApiError && err.status === 404) return [];
    throw err;
  }
}

export async function fetchAllOutlets(): Promise<MewsOutlet[]> {
  try {
    const res = await mewsPost<MewsOutletsResponse>("/api/connector/v1/outlets/getAll", {});
    return res.Outlets;
  } catch (err) {
    if (err instanceof MewsApiError && err.status === 404) return [];
    throw err;
  }
}

export async function fetchAllAccountingCategories(): Promise<MewsAccountingCategory[]> {
  try {
    const res = await mewsPost<MewsAccountingCategoriesResponse>(
      "/api/connector/v1/accountingCategories/getAll",
      {}
    );
    return res.AccountingCategories;
  } catch (err) {
    if (err instanceof MewsApiError && err.status === 404) return [];
    throw err;
  }
}
