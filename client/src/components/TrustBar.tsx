/**
 * TrustBar Component
 * Displays minimalist stat cards to build trust and credibility
 */

import AnimatedCounter from './AnimatedCounter';
import { TrendingUp, Users, Building2, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function TrustBar() {
  return (
    <div className="w-full mt-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 border-border/50 bg-card/50 backdrop-blur-sm group">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-lg md:text-xl font-bold text-foreground font-display truncate w-full px-1">
                <AnimatedCounter value={500000000} prefix="$" suffix="+" isCurrency />
              </div>
              <div className="text-xs text-foreground uppercase tracking-wide font-medium">
                Volume Analyzed
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 border-border/50 bg-card/50 backdrop-blur-sm group">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-lg md:text-xl font-bold text-foreground font-display truncate w-full px-1">
                <AnimatedCounter value={12500} suffix="+" />
              </div>
              <div className="text-xs text-foreground uppercase tracking-wide font-medium">
                Transactions
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 border-border/50 bg-card/50 backdrop-blur-sm group">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-lg md:text-xl font-bold text-foreground font-display truncate w-full px-1">
                <AnimatedCounter value={850} suffix="+" />
              </div>
              <div className="text-xs text-foreground uppercase tracking-wide font-medium">
                Agents Tracked
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 border-border/50 bg-card/50 backdrop-blur-sm group">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-lg md:text-xl font-bold text-foreground font-display truncate w-full px-1">
                <AnimatedCounter value={98} suffix="%" />
              </div>
              <div className="text-xs text-foreground uppercase tracking-wide font-medium">
                Accuracy Rate
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
