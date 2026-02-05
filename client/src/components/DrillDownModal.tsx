import { useRef, useEffect, useState } from 'react';
import { X, Download, Printer, Search, ChevronDown, ExternalLink } from 'lucide-react';
import { DotloopRecord } from '@/lib/csvParser';
import TransactionTable from './TransactionTable';
import TransactionInfoModal from './TransactionInfoModal';
import { exportAsCSV, exportAsExcel, openPrintDialog, exportFilteredToCSV, exportFilteredToExcel } from '@/lib/exportUtils';
import { filterAndSortTransactions, DrillDownFilters, SortState, getUniqueValues } from '@/lib/filterUtils';
import { openMultipleInDotloop } from '@/lib/dotloopUtils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BulkActionsToolbar from './BulkActionsToolbar';
import FavoritesSelector from './FavoritesSelector';
import BookmarkManager from './BookmarkManager';
import { saveBookmark, getBookmarks, FilterBookmark } from '@/lib/bookmarkUtils';


interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  transactions: DotloopRecord[];
  onSortChange?: (sortState: SortState | null) => void;
}

export default function DrillDownModal({
  isOpen,
  onClose,
  title,
  transactions,
  onSortChange,
}: DrillDownModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const scrollbarThumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filters, setFilters] = useState<DrillDownFilters>(() => {
    const saved = localStorage.getItem('drillDownFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { searchQuery: '', status: 'All', agent: 'All' };
      }
    }
    return { searchQuery: '', status: 'All', agent: 'All' };
  });
  const [sortState, setSortState] = useState<SortState | null>(() => {
    const saved = localStorage.getItem('drillDownSortState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<DotloopRecord | null>(null);
  const [showTransactionInfo, setShowTransactionInfo] = useState(false);

  const handleTransactionClick = (transaction: DotloopRecord) => {
    setSelectedTransaction(transaction);
    setShowTransactionInfo(true);
  };

  // Persist filters to localStorage
  useEffect(() => {
    localStorage.setItem('drillDownFilters', JSON.stringify(filters));
  }, [filters]);

  // Persist sort state to localStorage
  useEffect(() => {
    if (sortState) {
      localStorage.setItem('drillDownSortState', JSON.stringify(sortState));
    } else {
      localStorage.removeItem('drillDownSortState');
    }
  }, [sortState]);

  // Get unique values for filters
  const uniqueStatuses = ['All', ...getUniqueValues(transactions, 'status')];
  const uniqueAgents = ['All', ...getUniqueValues(transactions, 'agentName')];

  // Apply filters and sorting
  const filteredTransactions = filterAndSortTransactions(transactions, filters, sortState);

  // Get selected transaction records
  const selectedTransactionRecords = Array.from(selectedRecords).map(index => filteredTransactions[index]);

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
              Showing {filteredTransactions.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportFilteredToCSV(filteredTransactions, title, bookmarkName || undefined)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Export filtered as CSV"
              title="Export visible filtered results to CSV"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => exportFilteredToExcel(filteredTransactions, title, bookmarkName || undefined)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Export filtered as Excel"
              title="Export visible filtered results to Excel"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => openPrintDialog({ title, records: filteredTransactions })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Print"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {filteredTransactions.length > 0 && (
              <button
                onClick={() => openMultipleInDotloop(filteredTransactions)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
                aria-label="View in Dotloop"
              >
                <ExternalLink className="w-4 h-4" />
                View in Dotloop
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-700 bg-slate-800 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search by address, agent, property type..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <Select value={filters.status || 'All'} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status} className="text-white hover:bg-slate-600">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.agent || 'All'} onValueChange={(value) => setFilters({ ...filters, agent: value })}>
              <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {uniqueAgents.map(agent => (
                  <SelectItem key={agent} value={agent} className="text-white hover:bg-slate-600">
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 ml-auto">
              <BookmarkManager
                type="transaction"
                currentFilters={filters}
                onLoadBookmark={(bookmark) => {
                  setFilters(bookmark.filters as DrillDownFilters);
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Table Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-auto"
          >
            <TransactionTable 
              transactions={filteredTransactions} 
              onTransactionClick={handleTransactionClick}
            />
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

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedRecords={selectedTransactionRecords}
        allRecords={filteredTransactions}
        title={title}
        isVisible={selectedRecords.size > 0}
      />

      {/* Transaction Info Modal */}
      <TransactionInfoModal
        isOpen={showTransactionInfo}
        onClose={() => setShowTransactionInfo(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
