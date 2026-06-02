export interface MewsCurrency {
  Value: number;
  Currency: string;
}

export interface MewsRequestBase {
  ClientToken: string;
  AccessToken: string;
  Client: string;
}

// Bills
export interface MewsBill {
  Id: string;
  AccountId: string;
  CreatedUtc: string;
  IssuedUtc: string;
  DueUtc: string | null;
  PaidUtc: string | null;
  State: "Open" | "Closed" | "Overdue";
  Type: "Invoice" | "Receipt" | "CreditNote";
  Number: string;
  VariableSymbol: string | null;
  TaxedNet: MewsCurrency | null;
  TaxedTax: MewsCurrency | null;
  TaxedGross: MewsCurrency | null;
  Notes: string | null;
}

export interface MewsBillsResponse {
  Bills: MewsBill[];
  Cursor: string | null;
}

// Payments
export interface MewsPayment {
  Id: string;
  AccountId: string;
  BillId: string | null;
  CreatedUtc: string;
  ChargedUtc: string | null;
  SettlementUtc: string | null;
  State: "Pending" | "Verifying" | "Charged" | "Canceled" | "Failed";
  Type: string;
  Amount: MewsCurrency;
  Notes: string | null;
}

export interface MewsPaymentsResponse {
  Payments: MewsPayment[];
  Cursor: string | null;
}

// Accounts (guests / companies)
export interface MewsAccount {
  Id: string;
  Type: "Customer" | "Company";
  Name: string | null;
  Email: string | null;
  TaxIdentificationNumber: string | null;
}

export interface MewsAccountsResponse {
  Accounts: MewsAccount[];
  Cursor: string | null;
}

// Accounting Categories (chart of accounts)
export interface MewsAccountingCategory {
  Id: string;
  Name: string;
  Code: string | null;
  CostCenterCode: string | null;
  ExternalIdentifier: string | null;
  Type: string | null;
}

export interface MewsAccountingCategoriesResponse {
  AccountingCategories: MewsAccountingCategory[];
}
