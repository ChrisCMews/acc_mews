import useSWR from "swr";
import type { LedgerReport } from "@/types/app";
import { apiFetcher } from "@/lib/api-fetch";

export function useLedger(date: string) {
  const { data, error, isLoading, mutate } = useSWR<{ report: LedgerReport; error?: string }>(
    `/api/mews/ledger?date=${date}`,
    apiFetcher
  );
  return {
    report: data?.report ?? null,
    error: data?.error ?? (error ? String(error) : null),
    isLoading,
    refresh: mutate,
  };
}
