import useSWR from "swr";
import type { AccountingCategory } from "@/types/app";
import { apiFetcher } from "@/lib/api-fetch";

export function useAccountingCategories() {
  const { data, error, isLoading } = useSWR<{ categories: AccountingCategory[]; error?: string }>(
    "/api/mews/accounting-categories",
    apiFetcher
  );

  return {
    categories: data?.categories ?? [],
    error: data?.error ?? (error ? String(error) : null),
    isLoading,
  };
}
