/**
 * DrillDownModal Component
 * Custom full-screen modal for displaying transaction lists
 * Uses custom CSS instead of Dialog component for full width control
 */

import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const scrollbarThumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync scrollbar with table scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    const scrollbar = scrollbarRef.current;
    const thumb = scrollbarThumbRef.current;

    if (!container || !scrollbar || !thumb) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth - container.clientWidth;
      const scrollbarWidth = scrollbar.clientWidth - thumb.clientWidth;
      const thumbPosition = (scrollLeft / scrollWidth) * scrollbarWidth;
      thumb.style.transform = `translateX(${thumbPosition}px)`;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle scrollbar thumb dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = scrollContainerRef.current;
      const scrollbar = scrollbarRef.current;
      const thumb = scrollbarThumbRef.current;

      if (!container || !scrollbar || !thumb) return;

      const scrollbarRect = scrollbar.getBoundingClientRect();
      const thumbWidth = thumb.clientWidth;
      const maxThumbPosition = scrollbar.clientWidth - thumbWidth;
      const thumbPosition = Math.max(
        0,
        Math.min(maxThumbPosition, e.clientX - scrollbarRect.left - thumbWidth / 2)
      );

      const scrollWidth = container.scrollWidth - container.clientWidth;
      const scrollbarWidth = scrollbar.clientWidth - thumbWidth;
      const scrollLeft = (thumbPosition / scrollbarWidth) * scrollWidth;

      container.scrollLeft = scrollLeft;
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0">
      {/* Modal Container - Full screen width */}
      <div className="w-screen h-screen max-w-none bg-slate-900 rounded-none flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-display font-semibold text-white">{title}</h2>
            <p className="text-sm text-slate-400 mt-1">
              Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Table Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-auto"
          >
            <TransactionTable transactions={transactions} />
          </div>

          {/* Floating Scrollbar */}
          <div className="flex-shrink-0 h-3 bg-slate-800 border-t border-slate-700">
            <div
              ref={scrollbarRef}
              className="relative w-full h-full bg-slate-800"
            >
              <div
                ref={scrollbarThumbRef}
                onMouseDown={() => setIsDragging(true)}
                className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded cursor-grab active:cursor-grabbing hover:from-blue-400 hover:to-blue-500 transition-colors"
                style={{
                  width: '60px',
                  minWidth: '60px',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
