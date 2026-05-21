import useSWR from "swr";
import type { Bill, BillState } from "@/types/app";
import { apiFetcher } from "@/lib/api-fetch";

interface UseBillsParams {
  startUtc: string;
  endUtc: string;
  state?: BillState | "All";
}

export function useBills({ startUtc, endUtc, state }: UseBillsParams) {
  const params = new URLSearchParams({ startUtc, endUtc });
  if (state && state !== "All") params.set("state", state);

  const { data, error, isLoading, mutate } = useSWR<{ bills: Bill[]; error?: string }>(
    `/api/mews/bills?${params.toString()}`,
    apiFetcher
  );

  return {
    bills: data?.bills ?? [],
    error: data?.error ?? (error ? String(error) : null),
    isLoading,
    refresh: mutate,
  };
}
