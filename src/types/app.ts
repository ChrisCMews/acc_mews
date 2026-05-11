export interface Bill {
  id: string;
  number: string;
  accountId: string;
  accountName: string;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  state: "Open" | "Closed" | "Overdue";
  type: "Invoice" | "Receipt" | "CreditNote";
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  currency: string;
  notes: string | null;
}

export interface Payment {
  id: string;
  accountId: string;
  accountName: string;
  billId: string | null;
  chargedAt: string | null;
  state: string;
  type: string;
  amount: number;
  currency: string;
  notes: string | null;
}

export interface AccountingItem {
  id: string;
  accountId: string;
  accountName: string;
  billId: string | null;
  serviceId: string | null;
  serviceName: string | null;
  outletId: string | null;
  outletName: string | null;
  accountingCategoryId: string | null;
  accountingCategoryName: string | null;
  ledgerAccountCode: string | null;
  consumedAt: string;
  type: string;
  name: string;
  unitCount: number;
  unitCost: number;
  taxRate: number | null;
  netAmount: number;
  taxAmount: number;
  currency: string;
}

export interface AccountingCategory {
  id: string;
  name: string;
  code: string | null;
  externalIdentifier: string | null;
  type: string | null;
}

export interface DashboardStats {
  totalRevenue: number;
  totalPayments: number;
  outstandingBalance: number;
  billCount: number;
  currency: string;
  multiCurrency: boolean;
}

export type ExportType = "bills" | "payments" | "accounting-items";

export type BillState = "Open" | "Closed" | "Overdue";
