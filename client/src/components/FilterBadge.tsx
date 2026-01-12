/**
 * FilterBadge Component
 * Displays active filters with ability to remove individual filters or clear all
 */

import { useEffect, useRef } from 'react';
import { X, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFilters } from '@/contexts/FilterContext';

export default function FilterBadge() {
  const { filters, removeFilter, clearAllFilters, hasFilters } = useFilters();
  const badgeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to show filtered results when filters are applied
  useEffect(() => {
    if (hasFilters && badgeRef.current) {
      // Scroll to the metrics section (just below the filter badge)
      const metricsSection = document.querySelector('[data-tour="metrics"]');
      if (metricsSection) {
        metricsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [filters.length]); // Trigger when filter count changes

  if (!hasFilters) return null;

  return (
    <div ref={badgeRef} className="flex items-center gap-3 flex-wrap p-5 bg-blue-500/10 dark:bg-blue-400/10 rounded-xl border-2 border-blue-500/30 dark:border-blue-400/30 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
      <span className="text-base font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
        <FilterX className="w-5 h-5" />
        🔍 Filtering Dashboard:
      </span>
      
      {filters.map((filter) => (
        <Badge
          key={filter.type}
          variant="secondary"
          className="pl-4 pr-2 py-2 gap-2 bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          <span>
            {filter.label}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-white/20 text-white"
            onClick={() => removeFilter(filter.type)}
          >
            <X className="w-4 h-4" />
          </Button>
        </Badge>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={clearAllFilters}
        className="text-sm h-9 px-4 font-semibold border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600"
      >
        ✕ Clear All Filters
      </Button>
    </div>
  );
}
