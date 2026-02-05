import React, { useState, useMemo } from 'react';
import { X, Download, FileText, ExternalLink, Tag, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AgentBadges from './AgentBadges';

// Helper function to format dates
function formatDate(date: string | undefined): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

interface PipelineDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  records: DotloopRecord[];
  stageColor: string;
  onAgentClick?: (agentName: string) => void;
}

type SortField = 'loopName' | 'closingDate' | 'price' | 'agents' | 'loopStatus';
type SortOrder = 'asc' | 'desc';

/**
 * Full-screen drill-down modal for viewing transaction details
 * Includes sorting, filtering, bulk actions, and export options
 */
export function PipelineDrillDownModal({
  isOpen,
  onClose,
  title,
  records,
  stageColor,
  onAgentClick,
}: PipelineDrillDownModalProps) {
  const [sortField, setSortField] = useState<SortField>(() => {
    const saved = localStorage.getItem('pipelineDrillDownSort');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.field || 'closingDate';
      } catch {
        return 'closingDate';
      }
    }
    return 'closingDate';
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const saved = localStorage.getItem('pipelineDrillDownSort');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.order || 'desc';
      } catch {
        return 'desc';
      }
    }
    return 'desc';
  });
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.loopName?.toLowerCase().includes(term) ||
          r.agents?.toLowerCase().includes(term) ||
          r.loopStatus?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [records, sortField, sortOrder, searchTerm]);

  const handleSort = (field: SortField) => {
    let newOrder: SortOrder = 'asc';
    if (sortField === field) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
    } else {
      setSortField(field);
      setSortOrder('asc');
      newOrder = 'asc';
    }
    // Save sort preference to localStorage
    localStorage.setItem('pipelineDrillDownSort', JSON.stringify({ field, order: newOrder }));
  };

  const toggleSelectAll = () => {
    if (selectedRecords.size === filteredAndSortedRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(
        new Set(filteredAndSortedRecords.map((_, i) => i.toString()))
      );
    }
  };

  const toggleSelectRecord = (index: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRecords(newSelected);
  };

  const handleExportCSV = () => {
    const recordsToExport = selectedRecords.size > 0
      ? filteredAndSortedRecords.filter((_, i) => selectedRecords.has(i.toString()))
      : filteredAndSortedRecords;

    const headers = ['Loop Name', 'Closing Date', 'Price', 'Agent', 'Status'];
    const rows = recordsToExport.map(r => [
      r.loopName || '',
      r.closingDate || '',
      r.price || '',
      r.agents || '',
      r.loopStatus || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredAndSortedRecords.length} transaction{filteredAndSortedRecords.length !== 1 ? 's' : ''}
              {selectedRecords.size > 0 && ` • ${selectedRecords.size} selected`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border bg-card/50">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedRecords.size === 0}
              className="gap-2"
            >
              <Tag className="w-4 h-4" />
              Tag ({selectedRecords.size})
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card/50">
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedRecords.size === filteredAndSortedRecords.length && filteredAndSortedRecords.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border"
                  />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('loopName')}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Loop Name
                    {sortField === 'loopName' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('closingDate')}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Closing Date
                    {sortField === 'closingDate' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('price')}
                  className="cursor-pointer hover:bg-accent/50 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-2">
                    Price
                    {sortField === 'price' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('agents')}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Agent
                    {sortField === 'agents' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedRecords.map((record, index) => (
                <TableRow
                  key={index}
                  className={selectedRecords.has(index.toString()) ? 'bg-accent/20' : 'hover:bg-accent/10'}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRecords.has(index.toString())}
                      onChange={() => toggleSelectRecord(index.toString())}
                      className="rounded border-border"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{record.loopName}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(record.closingDate)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(record.price)}</TableCell>
                  <TableCell>
                    <AgentBadges
                      agents={record.agents}
                      onAgentClick={onAgentClick}
                      compact={true}
                    />
                  </TableCell>
                  <TableCell>
                    <button className="p-1 hover:bg-accent rounded transition-colors">
                      <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-card/50">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedRecords.length} of {records.length} transactions
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
