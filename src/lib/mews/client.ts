import type {
  MewsAccountingCategoriesResponse,
  MewsAccountingCategory,
  MewsLedgerBalance,
  MewsLedgerBalancesResponse,
  MewsServicesResponse,
  MewsOrderItemsResponse,
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

// NonRevenue returns 500 from the Mews API — excluded until fixed upstream.
// Taxe de séjour items it would contain are only accessible via the async ledger entries export.
const ALL_LEDGER_TYPES = ["Revenue", "Tax", "Payment", "Deposit", "Guest", "City"];

// Mews returns 500 when multiple LedgerTypes are requested together, and rate-limits parallel
// requests (429). Fetch each type sequentially with a small delay.
export async function fetchAllLedgerBalances(
  params: { Start: string; End: string; LedgerTypes?: string[] },
  config?: MewsCallConfig
): Promise<{ balances: MewsLedgerBalance[]; failedTypes: string[] }> {
  const types = params.LedgerTypes ?? ALL_LEDGER_TYPES;
  const failedTypes: string[] = [];
  const failedErrors: string[] = [];
  const balances: MewsLedgerBalance[] = [];

  for (const ledgerType of types) {
    try {
      // No cursor following — for a single-day dashboard query one page is sufficient
      // and paginating 7 types exceeds Vercel's function timeout.
      const res = await mewsPost<MewsLedgerBalancesResponse>(
        "/api/connector/v1/ledgerBalances/getAll",
        {
          Date: { Start: params.Start, End: params.End },
          LedgerTypes: [ledgerType],
          Limitation: { Count: 100 },
        },
        config
      );
      balances.push(...res.LedgerBalances);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failedTypes.push(ledgerType);
      failedErrors.push(`${ledgerType}: ${msg}`);
      if (err instanceof MewsApiError && err.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  if (failedTypes.length === types.length) {
    throw new Error(`All LedgerType requests failed — ${failedErrors.join(" | ")}`);
  }

  return { balances, failedTypes };
}

// City/tourist tax (Taxe de séjour) lives in the NonRevenue ledger, which returns 500
// from ledgerBalances/getAll. Fetch it via orderItems/getAll with the CityTax type instead.
// orderItems/getAll requires one of ServiceIds/BillIds/CreatedUtc/UpdatedUtc/ClosedUtc —
// ConsumedUtc alone does not qualify — so all service IDs are passed to satisfy the rule.
export async function fetchCityTaxTotal(
  date: string,
  config?: MewsCallConfig
): Promise<{ grossTotal: number; currency: string }> {
  const servicesRes = await mewsPost<MewsServicesResponse>(
    "/api/connector/v1/services/getAll",
    { Limitation: { Count: 100 } },
    config
  );
  const serviceIds = servicesRes.Services.map((s) => s.Id);
  if (serviceIds.length === 0) return { grossTotal: 0, currency: "EUR" };

  let cursor: string | undefined = undefined;
  let grossTotal = 0;
  let currency = "EUR";

  do {
    const body: Record<string, unknown> = {
      ServiceIds: serviceIds,
      Types: ["CityTax"],
      ConsumedUtc: { StartUtc: `${date}T00:00:00Z`, EndUtc: `${date}T23:59:59Z` },
      // Mews pagination expects Cursor inside Limitation, not at the top level
      Limitation: cursor ? { Count: 100, Cursor: cursor } : { Count: 100 },
    };

    const orderItemsRes = await mewsPost<MewsOrderItemsResponse>(
      "/api/connector/v1/orderItems/getAll",
      body,
      config
    );

    for (const item of orderItemsRes.OrderItems) {
      if (item.AccountingState === "Canceled") continue;
      grossTotal += item.Amount.GrossValue;
      currency = item.Amount.Currency;
    }

    cursor = orderItemsRes.Cursor ?? undefined;
  } while (cursor);

  return { grossTotal, currency };
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
