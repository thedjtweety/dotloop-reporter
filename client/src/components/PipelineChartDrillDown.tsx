/**
 * PipelineChartDrillDown Component
 * Card-based layout for displaying transaction list for a selected pipeline status
 * Allows users to view transaction details and access Dotloop links
 */

import React, { useState, useMemo } from 'react';
import { DotloopRecord } from '@/lib/csvParser';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';

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
    <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Status Badge */}
      <div className="flex-shrink-0">
        <Badge className={getStatusBadgeColor(record.loopStatus || '')}>
          {record.loopStatus ? record.loopStatus.charAt(0).toUpperCase() + record.loopStatus.slice(1) : 'Unknown'}
        </Badge>
      </div>

      {/* Address and Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground truncate">
          {record.address || 'N/A'}
        </h3>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
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
            className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            title="View in Dotloop"
          >
            <ExternalLink className="w-4 h-4" />
            View
          </a>
        ) : (
          <Button variant="ghost" size="sm" disabled>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status} Transactions
            <Badge className={getStatusBadgeColor(status)}>
              {filteredByStatus.length}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View all transactions with {status.toLowerCase()} status
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="flex gap-2 px-6 py-3 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by address, agent, property type, or price..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="h-10"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Transactions Cards */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredRecords.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              {searchTerm ? 'No transactions match your search' : 'No transactions found'}
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
        <div className="px-6 py-3 border-t flex items-center justify-between bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Showing {filteredRecords.length} of {filteredByStatus.length} transaction{filteredByStatus.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            {onViewFullDetails && (
              <Button variant="default" onClick={onViewFullDetails}>
                View Full Details
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PipelineChartDrillDown;
