import type { Bill, Payment } from "@/types/app";

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

