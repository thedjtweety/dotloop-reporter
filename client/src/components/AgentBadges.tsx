/**
 * Agent Badges Component
 * Displays one or multiple agents as individual tags/badges
 * Supports comma-separated agent names from multi-agent transactions
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface AgentBadgesProps {
  agents?: string;
  onAgentClick?: (agentName: string) => void;
  compact?: boolean;
  maxDisplay?: number;
}

export default function AgentBadges({
  agents,
  onAgentClick,
  compact = false,
  maxDisplay = 3,
}: AgentBadgesProps) {
  if (!agents || agents.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  // Split agents by comma and trim whitespace
  const agentList = agents
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  if (agentList.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const displayAgents = agentList.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, agentList.length - maxDisplay);

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? 'gap-0.5' : ''}`}>
      {displayAgents.map((agent, idx) => (
        <Badge
          key={`${agent}-${idx}`}
          variant="secondary"
          className={`
            text-foreground cursor-pointer hover:bg-primary/20 transition-colors
            ${compact ? 'text-xs px-2 py-0.5' : 'text-sm'}
          `}
          onClick={() => onAgentClick?.(agent)}
          title={`Click to view ${agent}'s transactions`}
        >
          {agent}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge
          variant="outline"
          className={`
            text-foreground/70 cursor-default
            ${compact ? 'text-xs px-2 py-0.5' : 'text-sm'}
          `}
          title={`${hiddenCount} more agent${hiddenCount > 1 ? 's' : ''}`}
        >
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
}
