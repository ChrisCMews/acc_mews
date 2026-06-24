export interface AccountingCategory {
  id: string;
  name: string;
  code: string | null;
  costCenterCode: string | null;
  externalIdentifier: string | null;
  type: string | null;
}
