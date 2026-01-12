/**
 * FilterBadge Component
 * Displays active filters with ability to remove individual filters or clear all
 */

import { X, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFilters } from '@/contexts/FilterContext';

export default function FilterBadge() {
  const { filters, removeFilter, clearAllFilters, hasFilters } = useFilters();

  if (!hasFilters) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap p-4 bg-muted/50 rounded-lg border border-border animate-in fade-in slide-in-from-top-2 duration-300">
      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <FilterX className="w-4 h-4" />
        Active Filters:
      </span>
      
      {filters.map((filter) => (
        <Badge
          key={filter.type}
          variant="secondary"
          className="pl-3 pr-1 py-1 gap-1 hover:bg-secondary/80 transition-colors"
        >
          <span className="text-xs">
            {filter.label}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-destructive/20"
            onClick={() => removeFilter(filter.type)}
          >
            <X className="w-3 h-3" />
          </Button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={clearAllFilters}
        className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
      >
        Clear All
      </Button>
    </div>
  );
}
