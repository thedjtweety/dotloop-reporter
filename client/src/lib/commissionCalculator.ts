import { DotloopRecord } from './csvParser';
import { 
  CommissionPlan, 
  Team, 
  AgentPlanAssignment, 
  getCommissionPlans, 
  getTeams, 
  getAgentAssignments 
} from './commission';

export interface AgentYTD {
  agentName: string;
  ytdCompanyDollar: number;
  capAmount: number;
  percentToCap: number;
  isCapped: boolean;
  planName: string;
  teamName?: string;
}

export interface AuditResult {
  recordId: string;
  loopName: string;
  closingDate: string;
  agentName: string;
  actualCompanyDollar: number;
  expectedCompanyDollar: number;
  difference: number;
  status: 'match' | 'overpaid' | 'underpaid';
  notes: string;
}

export function calculateCommissionAudit(records: DotloopRecord[]): { ytdStats: AgentYTD[], auditResults: AuditResult[] } {
  const plans = getCommissionPlans();
  const teams = getTeams();
  const assignments = getAgentAssignments();

  // Sort records by closing date to process chronologically (essential for capping)
  const sortedRecords = [...records].sort((a, b) => 
    new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime()
  );

  const agentYTDMap = new Map<string, number>();
  const auditResults: AuditResult[] = [];

  sortedRecords.forEach(record => {
    if (!record.agents) return;
    
    // Simple logic: If multiple agents, split GCI equally for audit purposes (unless we have specific split data)
    // For now, we'll assume the record's "Company Dollar" is the TOTAL for the deal.
    // We need to check if the CSV has per-agent rows or one row per deal.
    // Assuming one row per deal with comma-separated agents:
    const agents = record.agents.split(',').map(a => a.trim());
    const gciPerAgent = (record.commissionTotal || 0) / agents.length; // Simplified assumption
    const actualCompanyDollarPerAgent = (record.companyDollar || 0) / agents.length;

    agents.forEach(agentName => {
      const assignment = assignments.find(a => a.agentName === agentName);
      const plan = plans.find(p => p.id === assignment?.planId);
      const team = teams.find(t => t.id === assignment?.teamId);

      let expectedCompanyDollar = 0;
      let notes = '';

      if (plan) {
        const currentYTD = agentYTDMap.get(agentName) || 0;
        const remainingCap = Math.max(0, plan.capAmount - currentYTD);
        
        // Calculate Team Split first (if applicable)
        let agentGCI = gciPerAgent;
        if (team) {
          // Team takes their cut off the top? Or after split?
          // Usually: Team takes X%, then Brokerage takes Y% of remainder.
          // Let's assume Team Split comes off the top for now.
          const teamCut = agentGCI * (team.teamSplitPercentage / 100);
          agentGCI -= teamCut;
          notes += `Team Split: ${team.teamSplitPercentage}%; `;
        }

        // Calculate Brokerage Split
        let brokerageSplit = 0;
        
        if (remainingCap > 0) {
          // Agent is not capped yet
          const brokerageShare = 100 - plan.splitPercentage;
          const potentialCompanyDollar = agentGCI * (brokerageShare / 100);

          if (potentialCompanyDollar > remainingCap) {
            // Split deal (part capped, part uncapped)
            brokerageSplit = remainingCap + ((potentialCompanyDollar - remainingCap) * ((100 - plan.postCapSplit) / 100));
            notes += 'Hit Cap on this deal; ';
          } else {
            brokerageSplit = potentialCompanyDollar;
          }
        } else {
          // Already capped
          brokerageSplit = agentGCI * ((100 - plan.postCapSplit) / 100);
          notes += 'Capped; ';
        }

        expectedCompanyDollar = brokerageSplit;
        
        // Update YTD
        agentYTDMap.set(agentName, currentYTD + expectedCompanyDollar);
      } else {
        notes = 'No Plan Assigned';
      }

      // Audit Logic
      const diff = actualCompanyDollarPerAgent - expectedCompanyDollar;
      // Allow small floating point tolerance ($1.00)
      let status: AuditResult['status'] = 'match';
      if (Math.abs(diff) > 1) {
        status = diff > 0 ? 'overpaid' : 'underpaid'; // Wait, if Actual Company Dollar is HIGHER, agent paid MORE to broker?
        // Actually: Company Dollar = Broker Revenue.
        // If Actual > Expected, Broker got MORE -> Agent got LESS (Underpaid).
        // If Actual < Expected, Broker got LESS -> Agent got MORE (Overpaid).
        status = diff > 0 ? 'underpaid' : 'overpaid'; 
      }

      if (plan) {
        auditResults.push({
          recordId: record.loopId,
          loopName: record.loopName,
          closingDate: record.closingDate,
          agentName,
          actualCompanyDollar: actualCompanyDollarPerAgent,
          expectedCompanyDollar,
          difference: diff,
          status,
          notes
        });
      }
    });
  });

  // Generate YTD Stats
  const ytdStats: AgentYTD[] = assignments.map(assignment => {
    const plan = plans.find(p => p.id === assignment.planId);
    const team = teams.find(t => t.id === assignment.teamId);
    const ytd = agentYTDMap.get(assignment.agentName) || 0;
    const cap = plan?.capAmount || 0;

    return {
      agentName: assignment.agentName,
      ytdCompanyDollar: ytd,
      capAmount: cap,
      percentToCap: cap > 0 ? Math.min(100, (ytd / cap) * 100) : 100,
      isCapped: cap > 0 && ytd >= cap,
      planName: plan?.name || 'Unknown',
      teamName: team?.name
    };
  }).sort((a, b) => b.percentToCap - a.percentToCap);

  return { ytdStats, auditResults };
}
