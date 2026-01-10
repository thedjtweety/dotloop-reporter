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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">{title}</DialogTitle>
          <DialogDescription>
            Showing {transactions.length} transactions
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <TransactionTable transactions={transactions} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
