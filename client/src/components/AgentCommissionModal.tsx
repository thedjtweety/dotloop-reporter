/**
 * Agent Commission Modal Component
 * Displays commission ratio chart in a modal dialog for detailed view
 * Design: Professional modal with chart visualization
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import CommissionRatioChart from './CommissionRatioChart';
import { AgentMetrics } from '@/lib/csvParser';

interface AgentCommissionModalProps {
  agent: AgentMetrics;
}

export default function AgentCommissionModal({ agent }: AgentCommissionModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        title="View commission breakdown"
        className="h-8 w-8 p-0"
      >
        <BarChart3 className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Commission Breakdown - {agent.agentName}</DialogTitle>
          </DialogHeader>
          <CommissionRatioChart agent={agent} chartType="donut" />
        </DialogContent>
      </Dialog>
    </>
  );
}
