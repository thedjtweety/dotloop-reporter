/**
 * FilterContext
 * Global state management for chart drill-down filters
 */

import { createContext, useContext, useState, ReactNode } from 'react';

export interface DashboardFilter {
  type: 'pipeline' | 'timeline' | 'leadSource' | 'propertyType' | 'geographic' | 'agent' | 'dateRange';
  label: string;
  value: string | { start: string; end: string };
}

interface FilterContextType {
  filters: DashboardFilter[];
  addFilter: (filter: DashboardFilter) => void;
  removeFilter: (type: DashboardFilter['type']) => void;
  clearAllFilters: () => void;
  hasFilters: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilter[]>([]);

  const addFilter = (filter: DashboardFilter) => {
    setFilters((prev) => {
      // Remove existing filter of the same type
      const filtered = prev.filter((f) => f.type !== filter.type);
      return [...filtered, filter];
    });
  };

  const removeFilter = (type: DashboardFilter['type']) => {
    setFilters((prev) => prev.filter((f) => f.type !== type));
  };

  const clearAllFilters = () => {
    setFilters([]);
  };

  const hasFilters = filters.length > 0;

  return (
    <FilterContext.Provider
      value={{
        filters,
        addFilter,
        removeFilter,
        clearAllFilters,
        hasFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
