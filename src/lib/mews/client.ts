import type {
  MewsBillsResponse,
  MewsPaymentsResponse,
  MewsOrderItemsResponse,
  MewsOutletItemsResponse,
  MewsAccountsResponse,
  MewsServicesResponse,
  MewsOutletsResponse,
  MewsAccountingCategoriesResponse,
  MewsBill,
  MewsPayment,
  MewsOrderItem,
  MewsOutletItem,
  MewsOutletBill,
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

async function mewsPost<TResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<TResponse> {
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

    const res = await mewsPost<TResponse>(path, { ...baseBody, Limitation: limitation });
    const items = extractItems(res);
    all.push(...items);
    cursor = res.Cursor;

    if (all.length >= MAX_ITEMS) break;
  } while (cursor);

  return all;
}

// --- Bills ---
// Filtered by IssuedUtc (invoice/receipt issue date).
// Correct format: { IssuedUtc: { StartUtc, EndUtc } }  — NOT TimeFilter + flat dates.
export async function fetchAllBills(params: {
  StartUtc: string;
  EndUtc: string;
  State?: string;
}): Promise<MewsBill[]> {
  return paginatedFetch<MewsBill, MewsBillsResponse>(
    "/api/connector/v1/bills/getAll",
    {
      IssuedUtc: { StartUtc: params.StartUtc, EndUtc: params.EndUtc },
      ...(params.State ? { State: params.State } : {}),
    },
    (r) => r.Bills
  );
}

// --- Payments ---
// Filtered by ChargedUtc (when payment was charged).
// Correct format: { ChargedUtc: { StartUtc, EndUtc } }
export async function fetchAllPayments(params: {
  StartUtc: string;
  EndUtc: string;
}): Promise<MewsPayment[]> {
  return paginatedFetch<MewsPayment, MewsPaymentsResponse>(
    "/api/connector/v1/payments/getAll",
    {
      ChargedUtc: { StartUtc: params.StartUtc, EndUtc: params.EndUtc },
    },
    (r) => r.Payments
  );
}

// --- Order Items (revenue line items) ---
// Replaces deprecated accountingItems/getAll.
// Filtered by ConsumedUtc (when the charge was consumed/posted).
export async function fetchAllOrderItems(params: {
  StartUtc: string;
  EndUtc: string;
}): Promise<MewsOrderItem[]> {
  return paginatedFetch<MewsOrderItem, MewsOrderItemsResponse>(
    "/api/connector/v1/orderItems/getAll",
    {
      ConsumedUtc: { StartUtc: params.StartUtc, EndUtc: params.EndUtc },
    },
    (r) => r.OrderItems
  );
}

// --- Outlet Items (POS / point-of-sale items) ---
// Separate from order items — covers non-Mews POS or hotel outlet transactions.
export async function fetchAllOutletItems(params: {
  StartUtc: string;
  EndUtc: string;
}): Promise<{ outletItems: MewsOutletItem[]; outletBills: MewsOutletBill[] }> {
  const all: MewsOutletItem[] = [];
  const billMap = new Map<string, MewsOutletBill>();
  let cursor: string | null = null;

  do {
    const limitation: Record<string, unknown> = { Count: PAGE_SIZE };
    if (cursor) limitation.Cursor = cursor;

    const res = await mewsPost<MewsOutletItemsResponse>(
      "/api/connector/v1/outletItems/getAll",
      {
        ConsumedUtc: { StartUtc: params.StartUtc, EndUtc: params.EndUtc },
        Limitation: limitation,
      }
    );

    all.push(...res.OutletItems);
    res.OutletBills.forEach((b) => billMap.set(b.Id, b));
    cursor = res.Cursor;

    if (all.length >= MAX_ITEMS) break;
  } while (cursor);

  return { outletItems: all, outletBills: Array.from(billMap.values()) };
}

// --- Accounts ---
// Tries the unified accounts/getAll endpoint first (newer API).
// Falls back to customers/getAll for older demo environments.
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
    return await paginatedFetch<MewsAccount, MewsAccountsResponse>(
      "/api/connector/v1/accounts/getAll",
      {},
      (r) => r.Accounts
    );
  } catch (err) {
    if (err instanceof MewsApiError && err.status === 404) {
      return fetchAllCustomers();
    }
    throw err;
  }
}

// --- Services, Outlets, Accounting Categories ---
// All return [] on 404 (optional enrichment data).

export async function fetchAllServices(): Promise<MewsService[]> {
  try {
    const res = await mewsPost<MewsServicesResponse>(
      "/api/connector/v1/services/getAll",
      {}
    );
    return res.Services;
  } catch (err) {
    if (err instanceof MewsApiError && err.status === 404) return [];
    throw err;
  }
}

export async function fetchAllOutlets(): Promise<MewsOutlet[]> {
  try {
    const res = await mewsPost<MewsOutletsResponse>(
      "/api/connector/v1/outlets/getAll",
      {}
    );
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
