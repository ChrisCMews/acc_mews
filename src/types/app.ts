export interface AccountingCategory {
  id: string;
  name: string;
  code: string | null;
  costCenterCode: string | null;
  externalIdentifier: string | null;
  type: string | null;
}

export interface LedgerActivity {
  ledgerType: string;
  grossActivity: number;
  netActivity: number;
  taxActivity: number;
  currency: string;
}

export interface LedgerReport {
  date: string;
  activities: LedgerActivity[];
  currency: string;
}
