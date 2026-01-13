/**
 * PipelineChartDrillDown Component
 * Modal that displays transaction list for a selected pipeline status
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';

interface PipelineChartDrillDownProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
  records: DotloopRecord[];
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
 * Note: This is a placeholder - actual URL structure depends on your Dotloop integration
 */
function getDotloopUrl(record: DotloopRecord): string {
  // If you have a dotloopId or similar field, use it to construct the URL
  // This is a generic format - adjust based on your actual Dotloop setup
  if (record.dotloopId) {
    return `https://dotloop.com/p/${record.dotloopId}`;
  }
  // Fallback: use transaction ID if available
  if (record.transactionId) {
    return `https://dotloop.com/p/${record.transactionId}`;
  }
  // If no ID available, return empty string (button will be disabled)
  return '';
}

export const PipelineChartDrillDown: React.FC<PipelineChartDrillDownProps> = ({
  isOpen,
  onClose,
  status,
  records,
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
      record.salePrice?.toString().includes(term)
    );
  }, [filteredByStatus, searchTerm]);

  const getStatusDisplay = (loopStatus: string | undefined): string => {
    if (!loopStatus) return 'Unknown';
    return loopStatus.charAt(0).toUpperCase() + loopStatus.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
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
              placeholder="Search by address, agent, or property type..."
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

        {/* Transactions Table */}
        <div className="flex-1 overflow-auto">
          {filteredRecords.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              {searchTerm ? 'No transactions match your search' : 'No transactions found'}
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50">
                <TableRow>
                  <TableHead className="min-w-[250px]">Address</TableHead>
                  <TableHead className="min-w-[150px]">Agent</TableHead>
                  <TableHead className="min-w-[120px]">Property Type</TableHead>
                  <TableHead className="text-right min-w-[130px]">Sale Price</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="text-center min-w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, idx) => {
                  const dotloopUrl = getDotloopUrl(record);
                  return (
                    <TableRow key={idx} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-sm">
                        {record.address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.agents || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.propertyType || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {record.salePrice ? formatCurrency(record.salePrice) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(record.loopStatus || '')}>
                          {getStatusDisplay(record.loopStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {dotloopUrl ? (
                          <a
                            href={dotloopUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                            title="View in Dotloop"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-xs">View</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">No ID</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredRecords.length} of {filteredByStatus.length} transaction{filteredByStatus.length !== 1 ? 's' : ''}
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PipelineChartDrillDown;
