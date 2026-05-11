import type {
  MewsBill,
  MewsPayment,
  MewsAccountingItem,
  MewsAccount,
  MewsService,
  MewsOutlet,
  MewsAccountingCategory,
} from "./types";
import type { Bill, Payment, AccountingItem, AccountingCategory } from "@/types/app";

function buildAccountMap(accounts: MewsAccount[]): Map<string, string> {
  return new Map(
    accounts.map((a) => [a.Id, a.Name ?? `Account ${a.Id.slice(0, 8)}`])
  );
}

export function mapBills(raw: MewsBill[], accounts: MewsAccount[]): Bill[] {
  const accountMap = buildAccountMap(accounts);
  return raw.map((b) => ({
    id: b.Id,
    number: b.Number,
    accountId: b.AccountId,
    accountName: accountMap.get(b.AccountId) ?? b.AccountId,
    issuedAt: b.IssuedUtc,
    dueAt: b.DueUtc,
    paidAt: b.PaidUtc,
    state: b.State,
    type: b.Type,
    netAmount: b.TaxedNet?.Value ?? 0,
    taxAmount: b.TaxedTax?.Value ?? 0,
    grossAmount: b.TaxedGross?.Value ?? 0,
    currency: b.TaxedGross?.Currency ?? b.TaxedNet?.Currency ?? "USD",
    notes: b.Notes,
  }));
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
    currency: p.Amount?.Currency ?? "USD",
    notes: p.Notes,
  }));
}

export function mapAccountingItems(
  raw: MewsAccountingItem[],
  accounts: MewsAccount[],
  services: MewsService[],
  outlets: MewsOutlet[],
  categories: MewsAccountingCategory[]
): AccountingItem[] {
  const accountMap = buildAccountMap(accounts);
  const serviceMap = new Map(services.map((s) => [s.Id, s.Name]));
  const outletMap = new Map(outlets.map((o) => [o.Id, o.Name]));
  const categoryMap = new Map(categories.map((c) => [c.Id, c]));

  return raw.map((item) => {
    const category = item.AccountingCategoryId ? categoryMap.get(item.AccountingCategoryId) : undefined;
    return {
      id: item.Id,
      accountId: item.AccountId,
      accountName: accountMap.get(item.AccountId) ?? item.AccountId,
      billId: item.BillId,
      serviceId: item.ServiceId,
      serviceName: item.ServiceId ? (serviceMap.get(item.ServiceId) ?? null) : null,
      outletId: item.OutletId,
      outletName: item.OutletId ? (outletMap.get(item.OutletId) ?? null) : null,
      accountingCategoryId: item.AccountingCategoryId,
      accountingCategoryName: category?.Name ?? null,
      ledgerAccountCode: category?.Code ?? null,
      consumedAt: item.ConsumedUtc,
      type: item.Type,
      name: item.Name,
      unitCount: item.UnitCount,
      unitCost: item.UnitCost?.Value ?? 0,
      taxRate: item.TaxRate,
      netAmount: item.Amount?.Value ?? 0,
      taxAmount: item.TaxAmount?.Value ?? 0,
      currency: item.Amount?.Currency ?? item.UnitCost?.Currency ?? "USD",
    };
  });
}

export function mapAccountingCategories(raw: MewsAccountingCategory[]): AccountingCategory[] {
  return raw.map((c) => ({
    id: c.Id,
    name: c.Name,
    code: c.Code,
    externalIdentifier: c.ExternalIdentifier,
    type: c.Type,
  }));
}
