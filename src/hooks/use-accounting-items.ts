import useSWR from "swr";
import type { AccountingItem } from "@/types/app";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseAccountingItemsParams {
  startUtc: string;
  endUtc: string;
}

export function useAccountingItems({ startUtc, endUtc }: UseAccountingItemsParams) {
  const params = new URLSearchParams({ startUtc, endUtc });

  const { data, error, isLoading, mutate } = useSWR<{ items: AccountingItem[]; error?: string }>(
    `/api/mews/accounting-items?${params.toString()}`,
    fetcher
  );

  return {
    items: data?.items ?? [],
    error: data?.error ?? (error ? String(error) : null),
    isLoading,
    refresh: mutate,
  };
}
