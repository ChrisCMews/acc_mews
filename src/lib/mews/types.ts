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
