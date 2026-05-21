import useSWR from "swr";
import type { Payment } from "@/types/app";
import { apiFetcher } from "@/lib/api-fetch";

interface UsePaymentsParams {
  startUtc: string;
  endUtc: string;
}

export function usePayments({ startUtc, endUtc }: UsePaymentsParams) {
  const params = new URLSearchParams({ startUtc, endUtc });

  const { data, error, isLoading, mutate } = useSWR<{ payments: Payment[]; error?: string }>(
    `/api/mews/payments?${params.toString()}`,
    apiFetcher
  );

  return {
    payments: data?.payments ?? [],
    error: data?.error ?? (error ? String(error) : null),
    isLoading,
    refresh: mutate,
  };
}
