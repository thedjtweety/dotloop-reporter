/**
 * Agent Commission Modal Component
 * Full-screen modal for displaying commission ratio chart in detailed view
 * Design: Professional modal with chart visualization
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import CommissionRatioChart from './CommissionRatioChart';
import { AgentMetrics } from '@/lib/csvParser';

interface AgentCommissionModalProps {
  agent: AgentMetrics;
}

export default function AgentCommissionModal({ agent }: AgentCommissionModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        title="View commission breakdown"
        className="h-8 w-8 p-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0">
      {/* Modal Container - Full screen width */}
      <div className="w-screen h-screen max-w-none bg-slate-900 rounded-none flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-display font-semibold text-white">
              Commission Breakdown - {agent.agentName}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Total Commission: ${(agent.totalCommission || 0).toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <CommissionRatioChart agent={agent} chartType="donut" />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-700 bg-slate-800 flex items-center justify-end">
          <Button 
            onClick={() => setIsOpen(false)}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
