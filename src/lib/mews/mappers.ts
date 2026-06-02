import type {
  MewsBill,
  MewsPayment,
  MewsLedgerEntry,
  MewsOutletItem,
  MewsOutletBill,
  MewsAccount,
  MewsOutlet,
  MewsAccountingCategory,
} from "./types";
import type { Bill, Payment, AccountingItem, AccountingCategory, LedgerBalance } from "@/types/app";

function buildAccountMap(accounts: MewsAccount[]): Map<string, string> {
  return new Map(
    accounts.map((a) => [a.Id, a.Name ?? `Account ${a.Id.slice(0, 8)}`])
  );
}

export function mapBills(raw: MewsBill[], accounts: MewsAccount[]): Bill[] {
  const accountMap = buildAccountMap(accounts);
  return raw.map((b) => {
    const net = b.TaxedNet?.Value ?? null;
    const tax = b.TaxedTax?.Value ?? null;
    const gross = b.TaxedGross?.Value ?? null;

    const netAmount = net ?? (gross !== null && tax !== null ? gross - tax : gross ?? 0);
    const taxAmount = tax ?? (gross !== null && net !== null ? gross - net : 0);
    const grossAmount = gross ?? (net !== null && tax !== null ? net + tax : net ?? 0);
    const currency =
      b.TaxedGross?.Currency ?? b.TaxedNet?.Currency ?? b.TaxedTax?.Currency ?? "";

    return {
      id: b.Id,
      number: b.Number,
      accountId: b.AccountId,
      accountName: accountMap.get(b.AccountId) ?? b.AccountId,
      issuedAt: b.IssuedUtc,
      dueAt: b.DueUtc,
      paidAt: b.PaidUtc,
      state: b.State,
      type: b.Type,
      netAmount,
      taxAmount,
      grossAmount,
      currency,
      notes: b.Notes,
    };
  });
}

export function mapPayments(raw: MewsPayment[], accounts: MewsAccount[]): Payment[] {
  const accountMap = buildAccountMap(accounts);
  return raw.map((p) => ({
    id: p.Id,
    accountId: p.AccountId,
    accountName: accountMap.get(p.AccountId) ?? p.AccountId,
    billId: p.BillId,
    chargedAt: p.ChargedUtc,
    state: p.State,
    type: p.Type,
    amount: p.Amount?.Value ?? 0,
    currency: p.Amount?.Currency ?? "",
    notes: p.Notes,
  }));
}

export function mapLedgerEntries(
  raw: MewsLedgerEntry[],
  accounts: MewsAccount[],
  categories: MewsAccountingCategory[]
): AccountingItem[] {
  const accountMap = buildAccountMap(accounts);
  const categoryMap = new Map(categories.map((c) => [c.Id, c]));

  return raw.map((entry) => {
    const category = entry.AccountingCategoryId
      ? categoryMap.get(entry.AccountingCategoryId)
      : undefined;
    const amount = entry.Amount?.Value ?? 0;
    const currency = entry.Amount?.Currency ?? "";
    const accountId = entry.AccountId ?? "";

    return {
      id: entry.Id,
      accountId,
      accountName: accountId ? (accountMap.get(accountId) ?? accountId) : "—",
      billId: entry.BillId ?? null,
      serviceId: null,
      serviceName: null,
      outletId: null,
      outletName: null,
      accountingCategoryId: entry.AccountingCategoryId,
      accountingCategoryName: category?.Name ?? null,
      ledgerAccountCode: category?.Code ?? null,
      consumedAt: entry.CreatedUtc,
      type: entry.Type,
      name: category?.Name ?? entry.Type,
      unitCount: 1,
      unitCost: amount,
      taxRate: null,
      netAmount: amount,
      taxAmount: 0,
      currency,
      source: "ledger" as const,
    };
  });
}

export function mapLedgerBalances(
  raw: import("./types").MewsLedgerBalance[],
  accounts: MewsAccount[]
): LedgerBalance[] {
  const accountMap = buildAccountMap(accounts);
  return raw.map((b) => ({
    accountId: b.AccountId ?? "",
    accountName: b.AccountId ? (accountMap.get(b.AccountId) ?? b.AccountId) : "—",
    ledgerType: b.LedgerType,
    amount: b.Amount?.Value ?? 0,
    currency: b.Amount?.Currency ?? "",
  }));
}

export function mapOutletItems(
  rawItems: MewsOutletItem[],
  rawBills: MewsOutletBill[],
  outlets: MewsOutlet[],
  categories: MewsAccountingCategory[]
): AccountingItem[] {
  const billOutletMap = new Map(rawBills.map((b) => [b.Id, b.OutletId]));
  const outletMap = new Map(outlets.map((o) => [o.Id, o.Name]));
  const categoryMap = new Map(categories.map((c) => [c.Id, c]));

  return rawItems.map((item) => {
    const outletId = item.BillId ? (billOutletMap.get(item.BillId) ?? null) : null;
    const category = item.AccountingCategoryId
      ? categoryMap.get(item.AccountingCategoryId)
      : undefined;
    const unitValue = item.UnitAmount?.Value ?? 0;
    const currency = item.UnitAmount?.Currency ?? "USD";

    return {
      id: item.Id,
      accountId: "",
      accountName: "Outlet",
      billId: item.BillId,
      serviceId: null,
      serviceName: null,
      outletId,
      outletName: outletId ? (outletMap.get(outletId) ?? null) : null,
      accountingCategoryId: item.AccountingCategoryId,
      accountingCategoryName: category?.Name ?? null,
      ledgerAccountCode: category?.Code ?? null,
      consumedAt: item.ConsumedUtc,
      type: item.Type,
      name: item.Name,
      unitCount: item.UnitCount,
      unitCost: unitValue,
      taxRate: null,
      netAmount: unitValue * item.UnitCount,
      taxAmount: 0,
      currency,
      source: "outlet" as const,
    };
  });
}

export function mapAccountingCategories(raw: MewsAccountingCategory[]): AccountingCategory[] {
  return raw.map((c) => ({
    id: c.Id,
    name: c.Name,
    code: c.Code,
    costCenterCode: c.CostCenterCode ?? null,
    externalIdentifier: c.ExternalIdentifier,
    type: c.Type,
  }));
}
