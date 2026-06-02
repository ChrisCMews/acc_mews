import type {
  MewsBill,
  MewsPayment,
  MewsAccount,
  MewsAccountingCategory,
} from "./types";
import type { Bill, Payment, AccountingCategory } from "@/types/app";

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
