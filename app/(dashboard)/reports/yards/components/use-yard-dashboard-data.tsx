"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  type YardDashboardFilterKey,
  type YardDashboardFilters,
  emptyYardDashboardFilters,
  hasActiveYardDashboardFilters,
} from "./yard-dashboard-filters";

type YardDashboardDataContextValue = {
  filters: YardDashboardFilters;
  toggleFilter: (key: YardDashboardFilterKey, value: string) => void;
  clearFilters: () => void;
  isFilterActive: (key: YardDashboardFilterKey, value: string) => boolean;
  hasActiveFilters: boolean;
};

const YardDashboardDataContext =
  createContext<YardDashboardDataContextValue | null>(null);

export function YardDashboardDataProvider({
  filters,
  onFiltersChange,
  children,
}: {
  filters?: YardDashboardFilters;
  onFiltersChange?: Dispatch<SetStateAction<YardDashboardFilters>>;
  children: ReactNode;
}) {
  const toggleFilter = useCallback(
    (key: YardDashboardFilterKey, value: string) => {
      onFiltersChange?.((prev) => {
        const current = prev ?? emptyYardDashboardFilters();
        return {
          ...current,
          [key]: current[key] === value ? null : value,
        };
      });
    },
    [onFiltersChange],
  );

  const clearFilters = useCallback(() => {
    onFiltersChange?.(emptyYardDashboardFilters());
  }, [onFiltersChange]);

  const resolvedFilters = filters ?? emptyYardDashboardFilters();

  const isFilterActive = useCallback(
    (key: YardDashboardFilterKey, value: string) =>
      resolvedFilters[key] === value,
    [resolvedFilters],
  );

  const value = useMemo(
    () => ({
      filters: resolvedFilters,
      toggleFilter,
      clearFilters,
      isFilterActive,
      hasActiveFilters: hasActiveYardDashboardFilters(resolvedFilters),
    }),
    [clearFilters, isFilterActive, resolvedFilters, toggleFilter],
  );

  return (
    <YardDashboardDataContext.Provider value={value}>
      {children}
    </YardDashboardDataContext.Provider>
  );
}

export function useYardDashboardData() {
  const context = useContext(YardDashboardDataContext);
  if (!context) {
    throw new Error(
      "useYardDashboardData must be used inside YardDashboardDataProvider",
    );
  }
  return context;
}
