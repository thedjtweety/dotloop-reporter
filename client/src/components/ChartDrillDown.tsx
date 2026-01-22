/**
 * ChartDrillDown Component
 * Full-screen modal for displaying filtered transactions from any chart
 * Reusable across Lead Source, Property Type, Geographic, and Commission charts
 */

import React, { useState, useMemo } from 'react';
import { DotloopRecord } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, X, Download, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';
import { exportAsCSV, exportAsExcel, openPrintDialog } from '@/lib/exportUtils';
import { openMultipleInDotloop } from '@/lib/dotloopUtils';
import BulkActionsToolbar from './BulkActionsToolbar';
import FavoritesSelector from './FavoritesSelector';

interface ChartDrillDownProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filterType: 'leadSource' | 'propertyType' | 'geographic' | 'commission';
  filterValue: string;
  records: DotloopRecord[];
  onViewFullDetails?: () => void;
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

/**
 * Get status badge styling
 */
function getStatusBadgeColor(status: string | undefined): string {
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
}

/**
 * Format status display
 */
function getStatusDisplay(loopStatus: string | undefined): string {
  if (!loopStatus) return 'Unknown';
  return loopStatus.charAt(0).toUpperCase() + loopStatus.slice(1);
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
        <Badge className={getStatusBadgeColor(record.loopStatus)}>
          {getStatusDisplay(record.loopStatus)}
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

export const ChartDrillDown: React.FC<ChartDrillDownProps> = ({
  isOpen,
  onClose,
  title,
  filterType,
  filterValue,
  records,
  onViewFullDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0">
      {/* Modal Container - Full screen width */}
      <div className="w-screen h-screen max-w-none bg-slate-900 rounded-none flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
              {title}
              <Badge className={`${getBadgeColor(filterType)} text-xs`}>
                {filteredByChart.length}
              </Badge>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {getFilterLabel(filterType)}: <span className="font-semibold text-slate-300">{filterValue}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <FavoritesSelector
              filterType={filterType as any}
              filterValue={filterValue}
              onLoadFavorite={(fav) => {
                if (fav.filterValue) {
                  // Reload with the favorite's filter value
                }
              }}
            />
            <button
              onClick={() => exportAsCSV({
                title,
                records: filteredByChart,
                filters: { type: getFilterLabel(filterType), value: filterValue }
              })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Export as CSV"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => exportAsExcel({
                title,
                records: filteredByChart,
                filters: { type: getFilterLabel(filterType), value: filterValue }
              })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Export as Excel"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => openPrintDialog({
                title,
                records: filteredByChart,
                filters: { type: getFilterLabel(filterType), value: filterValue }
              })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Print"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {filteredByChart.length > 0 && (
              <button
                onClick={() => openMultipleInDotloop(filteredByChart)}
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
                <p className="text-sm">{searchTerm ? 'Try adjusting your search' : 'No data available for this filter'}</p>
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
            Showing {filteredRecords.length} of {filteredByChart.length} transaction{filteredByChart.length !== 1 ? 's' : ''}
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

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedRecords={Array.from(selectedRecords).map(index => filteredRecords[index])}
        allRecords={filteredRecords}
        title={title}
        isVisible={selectedRecords.size > 0}
      />
    </div>
  );
};

export default ChartDrillDown;
