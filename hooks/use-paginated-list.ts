"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { fetchFromBackend } from "@/lib/api-client";

const listFetcher = (url: string) => fetchFromBackend(url);

export function buildListQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  return searchParams.toString();
}

export type PaginatedListResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  viewCounts?: Record<string, number>;
  isLoading: boolean;
  error: unknown;
  mutate: ReturnType<typeof useSWR>["mutate"];
};

export function normalizePaginatedResponse<T>(raw: unknown): Omit<
  PaginatedListResult<T>,
  "isLoading" | "error" | "mutate"
> {
  if (Array.isArray(raw)) {
    const items = raw as T[];
    return {
      items,
      total: items.length,
      page: 1,
      limit: items.length || 1,
      totalPages: 1,
    };
  }

  const body = raw as {
    data?: T[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    viewCounts?: Record<string, number>;
  };

  const items = body?.data ?? [];
  const limit = Math.max(1, body?.limit ?? (items.length || 1));
  const total =
    typeof body?.total === "number" ? body.total : items.length;
  const page = typeof body?.page === "number" ? body.page : 1;
  const totalPages =
    typeof body?.totalPages === "number"
      ? body.totalPages
      : Math.max(1, Math.ceil(total / limit));

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    viewCounts: body?.viewCounts,
  };
}

export function usePaginatedList<T>(
  apiUrl: string | null,
  options?: {
    enabled?: boolean;
    dedupingInterval?: number;
  },
): PaginatedListResult<T> {
  const enabled = options?.enabled !== false && Boolean(apiUrl);

  const { data, error, isLoading, mutate } = useSWR(
    enabled ? apiUrl : null,
    listFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: options?.dedupingInterval ?? 5000,
      shouldRetryOnError: false,
    },
  );

  const normalized = useMemo(
    () =>
      data !== undefined
        ? normalizePaginatedResponse<T>(data)
        : {
            items: [] as T[],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 1,
            viewCounts: undefined,
          },
    [data],
  );

  return {
    ...normalized,
    isLoading,
    error,
    mutate,
  };
}
