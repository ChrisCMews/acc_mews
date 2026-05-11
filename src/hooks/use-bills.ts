import useSWR from "swr";
import type { Bill } from "@/types/app";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseBillsParams {
  startUtc: string;
  endUtc: string;
  states?: string[];
}

export function useBills({ startUtc, endUtc, states = [] }: UseBillsParams) {
  const params = new URLSearchParams({ startUtc, endUtc });
  states.forEach((s) => params.append("state", s));

  const { data, error, isLoading, mutate } = useSWR<{ bills: Bill[]; error?: string }>(
    `/api/mews/bills?${params.toString()}`,
    fetcher
  );

  return {
    bills: data?.bills ?? [],
    error: data?.error ?? (error ? String(error) : null),
    isLoading,
    refresh: mutate,
  };
}
