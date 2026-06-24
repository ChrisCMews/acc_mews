import type { MewsAccountingCategory } from "./types";
import type { AccountingCategory } from "@/types/app";

export function mapAccountingCategories(raw: MewsAccountingCategory[]): AccountingCategory[] {
  return raw.map((c) => ({
    id: c.Id,
    name: c.Name,
    code: c.Code,
    costCenterCode: c.CostCenterCode ?? null,
    externalIdentifier: c.ExternalIdentifier,
    type: c.Type,
  }));
}
