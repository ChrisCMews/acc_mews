import useSWR from "swr";
import type { AccountingCategory } from "@/types/app";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAccountingCategories() {
  const { data, error, isLoading } = useSWR<{ categories: AccountingCategory[]; error?: string }>(
    "/api/mews/accounting-categories",
    fetcher
  );

  return {
    categories: data?.categories ?? [],
    error: data?.error ?? (error ? String(error) : null),
    isLoading,
  };
}
