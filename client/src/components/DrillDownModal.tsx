/**
 * DrillDownModal Component
 * Displays a modal with a list of transactions for a specific metric
 * Includes floating horizontal scrollbar for easy navigation
 */

import { useRef, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DotloopRecord } from '@/lib/csvParser';
import TransactionTable from './TransactionTable';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  transactions: DotloopRecord[];
}

export default function DrillDownModal({
  isOpen,
  onClose,
  title,
  transactions,
}: DrillDownModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarThumbRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Update scrollbar width and position when content changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollbar = () => {
      const scrollPercentage = container.clientWidth / container.scrollWidth;
      const thumbWidth = Math.max(40, scrollPercentage * container.clientWidth);
      setScrollbarWidth(thumbWidth);
      
      // Update thumb position
      if (scrollbarThumbRef.current) {
        const scrollLeft = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const thumbPosition = (scrollLeft / maxScroll) * (container.clientWidth - thumbWidth);
        scrollbarThumbRef.current.style.transform = `translateX(${thumbPosition}px)`;
      }
    };

    const handleScroll = () => {
      if (scrollbarThumbRef.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const thumbWidth = scrollbarWidth;
        const thumbPosition = (scrollLeft / maxScroll) * (container.clientWidth - thumbWidth);
        scrollbarThumbRef.current.style.transform = `translateX(${thumbPosition}px)`;
      }
    };

    // Initial calculation
    updateScrollbar();
    
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateScrollbar);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollbar);
    };
  }, [scrollbarWidth]);

  // Handle floating scrollbar dragging
  const handleScrollbarMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = scrollContainerRef.current;
      const scrollbar = scrollContainerRef.current?.parentElement?.querySelector('[data-scrollbar-track]') as HTMLElement;
      
      if (!container || !scrollbar) return;

      const scrollbarRect = scrollbar.getBoundingClientRect();
      const clickX = e.clientX - scrollbarRect.left;
      const scrollPercentage = Math.max(0, Math.min(1, clickX / scrollbarRect.width));
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollLeft = scrollPercentage * maxScroll;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] h-[95vh] flex flex-col p-3 sm:p-6">
        <DialogHeader className="flex-shrink-0 pb-2 sm:pb-4 border-b">
          <DialogTitle className="text-lg sm:text-xl font-display">{title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Main content area with table and scrollbar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable table container */}
          <div
            ref={scrollContainerRef}
            id="drilldown-scroll"
            className="flex-1 overflow-y-auto overflow-x-auto mt-2 sm:mt-4 -mx-3 sm:mx-0"
          >
            <TransactionTable transactions={transactions} compact />
          </div>

          {/* Floating Horizontal Scrollbar */}
          {scrollbarWidth > 0 && (
            <div
              data-scrollbar-track
              className="h-2 bg-muted/30 rounded-full mx-3 sm:mx-0 my-2 cursor-pointer hover:bg-muted/50 transition-colors relative"
              onMouseDown={handleScrollbarMouseDown}
              style={{
                minHeight: '8px',
              }}
            >
              {/* Scrollbar thumb */}
              <div
                ref={scrollbarThumbRef}
                className="absolute top-0 h-full bg-primary/60 rounded-full transition-colors hover:bg-primary/80"
                style={{
                  width: `${scrollbarWidth}px`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
