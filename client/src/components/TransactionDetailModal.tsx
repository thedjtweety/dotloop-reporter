import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowUpDown, Download, X, FileText, CheckSquare, Square, RotateCcw, RotateCw, Filter, Save, Bookmark, Trash2 } from 'lucide-react';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import { saveFilterPreset, getFilterPresets, deleteFilterPreset, formatPresetDate, FilterPreset } from '@/lib/filterPresets';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  
  // Preset state
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [savePresetName, setSavePresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [transactionUpdates, setTransactionUpdates] = useState<Map<number, Partial<DotloopRecord>>>(new Map());

  // Load presets on mount
  useEffect(() => {
    const loadedPresets = getFilterPresets('modal');
    setPresets(loadedPresets);
  }, []);

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
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'price') {
        aVal = a.salePrice || a.price || 0;
        bVal = b.salePrice || b.price || 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, statusFilter, agentFilter, sortField, sortOrder, transactionUpdates]);

  // Handle save preset
  const handleSavePreset = () => {
    if (!savePresetName.trim()) {
      toast.error('Preset name is required');
      return;
    }

    const preset = saveFilterPreset(
      savePresetName,
      { statusFilter, agentFilter },
      'modal'
    );

    if (preset) {
      setPresets([...presets, preset]);
      setSavePresetName('');
      setShowSaveDialog(false);
      toast.success(`Filter preset "${preset.name}" saved`);
    } else {
      toast.error('Failed to save preset');
    }
  };

  // Handle apply preset
  const handleApplyPreset = (preset: FilterPreset) => {
    setStatusFilter(preset.filters.statusFilter || '');
    setAgentFilter(preset.filters.agentFilter || '');
    toast.success(`Applied preset: ${preset.name}`);
  };

  // Handle delete preset
  const handleDeletePreset = (presetId: string) => {
    if (deleteFilterPreset(presetId, 'modal')) {
      setPresets(presets.filter(p => p.id !== presetId));
      toast.success('Preset deleted');
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setStatusFilter('');
    setAgentFilter('');
    setSearchTerm('');
    toast.success('Filters cleared');
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((_, i) => i)));
    }
  };

  // Handle toggle selection
  const handleToggleSelection = (index: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIds(newSelected);
  };

  // Handle bulk reassign
  const handleBulkReassign = () => {
    if (!selectedAgent || selectedIds.size === 0) {
      toast.error('Select transactions and an agent');
      return;
    }

    const oldValues = new Map<number, string>();
    const updates = new Map(transactionUpdates);

    selectedIds.forEach(idx => {
      const transaction = filteredTransactions[idx];
      oldValues.set(idx, transaction.agent || '');
      updates.set(idx, { ...updates.get(idx), agent: selectedAgent });
    });

    setTransactionUpdates(updates);
    setUndoStack([...undoStack, { action: 'reassign', selectedIndices: Array.from(selectedIds), oldValues, newValue: selectedAgent, timestamp: Date.now() }]);
    setRedoStack([]);
    setSelectedIds(new Set());
    setSelectedAgent('');
    toast.success(`Reassigned ${selectedIds.size} transactions to ${selectedAgent}`);
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = () => {
    if (!selectedStatus || selectedIds.size === 0) {
      toast.error('Select transactions and a status');
      return;
    }

    const oldValues = new Map<number, string>();
    const updates = new Map(transactionUpdates);

    selectedIds.forEach(idx => {
      const transaction = filteredTransactions[idx];
      oldValues.set(idx, transaction.loopStatus || '');
      updates.set(idx, { ...updates.get(idx), loopStatus: selectedStatus });
    });

    setTransactionUpdates(updates);
    setUndoStack([...undoStack, { action: 'status_update', selectedIndices: Array.from(selectedIds), oldValues, newValue: selectedStatus, timestamp: Date.now() }]);
    setRedoStack([]);
    setSelectedIds(new Set());
    setSelectedStatus('');
    toast.success(`Updated ${selectedIds.size} transactions to ${selectedStatus}`);
  };

  // Handle undo
  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const entry = undoStack[undoStack.length - 1];
    const updates = new Map(transactionUpdates);

    entry.selectedIndices.forEach(idx => {
      const oldValue = entry.oldValues.get(idx);
      if (entry.action === 'reassign') {
        updates.set(idx, { ...updates.get(idx), agent: oldValue });
      } else {
        updates.set(idx, { ...updates.get(idx), loopStatus: oldValue });
      }
    });

    setTransactionUpdates(updates);
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack([...redoStack, entry]);
    toast.success('Undo successful');
  };

  // Handle redo
  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const entry = redoStack[redoStack.length - 1];
    const updates = new Map(transactionUpdates);

    entry.selectedIndices.forEach(idx => {
      if (entry.action === 'reassign') {
        updates.set(idx, { ...updates.get(idx), agent: entry.newValue });
      } else {
        updates.set(idx, { ...updates.get(idx), loopStatus: entry.newValue });
      }
    });

    setTransactionUpdates(updates);
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack([...undoStack, entry]);
    toast.success('Redo successful');
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Address', 'Price', 'Agent', 'Status', 'Closing Date'];
    const rows = filteredTransactions.map(t => [
      t.address || '',
      formatCurrency(t.salePrice || t.price || 0),
      t.agent || '',
      t.loopStatus || '',
      t.closingDate ? new Date(t.closingDate).toLocaleDateString() : '',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  // Handle PDF export
  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add title
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    // Add filter info
    doc.setFontSize(10);
    let filterText = 'Filters: ';
    if (statusFilter) filterText += `Status: ${statusFilter} | `;
    if (agentFilter) filterText += `Agent: ${agentFilter} | `;
    filterText += `Total: ${filteredTransactions.length}`;
    doc.text(filterText, 14, 25);

    // Add table
    const tableData = filteredTransactions.map(t => [
      t.address || '',
      formatCurrency(t.salePrice || t.price || 0),
      t.agent || '',
      t.loopStatus || '',
      t.closingDate ? new Date(t.closingDate).toLocaleDateString() : '',
    ]);

    (doc as any).autoTable({
      head: [['Address', 'Price', 'Agent', 'Status', 'Closing Date']],
      body: tableData,
      startY: 35,
      margin: 14,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exported successfully');
  };

  const modalClass = fullScreen 
    ? 'fixed inset-0 w-screen h-screen z-50' 
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${modalClass} max-w-7xl max-h-screen overflow-y-auto`}>
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4">
          {/* Filter and Preset Toolbar */}
          <div className="space-y-3 p-4 bg-card/50 rounded-lg border border-border/50">
            {/* Search and Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Search address, agent, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-48"
              />
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status || ''}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Agents</SelectItem>
                  {uniqueAgents.map(agent => (
                    <SelectItem key={agent} value={agent || ''}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>

            {/* Presets Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Preset Name</label>
                      <Input
                        placeholder="e.g., My Team's Closed Deals"
                        value={savePresetName}
                        onChange={(e) => setSavePresetName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleSavePreset}
                      className="w-full"
                      size="sm"
                    >
                      Save Preset
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {presets.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Bookmark className="h-4 w-4" />
                      Presets ({presets.length})
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {presets.map(preset => (
                        <div
                          key={preset.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 border border-border/50"
                        >
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => handleApplyPreset(preset)}
                          >
                            <div className="font-medium text-sm">{preset.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatPresetDate(preset.createdAt)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePreset(preset.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <span className="text-sm text-muted-foreground ml-auto">
                {filteredTransactions.length} of {transactions.length} transactions
              </span>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedIds.size > 0 && (
            <div className="sticky top-20 bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3 flex-wrap z-10">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>

              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select agent..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueAgents.map(agent => (
                    <SelectItem key={agent} value={agent || ''}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleBulkReassign}
                size="sm"
                className="gap-2"
              >
                Reassign
              </Button>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status || ''}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleBulkStatusUpdate}
                size="sm"
                className="gap-2"
              >
                Update Status
              </Button>

              <Button
                variant="outline"
                onClick={() => setSelectedIds(new Set())}
                size="sm"
                className="ml-auto"
              >
                Clear Selection
              </Button>

              <Button
                variant="outline"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                size="sm"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Undo
              </Button>

              <Button
                variant="outline"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                size="sm"
                className="gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Redo
              </Button>
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-muted/70"
                    onClick={() => {
                      setSortField('address');
                      setSortOrder(sortField === 'address' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Address
                      {sortField === 'address' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-muted/70"
                    onClick={() => {
                      setSortField('price');
                      setSortOrder(sortField === 'price' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Price
                      {sortField === 'price' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-muted/70"
                    onClick={() => {
                      setSortField('agent');
                      setSortOrder(sortField === 'agent' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Agent
                      {sortField === 'agent' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-muted/70"
                    onClick={() => {
                      setSortField('status');
                      setSortOrder(sortField === 'status' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortField === 'status' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-muted/70"
                    onClick={() => {
                      setSortField('closingDate');
                      setSortOrder(sortField === 'closingDate' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      Closing Date
                      {sortField === 'closingDate' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No transactions match your filters
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <tr
                      key={index}
                      className={`border-b border-border hover:bg-muted/50 ${
                        selectedIds.has(index) ? 'bg-primary/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(index)}
                          onChange={() => handleToggleSelection(index)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">{transaction.address}</td>
                      <td className="px-4 py-3">{formatCurrency(transaction.salePrice || transaction.price || 0)}</td>
                      <td className="px-4 py-3">{transaction.agent || 'Unassigned'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {transaction.loopStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {transaction.closingDate
                          ? new Date(transaction.closingDate).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
