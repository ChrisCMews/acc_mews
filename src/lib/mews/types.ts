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

export interface MewsBalanceAmount {
  Currency: string;
  NetValue: number;
  GrossValue: number;
  TaxValues: { Code: string; Value: number }[] | null;
}

export interface MewsLedgerBalance {
  EnterpriseId: string;
  Date: string;
  LedgerType: string;
  OpeningBalance: MewsBalanceAmount;
  ClosingBalance: MewsBalanceAmount;
}

export interface MewsLedgerBalancesResponse {
  LedgerBalances: MewsLedgerBalance[];
  Cursor: string | null;
}

export interface MewsService {
  Id: string;
  IsActive: boolean;
}

export interface MewsServicesResponse {
  Services: MewsService[];
}

export interface MewsOrderItem {
  Id: string;
  AccountingCategoryId: string | null;
  Amount: {
    Currency: string;
    NetValue: number;
    GrossValue: number;
    TaxValues: { Code: string; Value: number }[] | null;
  };
  ConsumedUtc: string;
  Type: string;
  AccountingState: string;
}

export interface MewsOrderItemsResponse {
  OrderItems: MewsOrderItem[];
  Cursor: string | null;
}
