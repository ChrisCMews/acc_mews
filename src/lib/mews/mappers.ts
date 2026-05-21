import type {
  MewsBill,
  MewsPayment,
  MewsOrderItem,
  MewsOutletItem,
  MewsOutletBill,
  MewsAccount,
  MewsService,
  MewsOutlet,
  MewsAccountingCategory,
  MewsAmount,
} from "./types";
import type { Bill, Payment, AccountingItem, AccountingCategory } from "@/types/app";

function buildAccountMap(accounts: MewsAccount[]): Map<string, string> {
  return new Map(
    accounts.map((a) => [a.Id, a.Name ?? `Account ${a.Id.slice(0, 8)}`])
  );
}

// MewsAmount (from orderItems) has NetValue/GrossValue; MewsCurrency has just Value.
function grossValue(amount: MewsAmount | null | undefined): number {
  if (!amount) return 0;
  return amount.GrossValue ?? amount.NetValue ?? 0;
}

function netValue(amount: MewsAmount | null | undefined): number {
  if (!amount) return 0;
  return amount.NetValue ?? 0;
}

function taxValue(amount: MewsAmount | null | undefined): number {
  if (!amount) return 0;
  return (amount.TaxValues ?? []).reduce((s, t) => s + t.Value, 0);
}

function taxRate(amount: MewsAmount | null | undefined): number | null {
  if (!amount?.TaxValues?.length) return null;
  const gross = grossValue(amount);
  const net = netValue(amount);
  if (!net || net === 0) return null;
  return Math.round(((gross - net) / net) * 100) / 100;
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

export function mapOrderItems(
  raw: MewsOrderItem[],
  accounts: MewsAccount[],
  services: MewsService[],
  categories: MewsAccountingCategory[]
): AccountingItem[] {
  const accountMap = buildAccountMap(accounts);
  const serviceMap = new Map(services.map((s) => [s.Id, s.Name]));
  const categoryMap = new Map(categories.map((c) => [c.Id, c]));

  return raw.map((item) => {
    const category = item.AccountingCategoryId
      ? categoryMap.get(item.AccountingCategoryId)
      : undefined;
    const amt = item.Amount ?? item.UnitAmount;

    return {
      id: item.Id,
      accountId: item.AccountId,
      accountName: accountMap.get(item.AccountId) ?? item.AccountId,
      billId: item.BillId,
      serviceId: item.ServiceId,
      serviceName: item.ServiceId ? (serviceMap.get(item.ServiceId) ?? null) : null,
      outletId: null,
      outletName: null,
      accountingCategoryId: item.AccountingCategoryId,
      accountingCategoryName: category?.Name ?? null,
      ledgerAccountCode: category?.Code ?? null,
      consumedAt: item.ConsumedUtc,
      type: item.Type,
      name: item.Name,
      unitCount: item.UnitCount,
      unitCost: netValue(item.UnitAmount) / Math.max(item.UnitCount, 1),
      taxRate: taxRate(amt),
      netAmount: netValue(amt) * item.UnitCount,
      taxAmount: taxValue(amt) * item.UnitCount,
      currency: amt?.Currency ?? "USD",
      source: "order" as const,
    };
  });
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
    externalIdentifier: c.ExternalIdentifier,
    type: c.Type,
  }));
}
