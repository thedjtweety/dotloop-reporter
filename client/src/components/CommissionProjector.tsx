import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency } from '@/lib/formatUtils';
import { calculateCommissionForecast, applyRiskAdjustment } from '@/lib/commissionUtils';
import { calculateHistoricalCloseRate, calculateForecastedDeals } from '@/lib/projectionUtils';
import { TrendingUp, AlertTriangle, Calendar, DollarSign, Users, Zap } from 'lucide-react';
import CommissionPlanSimulator from './CommissionPlanSimulator';
import { CommissionPlan } from '@/lib/commissionSimulationUtils';

interface CommissionProjectorProps {
  records: DotloopRecord[];
  daysToForecast?: number;
}

export default function CommissionProjector({ records, daysToForecast = 30 }: CommissionProjectorProps) {
  const [fallThroughRate, setFallThroughRate] = useState([10]); // Default 10% risk
  const [showAgentBreakdown, setShowAgentBreakdown] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  // Calculate historical metrics
  const historicalCloseRate = useMemo(() => calculateHistoricalCloseRate(records), [records]);

  // Filter for under-contract deals
  const underContractDeals = useMemo(() => {
    return records.filter(r => 
      r.loopStatus?.toLowerCase().includes('contract') || 
      r.loopStatus?.toLowerCase().includes('pending')
    );
  }, [records]);

  // Calculate average days to close from historical data
  const avgDaysToClose = useMemo(() => {
    const closedDeals = records.filter(r => 
      r.loopStatus?.toLowerCase().includes('closed') || 
      r.loopStatus?.toLowerCase().includes('sold')
    );
    
    if (closedDeals.length === 0) return 45; // Default 45 days if no closed deals
    
    let totalDays = 0;
    let count = 0;
    
    closedDeals.forEach(deal => {
      if (deal.closingDate && deal.createdDate) {
        try {
          const created = new Date(deal.createdDate);
          const closed = new Date(deal.closingDate);
          const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          if (days > 0 && days < 365) { // Reasonable range
            totalDays += days;
            count++;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    
    return count > 0 ? Math.round(totalDays / count) : 45;
  }, [records]);

  // Calculate commission forecast with probability weighting
  const commissionData = useMemo(() => {
    try {
      return calculateCommissionForecast(underContractDeals, historicalCloseRate, avgDaysToClose, daysToForecast);
    } catch (e) {
      console.error('Error calculating commission forecast:', e);
      return {
        totalCommission: 0,
        dealCount: 0,
        avgCommissionPerDeal: 0,
        agentBreakdown: [],
        riskAdjustedCommission: 0,
      };
    }
  }, [records, historicalCloseRate, avgDaysToClose, daysToForecast]);

  // Apply risk adjustment
  const riskAdjustedCommission = useMemo(() => {
    return applyRiskAdjustment(commissionData.totalCommission, fallThroughRate[0]);
  }, [commissionData.totalCommission, fallThroughRate]);

  // Calculate timeframe-based projections for display
  const timeframeProjections = useMemo(() => {
    const p30 = applyRiskAdjustment(commissionData.totalCommission * 0.33, fallThroughRate[0]);
    const p60 = applyRiskAdjustment(commissionData.totalCommission * 0.67, fallThroughRate[0]);
    const p90 = applyRiskAdjustment(commissionData.totalCommission, fallThroughRate[0]);
    
    return { p30, p60, p90 };
  }, [commissionData.totalCommission, fallThroughRate]);

  // Get forecasted deals for simulator
  const forecastedDeals = useMemo(() => {
    return calculateForecastedDeals(underContractDeals, historicalCloseRate, avgDaysToClose, daysToForecast);
  }, [underContractDeals, historicalCloseRate, avgDaysToClose, daysToForecast]);

  // Current plan (for simulator)
  const currentPlan: CommissionPlan = {
    id: 'current',
    name: 'Current Plan',
    agentSplit: 60,
    companySplit: 40,
  };

  return (
    <>
    <Card className="h-full border-l-4 border-l-emerald-500 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Commission Projector
            </CardTitle>
            <CardDescription>
              Probability-weighted commission forecast ({historicalCloseRate}% close rate)
            </CardDescription>
          </div>
          <div className="bg-emerald-500/10 p-2 rounded-full">
            <DollarSign className="h-6 w-6 text-emerald-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Slider */}
        <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border/50">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Fall-through Risk Adjustment
            </label>
            <span className="text-sm font-bold text-amber-500">{fallThroughRate}%</span>
          </div>
          <Slider
            value={fallThroughRate}
            onValueChange={setFallThroughRate}
            max={50}
            step={1}
            className="py-2"
          />
          <p className="text-xs text-foreground">
            Adjust to account for deals that might not close. (0% = no adjustment, 50% = maximum risk)
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 bg-muted/20 p-4 rounded-lg border border-border/50">
          <div>
            <div className="text-xs text-muted-foreground font-medium">Projected Deals</div>
            <div className="text-lg font-bold text-foreground">{commissionData.dealCount}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Avg Commission/Deal</div>
            <div className="text-lg font-bold text-emerald-500">{formatCurrency(commissionData.avgCommissionPerDeal)}</div>
          </div>
        </div>

        {/* Timeframe Projections */}
        <div className="space-y-3 landscape:space-y-2">
          <div className="flex justify-between items-center border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
              <span className="text-sm font-medium text-foreground">30 Days</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">{formatCurrency(timeframeProjections.p30)}</div>
              <div className="text-xs text-muted-foreground">Risk-adjusted</div>
            </div>
          </div>

          <div className="flex justify-between items-center border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
              <span className="text-sm font-medium text-foreground">60 Days</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">{formatCurrency(timeframeProjections.p60)}</div>
              <div className="text-xs text-muted-foreground">Risk-adjusted</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-foreground">90 Days</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">{formatCurrency(timeframeProjections.p90)}</div>
              <div className="text-xs text-muted-foreground">Risk-adjusted</div>
            </div>
          </div>
        </div>

        {/* Agent Breakdown Toggle */}
        {commissionData.agentBreakdown.length > 0 && (
          <div className="space-y-3 border-t border-border/50 pt-4">
            <button
              onClick={() => setShowAgentBreakdown(!showAgentBreakdown)}
              className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-emerald-500 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Agent Breakdown ({commissionData.agentBreakdown.length} agents)
              </span>
              <span>{showAgentBreakdown ? '▼' : '▶'}</span>
            </button>

            {showAgentBreakdown && (
              <div className="space-y-2 bg-muted/20 p-3 rounded border border-border/50 max-h-48 overflow-y-auto">
                {commissionData.agentBreakdown.map((agent, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm pb-2 border-b border-border/30 last:border-0">
                    <div>
                      <div className="font-medium text-foreground">{agent.agent}</div>
                      <div className="text-xs text-muted-foreground">{agent.dealCount} deals</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-500">{formatCurrency(agent.totalCommission)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(agent.avgCommissionPerDeal)}/deal</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Simulator Button */}
        <Button
          onClick={() => setShowSimulator(true)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Zap className="h-4 w-4 mr-2" />
          Test Different Commission Plans
        </Button>

        {/* Data Quality Note */}
        <div className="text-xs text-muted-foreground bg-muted/10 p-2 rounded border border-border/30">
          <strong>Formula:</strong> Commission = Price × 3% × Probability × (1 - Risk%)
          <br />
          <strong>Based on:</strong> {commissionData.dealCount} forecasted deals, {historicalCloseRate}% historical close rate
        </div>
      </CardContent>
    </Card>

    {/* Commission Plan Simulator Modal */}
    <CommissionPlanSimulator
      isOpen={showSimulator}
      onClose={() => setShowSimulator(false)}
      deals={forecastedDeals}
      currentPlan={currentPlan}
      timeframe="30"
    />
    </>
  );
}
