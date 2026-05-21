export interface MewsCurrency {
  Value: number;
  Currency: string;
}

// Richer monetary amount returned by orderItems (includes net/tax breakdown)
export interface MewsAmount {
  Currency: string;
  NetValue: number | null;
  GrossValue: number | null;
  TaxValues: Array<{ Code: string; Value: number }> | null;
}

export interface MewsRequestBase {
  ClientToken: string;
  AccessToken: string;
  Client: string;
}

// Shared time interval filter object used by all endpoints
export interface MewsTimeInterval {
  StartUtc: string;
  EndUtc: string;
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

// Order Items (revenue/charge line items — replaces deprecated accountingItems)
export interface MewsOrderItem {
  Id: string;
  AccountId: string;
  BillId: string | null;
  ServiceId: string | null;
  AccountingCategoryId: string | null;
  Name: string;
  UnitCount: number;
  UnitAmount: MewsAmount | null;
  Amount: MewsAmount | null;
  AccountingState: string;
  Type: string;
  ConsumedUtc: string;
  ClosedUtc: string | null;
  CreatedUtc: string;
}

export interface MewsOrderItemsResponse {
  OrderItems: MewsOrderItem[];
  Cursor: string | null;
}

// Outlet Items (POS / point-of-sale revenue items)
export interface MewsOutletItem {
  Id: string;
  BillId: string | null;
  AccountingCategoryId: string | null;
  Type: string;
  Name: string;
  UnitCount: number;
  UnitAmount: MewsCurrency | null;
  CreatedUtc: string;
  ConsumedUtc: string;
  Notes: string | null;
}

export interface MewsOutletBill {
  Id: string;
  OutletId: string;
  Number: string | null;
  ClosedUtc: string | null;
  Notes: string | null;
}

export interface MewsOutletItemsResponse {
  OutletItems: MewsOutletItem[];
  OutletBills: MewsOutletBill[];
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

// Services
export interface MewsService {
  Id: string;
  Name: string;
  IsActive: boolean;
}

export interface MewsServicesResponse {
  Services: MewsService[];
}

// Outlets
export interface MewsOutlet {
  Id: string;
  Name: string;
  IsActive: boolean;
}

export interface MewsOutletsResponse {
  Outlets: MewsOutlet[];
}

// Accounting Categories (chart of accounts)
export interface MewsAccountingCategory {
  Id: string;
  Name: string;
  Code: string | null;
  ExternalIdentifier: string | null;
  Type: string | null;
}

export interface MewsAccountingCategoriesResponse {
  AccountingCategories: MewsAccountingCategory[];
}
