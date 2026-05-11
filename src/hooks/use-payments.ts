import useSWR from "swr";
import type { Payment } from "@/types/app";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UsePaymentsParams {
  startUtc: string;
  endUtc: string;
}

export function usePayments({ startUtc, endUtc }: UsePaymentsParams) {
  const params = new URLSearchParams({ startUtc, endUtc });

  const { data, error, isLoading, mutate } = useSWR<{ payments: Payment[]; error?: string }>(
    `/api/mews/payments?${params.toString()}`,
    fetcher
  );

  return {
    payments: data?.payments ?? [],
    error: data?.error ?? (error ? String(error) : null),
    isLoading,
    refresh: mutate,
  };
}
