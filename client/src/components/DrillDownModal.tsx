/**
 * DrillDownModal Component
 * Displays a modal with a list of transactions for a specific chart segment
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DotloopRecord } from '@/lib/csvParser';
import TransactionTable from './TransactionTable';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  transactions: DotloopRecord[];
}

export default function DrillDownModal({
  isOpen,
  onClose,
  title,
  transactions,
}: DrillDownModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col p-3 sm:p-6">
        <DialogHeader className="flex-shrink-0 pb-2 sm:pb-4 border-b">
          <DialogTitle className="text-lg sm:text-xl font-display">{title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-2 sm:mt-4 -mx-3 sm:mx-0">
          <TransactionTable transactions={transactions} compact />
        </div>
      </DialogContent>
    </Dialog>
  );
}
