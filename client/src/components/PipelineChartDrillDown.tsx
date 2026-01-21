/**
 * PipelineChartDrillDown Component
 * Full-screen modal for displaying transaction list for a selected pipeline status
 * Allows users to view transaction details and access Dotloop links
 */

import React, { useState, useMemo } from 'react';
import { DotloopRecord } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, X, Download, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';
import { exportAsCSV, exportAsExcel, openPrintDialog } from '@/lib/exportUtils';

interface PipelineChartDrillDownProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
  records: DotloopRecord[];
  onViewFullDetails?: () => void;
}

/**
 * Map pipeline status to Dotloop loop status values
 */
function mapStatusToLoopStatus(status: string): string[] {
  const statusMap: Record<string, string[]> = {
    'Closed': ['Closed', 'Sold'],
    'Active': ['Active Listings'],
    'Under Contract': ['Under Contract', 'Pending'],
    'Archived': ['Archived', 'Withdrawn'],
  };
  return statusMap[status] || [status];
}

/**
 * Get badge color for status
 */
function getStatusBadgeColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'closed':
    case 'sold':
      return 'bg-green-100 text-green-800';
    case 'active listings':
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'under contract':
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'archived':
    case 'withdrawn':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Generate Dotloop view URL
 */
function getDotloopUrl(record: DotloopRecord): string {
  if (record.dotloopId) {
    return `https://dotloop.com/p/${record.dotloopId}`;
  }
  if (record.transactionId) {
    return `https://dotloop.com/p/${record.transactionId}`;
  }
  return '';
}

/**
 * Transaction Card Component
 */
function TransactionCard({ record }: { record: DotloopRecord }) {
  const dotloopUrl = getDotloopUrl(record);

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
      {/* Status Badge */}
      <div className="flex-shrink-0">
        <Badge className={getStatusBadgeColor(record.loopStatus || '')}>
          {record.loopStatus ? record.loopStatus.charAt(0).toUpperCase() + record.loopStatus.slice(1) : 'Unknown'}
        </Badge>
      </div>

      {/* Address and Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-white truncate">
          {record.address || 'N/A'}
        </h3>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
          <span className="truncate">
            <span className="font-medium">Agent:</span> {record.agents || 'N/A'}
          </span>
          <span className="truncate">
            <span className="font-medium">Type:</span> {record.propertyType || 'N/A'}
          </span>
          <span className="truncate">
            <span className="font-medium">Price:</span> {record.salePrice ? formatCurrency(record.salePrice) : 'N/A'}
          </span>
        </div>
      </div>

      {/* View Button */}
      <div className="flex-shrink-0">
        {dotloopUrl ? (
          <a
            href={dotloopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium"
            title="View in Dotloop"
          >
            <ExternalLink className="w-4 h-4" />
            View
          </a>
        ) : (
          <Button variant="ghost" size="sm" disabled className="text-slate-500">
            No ID
          </Button>
        )}
      </div>
    </div>
  );
}

export const PipelineChartDrillDown: React.FC<PipelineChartDrillDownProps> = ({
  isOpen,
  onClose,
  status,
  records,
  onViewFullDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter records by status
  const targetStatuses = mapStatusToLoopStatus(status);
  const filteredByStatus = records.filter(r =>
    targetStatuses.some(s => r.loopStatus?.toLowerCase() === s.toLowerCase())
  );

  // Further filter by search term
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return filteredByStatus;

    const term = searchTerm.toLowerCase();
    return filteredByStatus.filter(record =>
      record.address?.toLowerCase().includes(term) ||
      record.agents?.toLowerCase().includes(term) ||
      record.propertyType?.toLowerCase().includes(term) ||
      record.salePrice?.toString().includes(term) ||
      record.loopStatus?.toLowerCase().includes(term)
    );
  }, [filteredByStatus, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0">
      {/* Modal Container - Full screen width */}
      <div className="w-screen h-screen max-w-none bg-slate-900 rounded-none flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
              {status} Transactions
              <Badge className={`${getStatusBadgeColor(status)} text-xs`}>
                {filteredByStatus.length}
              </Badge>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              View all transactions with {status.toLowerCase()} status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportAsCSV({
                title: `Pipeline: ${status}`,
                records: filteredByStatus,
                filters: { type: 'Pipeline Status', value: status }
              })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Export as CSV"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => exportAsExcel({
                title: `Pipeline: ${status}`,
                records: filteredByStatus,
                filters: { type: 'Pipeline Status', value: status }
              })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Export as Excel"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => openPrintDialog({
                title: `Pipeline: ${status}`,
                records: filteredByStatus,
                filters: { type: 'Pipeline Status', value: status }
              })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Print"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-700 bg-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by address, agent, property type, or price..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredRecords.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <p className="text-lg font-medium mb-1">No transactions found</p>
                <p className="text-sm">{searchTerm ? 'Try adjusting your search' : 'No data available for this status'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record, idx) => (
                <TransactionCard key={idx} record={record} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-700 bg-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {filteredRecords.length} of {filteredByStatus.length} transaction{filteredByStatus.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            {onViewFullDetails && (
              <Button 
                onClick={onViewFullDetails}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                View Full Details
              </Button>
            )}
            <Button 
              onClick={onClose}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineChartDrillDown;
