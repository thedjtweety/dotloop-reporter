import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency } from '@/lib/formatUtils';
import { TrendingUp, AlertTriangle, Calendar, DollarSign } from 'lucide-react';

interface CommissionProjectorProps {
  records: DotloopRecord[];
}

export default function CommissionProjector({ records }: CommissionProjectorProps) {
  const [fallThroughRate, setFallThroughRate] = useState([10]); // Default 10% risk

  const projections = useMemo(() => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    let p30 = 0;
    let p60 = 0;
    let p90 = 0;
    let count30 = 0;
    let count60 = 0;
    let count90 = 0;

    records.forEach(record => {
      // Filter for active/pending/under contract deals
      const status = (record.loopStatus || '').toLowerCase();
      if (!status.includes('contract') && !status.includes('pending') && !status.includes('active')) {
        return;
      }

      const closingDate = record.closingDate ? new Date(record.closingDate) : null;
      if (!closingDate || isNaN(closingDate.getTime())) return;

      // Calculate potential commission (Company Dollar or Total Commission)
      // prioritizing company dollar if available, else total commission
      const commission = record.companyDollar || record.commissionTotal || (record.price * 0.03) || 0;

      if (closingDate <= thirtyDays && closingDate >= now) {
        p30 += commission;
        count30++;
      }
      if (closingDate <= sixtyDays && closingDate >= now) {
        p60 += commission;
        count60++;
      }
      if (closingDate <= ninetyDays && closingDate >= now) {
        p90 += commission;
        count90++;
      }
    });

    return { p30, p60, p90, count30, count60, count90 };
  }, [records]);

  const riskFactor = 1 - (fallThroughRate[0] / 100);

  return (
    <Card className="h-full border-l-4 border-l-emerald-500 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Commission Projector
            </CardTitle>
            <CardDescription>
              Forecasted revenue based on pending deals
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
          <p className="text-xs text-foreground/70">
            Adjust to account for deals that might not close.
          </p>
        </div>

        {/* Projections List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
              <span className="text-sm font-medium text-foreground/80">30 Days</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">{formatCurrency(projections.p30 * riskFactor)}</div>
              <div className="text-xs text-foreground/70">{projections.count30} deals</div>
            </div>
          </div>

          <div className="flex justify-between items-center border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
              <span className="text-sm font-medium text-foreground/80">60 Days</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">{formatCurrency(projections.p60 * riskFactor)}</div>
              <div className="text-xs text-foreground/70">{projections.count60} deals</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-foreground/80">90 Days</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">{formatCurrency(projections.p90 * riskFactor)}</div>
              <div className="text-xs text-foreground/70">{projections.count90} deals</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
