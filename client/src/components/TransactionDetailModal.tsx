import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowUpDown, Download, X } from 'lucide-react';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  transactions: DotloopRecord[];
}

type SortField = 'address' | 'price' | 'agent' | 'closingDate' | 'status';
type SortOrder = 'asc' | 'desc';

export default function TransactionDetailModal({
  isOpen,
  onClose,
  title,
  transactions,
}: TransactionDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('closingDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      const searchLower = searchTerm.toLowerCase();
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
  }, [transactions, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExport = () => {
    const headers = ['Address', 'Price', 'Agent', 'Closing Date', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.address || '',
      t.price || t.salePrice || '',
      t.agent || '',
      t.closingDate || '',
      t.loopStatus || '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}-transactions.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
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
          </div>

          {/* Search and Export */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by address, agent, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Transaction Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    <SortHeader field="address" label="Address" />
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <SortHeader field="price" label="Price" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    <SortHeader field="agent" label="Agent" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    <SortHeader field="closingDate" label="Closing Date" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    <SortHeader field="status" label="Status" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction, idx) => (
                    <tr key={idx} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-foreground">
                        {transaction.address || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(transaction.price || transaction.salePrice || 0)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {transaction.agent || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {transaction.closingDate
                          ? new Date(transaction.closingDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
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
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
