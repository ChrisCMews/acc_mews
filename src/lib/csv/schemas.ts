import type { Bill, Payment, AccountingItem } from "@/types/app";

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

export const billsCsvSchema: CsvColumn<Bill>[] = [
  { header: "Bill ID",       value: (r) => r.id },
  { header: "Bill Number",   value: (r) => r.number },
  { header: "Account Name",  value: (r) => r.accountName },
  { header: "Type",          value: (r) => r.type },
  { header: "Status",        value: (r) => r.state },
  { header: "Issue Date",    value: (r) => r.issuedAt },
  { header: "Due Date",      value: (r) => r.dueAt ?? "" },
  { header: "Paid Date",     value: (r) => r.paidAt ?? "" },
  { header: "Net Amount",    value: (r) => r.netAmount },
  { header: "Tax Amount",    value: (r) => r.taxAmount },
  { header: "Gross Amount",  value: (r) => r.grossAmount },
  { header: "Currency",      value: (r) => r.currency },
  { header: "Notes",         value: (r) => r.notes ?? "" },
];

export const paymentsCsvSchema: CsvColumn<Payment>[] = [
  { header: "Payment ID",    value: (r) => r.id },
  { header: "Account Name",  value: (r) => r.accountName },
  { header: "Bill ID",       value: (r) => r.billId ?? "" },
  { header: "Payment Type",  value: (r) => r.type },
  { header: "Status",        value: (r) => r.state },
  { header: "Charged Date",  value: (r) => r.chargedAt ?? "" },
  { header: "Amount",        value: (r) => r.amount },
  { header: "Currency",      value: (r) => r.currency },
  { header: "Notes",         value: (r) => r.notes ?? "" },
];

export const accountingItemsCsvSchema: CsvColumn<AccountingItem>[] = [
  { header: "Item ID",                value: (r) => r.id },
  { header: "Account Name",           value: (r) => r.accountName },
  { header: "Bill ID",                value: (r) => r.billId ?? "" },
  { header: "Accounting Category",    value: (r) => r.accountingCategoryName ?? "" },
  { header: "Ledger Account Code",    value: (r) => r.ledgerAccountCode ?? "" },
  { header: "Service",                value: (r) => r.serviceName ?? "" },
  { header: "Outlet",                 value: (r) => r.outletName ?? "" },
  { header: "Type",                   value: (r) => r.type },
  { header: "Description",            value: (r) => r.name },
  { header: "Consumed Date",          value: (r) => r.consumedAt },
  { header: "Unit Count",             value: (r) => r.unitCount },
  { header: "Unit Cost",              value: (r) => r.unitCost },
  { header: "Tax Rate %",             value: (r) => r.taxRate ?? "" },
  { header: "Net Amount",             value: (r) => r.netAmount },
  { header: "Tax Amount",             value: (r) => r.taxAmount },
  { header: "Currency",               value: (r) => r.currency },
];
