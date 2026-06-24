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

export interface MewsAccountingItem {
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
}

export interface MewsAccountingItemsResponse {
  AccountingItems: MewsAccountingItem[];
  Cursor: string | null;
}
