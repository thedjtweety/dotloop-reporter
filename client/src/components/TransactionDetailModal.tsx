import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowUpDown, Download, X, FileText, CheckSquare, Square, RotateCcw, RotateCw, Filter } from 'lucide-react';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  transactions: DotloopRecord[];
  fullScreen?: boolean;
}

type SortField = 'address' | 'price' | 'agent' | 'closingDate' | 'status';
type SortOrder = 'asc' | 'desc';

interface HistoryEntry {
  action: 'reassign' | 'status_update';
  selectedIndices: number[];
  oldValues: Map<number, string>;
  newValue: string;
  timestamp: number;
}

export default function TransactionDetailModal({
  isOpen,
  onClose,
  title,
  transactions,
  fullScreen = false,
}: TransactionDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('closingDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  
  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [transactionUpdates, setTransactionUpdates] = useState<Map<number, Partial<DotloopRecord>>>(new Map());

  // Get unique agents and statuses
  const uniqueAgents = useMemo(() => {
    const agents = new Set(transactions.map(t => t.agent).filter(Boolean));
    return Array.from(agents).sort();
  }, [transactions]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(transactions.map(t => t.loopStatus).filter(Boolean));
    return Array.from(statuses).sort();
  }, [transactions]);

  // Get updated transaction with applied changes
  const getUpdatedTransaction = (transaction: DotloopRecord, index: number): DotloopRecord => {
    const updates = transactionUpdates.get(index);
    if (!updates) return transaction;
    return { ...transaction, ...updates };
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.map((t, idx) => getUpdatedTransaction(t, idx)).filter(t => {
      const searchLower = searchTerm.toLowerCase();
      
      // Apply status filter
      if (statusFilter && t.loopStatus !== statusFilter) return false;
      
      // Apply agent filter
      if (agentFilter && t.agent !== agentFilter) return false;
      
      // Apply search
      return (
        (t.address || '').toLowerCase().includes(searchLower) ||
        (t.agent || '').toLowerCase().includes(searchLower) ||
        (t.loopStatus || '').toLowerCase().includes(searchLower) ||
        (t.price || 0).toString().includes(searchLower)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'address':
          aVal = a.address || '';
          bVal = b.address || '';
          break;
        case 'price':
          aVal = a.price || a.salePrice || 0;
          bVal = b.price || b.salePrice || 0;
          break;
        case 'agent':
          aVal = a.agent || '';
          bVal = b.agent || '';
          break;
        case 'closingDate':
          aVal = a.closingDate ? new Date(a.closingDate).getTime() : 0;
          bVal = b.closingDate ? new Date(b.closingDate).getTime() : 0;
          break;
        case 'status':
          aVal = a.loopStatus || '';
          bVal = b.loopStatus || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, sortField, sortOrder, statusFilter, agentFilter, transactionUpdates]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleToggleSelect = (index: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      const allIndices = new Set(filteredTransactions.map((_, idx) => idx));
      setSelectedIds(allIndices);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setSelectedAgent('');
    setSelectedStatus('');
  };

  const handleBulkReassignAgent = () => {
    if (!selectedAgent || selectedIds.size === 0) return;
    
    // Store old values for undo
    const oldValues = new Map<number, string>();
    selectedIds.forEach(idx => {
      const oldAgent = filteredTransactions[idx].agent || 'Unknown';
      oldValues.set(idx, oldAgent);
    });

    // Create history entry
    const historyEntry: HistoryEntry = {
      action: 'reassign',
      selectedIndices: Array.from(selectedIds),
      oldValues,
      newValue: selectedAgent,
      timestamp: Date.now(),
    };

    // Apply changes
    const newUpdates = new Map(transactionUpdates);
    selectedIds.forEach(idx => {
      newUpdates.set(idx, { ...getUpdatedTransaction(filteredTransactions[idx], idx), agent: selectedAgent });
    });
    setTransactionUpdates(newUpdates);

    // Update history
    setUndoStack([...undoStack, historyEntry]);
    setRedoStack([]);

    toast.success(`Reassigned ${selectedIds.size} transaction(s) to ${selectedAgent}`);
    handleClearSelection();
  };

  const handleBulkUpdateStatus = () => {
    if (!selectedStatus || selectedIds.size === 0) return;
    
    // Store old values for undo
    const oldValues = new Map<number, string>();
    selectedIds.forEach(idx => {
      const oldStatus = filteredTransactions[idx].loopStatus || 'Unknown';
      oldValues.set(idx, oldStatus);
    });

    // Create history entry
    const historyEntry: HistoryEntry = {
      action: 'status_update',
      selectedIndices: Array.from(selectedIds),
      oldValues,
      newValue: selectedStatus,
      timestamp: Date.now(),
    };

    // Apply changes
    const newUpdates = new Map(transactionUpdates);
    selectedIds.forEach(idx => {
      newUpdates.set(idx, { ...getUpdatedTransaction(filteredTransactions[idx], idx), loopStatus: selectedStatus });
    });
    setTransactionUpdates(newUpdates);

    // Update history
    setUndoStack([...undoStack, historyEntry]);
    setRedoStack([]);

    toast.success(`Updated ${selectedIds.size} transaction(s) to ${selectedStatus}`);
    handleClearSelection();
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const lastEntry = undoStack[undoStack.length - 1];
    const newUpdates = new Map(transactionUpdates);

    // Restore old values
    lastEntry.selectedIndices.forEach(idx => {
      const oldValue = lastEntry.oldValues.get(idx);
      if (oldValue) {
        const updated = { ...getUpdatedTransaction(filteredTransactions[idx], idx) };
        if (lastEntry.action === 'reassign') {
          updated.agent = oldValue;
        } else {
          updated.loopStatus = oldValue;
        }
        newUpdates.set(idx, updated);
      }
    });

    setTransactionUpdates(newUpdates);
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack([...redoStack, lastEntry]);
    toast.success('Undo completed');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const lastEntry = redoStack[redoStack.length - 1];
    const newUpdates = new Map(transactionUpdates);

    // Apply changes again
    lastEntry.selectedIndices.forEach(idx => {
      const updated = { ...getUpdatedTransaction(filteredTransactions[idx], idx) };
      if (lastEntry.action === 'reassign') {
        updated.agent = lastEntry.newValue;
      } else {
        updated.loopStatus = lastEntry.newValue;
      }
      newUpdates.set(idx, updated);
    });

    setTransactionUpdates(newUpdates);
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack([...undoStack, lastEntry]);
    toast.success('Redo completed');
  };

  const handleExportCSV = () => {
    const headers = ['Address', 'Price', 'Agent', 'Closing Date', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.address || '',
      formatCurrency(t.price || t.salePrice || 0),
      t.agent || '',
      t.closingDate ? new Date(t.closingDate).toLocaleDateString() : '',
      t.loopStatus || '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}-transactions.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add summary stats
    doc.setFontSize(10);
    const totalVolume = filteredTransactions.reduce((sum, t) => sum + (t.price || t.salePrice || 0), 0);
    const avgPrice = filteredTransactions.length > 0 ? totalVolume / filteredTransactions.length : 0;
    
    doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 25);
    doc.text(`Total Volume: ${formatCurrency(totalVolume)}`, 14, 32);
    doc.text(`Average Price: ${formatCurrency(avgPrice)}`, 14, 39);
    doc.text(`Unique Agents: ${new Set(filteredTransactions.map(t => t.agent)).size}`, 14, 46);
    
    // Add table
    const tableData = filteredTransactions.map(t => [
      t.address || 'N/A',
      formatCurrency(t.price || t.salePrice || 0),
      t.agent || 'N/A',
      t.closingDate ? new Date(t.closingDate).toLocaleDateString() : 'N/A',
      t.loopStatus || 'Unknown',
    ]);
    
    (doc as any).autoTable({
      head: [['Address', 'Price', 'Agent', 'Closing Date', 'Status']],
      body: tableData,
      startY: 55,
      margin: { top: 55, right: 14, bottom: 14, left: 14 },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });
    
    doc.save(`${title}-transactions.pdf`);
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-2 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown
        className={`h-4 w-4 ${
          sortField === field ? 'text-primary' : 'text-muted-foreground'
        }`}
      />
    </button>
  );

  if (!isOpen) return null;

  const renderContent = () => (
    <>
      {/* Header */}
      <div className={`flex-shrink-0 flex items-center justify-between ${fullScreen ? 'px-6 py-4 border-b border-slate-700' : 'px-6 py-4 border-b'}`}>
        <h2 className={`font-display font-semibold ${fullScreen ? 'text-xl text-white' : 'text-lg'}`}>{title}</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className={fullScreen ? 'text-slate-400 hover:text-white' : ''}>
          <X className="h-4 w-4" />
        </Button>
      </div>

        <div className={`flex-1 overflow-y-auto space-y-4 ${fullScreen ? 'px-6 pb-6' : ''}`}>
          {/* Summary Stats */}
          <div className={`grid ${fullScreen ? 'grid-cols-5' : 'grid-cols-4'} gap-4`}>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
              <p className="text-2xl font-bold">{formatNumber(filteredTransactions.length)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  filteredTransactions.reduce((sum, t) => sum + (t.price || t.salePrice || 0), 0)
                )}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Average Price</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  filteredTransactions.length > 0
                    ? filteredTransactions.reduce((sum, t) => sum + (t.price || t.salePrice || 0), 0) /
                        filteredTransactions.length
                    : 0
                )}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Unique Agents</p>
              <p className="text-2xl font-bold">
                {new Set(filteredTransactions.map(t => t.agent)).size}
              </p>
            </Card>
            {fullScreen && (
              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <p className="text-sm text-muted-foreground mb-1">Selected</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedIds.size}</p>
              </Card>
            )}
          </div>

          {/* Quick Filters */}
          {fullScreen && (
            <Card className="p-4 bg-amber-500/5 border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium">Quick Filters</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setStatusFilter(statusFilter === 'Active' ? '' : 'Active')}
                  variant={statusFilter === 'Active' ? 'default' : 'outline'}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  onClick={() => setStatusFilter(statusFilter === 'Closed' ? '' : 'Closed')}
                  variant={statusFilter === 'Closed' ? 'default' : 'outline'}
                  size="sm"
                >
                  Closed
                </Button>
                <Button
                  onClick={() => setStatusFilter(statusFilter === 'Contract' ? '' : 'Contract')}
                  variant={statusFilter === 'Contract' ? 'default' : 'outline'}
                  size="sm"
                >
                  Contract
                </Button>
                
                <div className="w-px bg-border mx-2" />
                
                <Select value={agentFilter || "all"} onValueChange={(val) => setAgentFilter(val === "all" ? "" : val)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {uniqueAgents.map(agent => (
                      <SelectItem key={agent} value={agent}>
                        {agent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(statusFilter || agentFilter) && (
                  <Button
                    onClick={() => {
                      setStatusFilter('');
                      setAgentFilter('');
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Bulk Actions Toolbar */}
          {fullScreen && selectedIds.size > 0 && (
            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                
                <div className="flex items-center gap-2">
                  <Select value={selectedAgent || ""} onValueChange={setSelectedAgent}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Reassign agent..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueAgents.map(agent => (
                        <SelectItem key={agent} value={agent}>
                          {agent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleBulkReassignAgent}
                    disabled={!selectedAgent}
                    size="sm"
                  >
                    Reassign
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={selectedStatus || ""} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Update status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleBulkUpdateStatus}
                    disabled={!selectedStatus}
                    size="sm"
                  >
                    Update
                  </Button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Button 
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    variant="outline"
                    size="sm"
                    title="Undo last action"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    variant="outline"
                    size="sm"
                    title="Redo last action"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleClearSelection}
                    variant="outline"
                    size="sm"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Search and Export */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by address, agent, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>

          {/* Transaction Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                <tr>
                  {fullScreen && (
                    <th className="px-4 py-3 text-left w-10">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center justify-center hover:bg-muted rounded p-1"
                      >
                        {selectedIds.size === filteredTransactions.length ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className={`${fullScreen ? 'px-6 py-4' : 'px-4 py-3'} text-left font-semibold`}>
                    <SortHeader field="address" label="Address" />
                  </th>
                  <th className={`${fullScreen ? 'px-6 py-4' : 'px-4 py-3'} text-right font-semibold`}>
                    <SortHeader field="price" label="Price" />
                  </th>
                  <th className={`${fullScreen ? 'px-6 py-4' : 'px-4 py-3'} text-left font-semibold`}>
                    <SortHeader field="agent" label="Agent" />
                  </th>
                  <th className={`${fullScreen ? 'px-6 py-4' : 'px-4 py-3'} text-left font-semibold`}>
                    <SortHeader field="closingDate" label="Closing Date" />
                  </th>
                  <th className={`${fullScreen ? 'px-6 py-4' : 'px-4 py-3'} text-left font-semibold`}>
                    <SortHeader field="status" label="Status" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-muted/50 transition-colors ${
                        fullScreen && selectedIds.has(idx) ? 'bg-blue-500/10' : ''
                      }`}
                    >
                      {fullScreen && (
                        <td className="px-4 py-3 text-center w-10">
                          <button
                            onClick={() => handleToggleSelect(idx)}
                            className="flex items-center justify-center hover:bg-muted rounded p-1"
                          >
                            {selectedIds.has(idx) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className={`${fullScreen ? 'px-6 py-4' : 'px-4 py-3'} text-foreground`}>
                        {transaction.address || 'N/A'}
                      </td>
                      <td className={`${fullScreen ? 'px-6 py-4' : 'px-4 py-3'} text-right font-medium`}>
                        {formatCurrency(transaction.price || transaction.salePrice || 0)}
                      </td>
                      <td className={`${fullScreen ? 'px-6 py-4' : 'px-4 py-3'} text-foreground`}>
                        {transaction.agent || 'N/A'}
                      </td>
                      <td className={`${fullScreen ? 'px-6 py-4' : 'px-4 py-3'} text-muted-foreground text-sm`}>
                        {transaction.closingDate
                          ? new Date(transaction.closingDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className={`${fullScreen ? 'px-6 py-4' : 'px-4 py-3'}`}>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            transaction.loopStatus?.toLowerCase().includes('closed')
                              ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                              : transaction.loopStatus?.toLowerCase().includes('active')
                              ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                              : transaction.loopStatus?.toLowerCase().includes('contract')
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                              : 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {transaction.loopStatus || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={fullScreen ? 6 : 5} className={`${fullScreen ? 'px-6 py-12' : 'px-4 py-8'} text-center text-muted-foreground`}>
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0">
        <div className="w-screen h-screen max-w-none bg-slate-900 rounded-none flex flex-col">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg max-w-6xl max-h-[90vh] overflow-y-auto w-full mx-4">
        {renderContent()}
      </div>
    </div>
  );
}
