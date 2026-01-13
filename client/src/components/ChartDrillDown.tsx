/**
 * ChartDrillDown Component
 * Generic modal for displaying filtered transactions from any chart
 * Reusable across Lead Source, Property Type, Geographic, and Commission charts
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

interface ChartDrillDownProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filterType: 'leadSource' | 'propertyType' | 'geographic' | 'commission';
  filterValue: string;
  records: DotloopRecord[];
}

/**
 * Filter records based on chart type and value
 */
function filterRecordsByChart(
  records: DotloopRecord[],
  filterType: string,
  filterValue: string
): DotloopRecord[] {
  return records.filter(record => {
    switch (filterType) {
      case 'leadSource':
        return record.leadSource?.toLowerCase() === filterValue.toLowerCase();
      case 'propertyType':
        return record.propertyType?.toLowerCase() === filterValue.toLowerCase();
      case 'geographic':
        // Geographic can be city, county, or state
        return (
          record.city?.toLowerCase() === filterValue.toLowerCase() ||
          record.county?.toLowerCase() === filterValue.toLowerCase() ||
          record.state?.toLowerCase() === filterValue.toLowerCase()
        );
      case 'commission':
        // Commission type could be "Buy Side" or "Sell Side"
        return record.commissionType?.toLowerCase() === filterValue.toLowerCase();
      default:
        return false;
    }
  });
}

/**
 * Get badge color based on filter type
 */
function getBadgeColor(filterType: string): string {
  switch (filterType) {
    case 'leadSource':
      return 'bg-purple-100 text-purple-800';
    case 'propertyType':
      return 'bg-indigo-100 text-indigo-800';
    case 'geographic':
      return 'bg-cyan-100 text-cyan-800';
    case 'commission':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get display label for filter type
 */
function getFilterLabel(filterType: string): string {
  switch (filterType) {
    case 'leadSource':
      return 'Lead Source';
    case 'propertyType':
      return 'Property Type';
    case 'geographic':
      return 'Location';
    case 'commission':
      return 'Commission Type';
    default:
      return 'Filter';
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

export const ChartDrillDown: React.FC<ChartDrillDownProps> = ({
  isOpen,
  onClose,
  title,
  filterType,
  filterValue,
  records,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter records by chart type
  const filteredByChart = useMemo(
    () => filterRecordsByChart(records, filterType, filterValue),
    [records, filterType, filterValue]
  );

  // Further filter by search term
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return filteredByChart;

    const term = searchTerm.toLowerCase();
    return filteredByChart.filter(record =>
      record.address?.toLowerCase().includes(term) ||
      record.agents?.toLowerCase().includes(term) ||
      record.propertyType?.toLowerCase().includes(term) ||
      record.salePrice?.toString().includes(term) ||
      record.loopStatus?.toLowerCase().includes(term)
    );
  }, [filteredByChart, searchTerm]);

  const getStatusBadgeColor = (status: string | undefined): string => {
    if (!status) return 'bg-gray-100 text-gray-800';
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
  };

  const getStatusDisplay = (loopStatus: string | undefined): string => {
    if (!loopStatus) return 'Unknown';
    return loopStatus.charAt(0).toUpperCase() + loopStatus.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            <Badge className={getBadgeColor(filterType)}>
              {filteredByChart.length}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {getFilterLabel(filterType)}: <span className="font-semibold">{filterValue}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="flex gap-2 px-6 py-3 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by address, agent, property type, or status..."
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
                        <Badge className={getStatusBadgeColor(record.loopStatus)}>
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
            Showing {filteredRecords.length} of {filteredByChart.length} transaction{filteredByChart.length !== 1 ? 's' : ''}
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChartDrillDown;
