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
  const floatingScrollbarRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Sync floating scrollbar with table scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (floatingScrollbarRef.current) {
        const scrollPercentage = container.scrollLeft / (container.scrollWidth - container.clientWidth);
        const maxThumbWidth = container.clientWidth - 40; // Account for padding
        floatingScrollbarRef.current.style.setProperty('--scroll-percentage', `${scrollPercentage * 100}%`);
      }
    };

    const updateScrollbarWidth = () => {
      if (container && floatingScrollbarRef.current) {
        const scrollPercentage = container.clientWidth / container.scrollWidth;
        const thumbWidth = Math.max(40, scrollPercentage * container.clientWidth);
        setScrollbarWidth(thumbWidth);
      }
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateScrollbarWidth);
    
    // Initial calculation
    setTimeout(updateScrollbarWidth, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollbarWidth);
    };
  }, []);

  // Handle floating scrollbar dragging
  const handleScrollbarMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollbar = floatingScrollbarRef.current;
      if (!scrollbar) return;

      const scrollbarRect = scrollbar.getBoundingClientRect();
      const scrollPercentage = (e.clientX - scrollbarRect.left) / scrollbarRect.width;
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollLeft = Math.max(0, Math.min(maxScroll, scrollPercentage * maxScroll));
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
      <DialogContent className="max-w-7xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-3 sm:p-6">
        <DialogHeader className="flex-shrink-0 pb-2 sm:pb-4 border-b">
          <DialogTitle className="text-lg sm:text-xl font-display">{title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable table container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-auto mt-2 sm:mt-4 -mx-3 sm:mx-0 relative"
          style={{
            '--scroll-percentage': '0%',
          } as React.CSSProperties}
        >
          <TransactionTable transactions={transactions} compact />
        </div>

        {/* Floating Horizontal Scrollbar */}
        {scrollbarWidth > 0 && (
          <div
            ref={floatingScrollbarRef}
            className="sticky bottom-0 left-0 right-0 h-2 bg-muted/30 rounded-full mx-3 sm:mx-0 my-2 cursor-pointer hover:bg-muted/50 transition-colors"
            onMouseDown={handleScrollbarMouseDown}
            style={{
              position: 'sticky',
              bottom: '8px',
              zIndex: 10,
            }}
          >
            {/* Scrollbar thumb */}
            <div
              className="h-full bg-primary/60 rounded-full transition-all duration-75 hover:bg-primary/80"
              style={{
                width: `${scrollbarWidth}px`,
                transform: `translateX(calc(var(--scroll-percentage, 0%) * (100% - ${scrollbarWidth}px)))`,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
