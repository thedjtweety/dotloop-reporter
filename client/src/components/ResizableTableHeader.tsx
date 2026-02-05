import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ResizableTableHeaderProps {
  label: string;
  sortField?: string | null;
  currentSortField?: string | null;
  sortOrder?: 'asc' | 'desc';
  onSort?: () => void;
  width?: number;
  onWidthChange?: (newWidth: number) => void;
  children?: React.ReactNode;
}

/**
 * Resizable table header component with drag-to-resize functionality
 * Supports sorting indicators and column width persistence
 */
export default function ResizableTableHeader({
  label,
  sortField,
  currentSortField,
  sortOrder,
  onSort,
  width,
  onWidthChange,
  children,
}: ResizableTableHeaderProps) {
  const [isResizing, setIsResizing] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only resize if clicking on the right edge (resize handle)
    if (!headerRef.current) return;
    
    const rect = headerRef.current.getBoundingClientRect();
    const distanceFromRight = rect.right - e.clientX;
    
    // Only trigger resize if within 5px of the right edge
    if (distanceFromRight > 5) return;

    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width || rect.width;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(60, startWidthRef.current + delta); // Minimum width of 60px
      
      if (onWidthChange) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const isSorted = sortField === currentSortField;

  return (
    <div
      ref={headerRef}
      onClick={onSort}
      onMouseDown={handleMouseDown}
      className={`
        relative flex items-center gap-1 px-2 py-2
        ${onSort ? 'cursor-pointer hover:bg-accent/50' : ''}
        ${isResizing ? 'bg-accent/70' : ''}
        transition-colors select-none
      `}
      style={{ width: width ? `${width}px` : 'auto' }}
    >
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="truncate">{label}</span>
        {isSorted && (
          sortOrder === 'asc' ? 
            <ChevronUp className="w-3 h-3 flex-shrink-0" /> : 
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
        )}
      </div>
      
      {/* Resize handle */}
      <div
        className={`
          absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
          hover:bg-primary/50 transition-colors
          ${isResizing ? 'bg-primary' : 'bg-transparent'}
        `}
      />
    </div>
  );
}
