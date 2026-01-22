/**
 * Bulk Actions Toolbar Component
 * Floating toolbar for bulk operations on selected transactions
 */

import React from 'react';
import { Download, ExternalLink, Tag, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DotloopRecord } from '@/lib/csvParser';
import {
  performBulkExportCSV,
  performBulkExportExcel,
  performBulkOpenDotloop,
  getSelectionCount,
  getBulkActionSummary,
} from '@/lib/bulkActions';

interface BulkActionsToolbarProps {
  selectedRecords: DotloopRecord[];
  allRecords: DotloopRecord[];
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onOpenDotloop?: () => void;
  onTag?: () => void;
  onDelete?: () => void;
  title?: string;
  isVisible?: boolean;
}

export default function BulkActionsToolbar({
  selectedRecords,
  allRecords,
  onExportCSV,
  onExportExcel,
  onOpenDotloop,
  onTag,
  onDelete,
  title = 'Transactions',
  isVisible = true,
}: BulkActionsToolbarProps) {
  if (!isVisible || selectedRecords.length === 0) {
    return null;
  }

  const selectionCount = getSelectionCount(new Set(selectedRecords.map((_, i) => i.toString())));
  const percentage = Math.round((selectionCount / allRecords.length) * 100);

  const handleExportCSV = () => {
    performBulkExportCSV(allRecords, selectedRecords, title);
    onExportCSV?.();
  };

  const handleExportExcel = () => {
    performBulkExportExcel(allRecords, selectedRecords, title);
    onExportExcel?.();
  };

  const handleOpenDotloop = () => {
    performBulkOpenDotloop(selectedRecords);
    onOpenDotloop?.();
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {selectionCount} selected
            </span>
            <span className="text-xs text-slate-400">
              ({percentage}% of {allRecords.length})
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCSV}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-600"
        >
          <Download className="w-3 h-3 mr-1" />
          CSV
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportExcel}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-600"
        >
          <Download className="w-3 h-3 mr-1" />
          Excel
        </Button>

        {selectedRecords.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenDotloop}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-600"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Dotloop
          </Button>
        )}

        {onTag && (
          <Button
            size="sm"
            variant="outline"
            onClick={onTag}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-600"
          >
            <Tag className="w-3 h-3 mr-1" />
            Tag
          </Button>
        )}

        {onDelete && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="text-xs bg-red-900/50 hover:bg-red-900 text-red-200 border-red-700"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        )}
      </div>

      {/* Info Text */}
      <div className="mt-2 text-xs text-slate-400">
        {getBulkActionSummary(selectionCount, allRecords.length, 'export-csv')}
      </div>
    </div>
  );
}
