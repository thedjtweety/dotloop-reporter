/**
 * TrustBar Component
 * Displays animated counters to build trust and excitement
 */

import AnimatedCounter from './AnimatedCounter';
import { TrendingUp, Users, Building2, DollarSign } from 'lucide-react';

export default function TrustBar() {
  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-sm border-t border-white/10 py-8 mt-[-2px]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-full bg-emerald-500/10 mb-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white font-display">
              <AnimatedCounter value={500000000} prefix="$" suffix="+" isCurrency />
            </div>
            <div className="text-sm text-slate-400 uppercase tracking-wider font-medium">
              Volume Analyzed
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-full bg-blue-500/10 mb-2">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white font-display">
              <AnimatedCounter value={12500} suffix="+" />
            </div>
            <div className="text-sm text-slate-400 uppercase tracking-wider font-medium">
              Transactions Processed
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-full bg-purple-500/10 mb-2">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white font-display">
              <AnimatedCounter value={850} suffix="+" />
            </div>
            <div className="text-sm text-slate-400 uppercase tracking-wider font-medium">
              Agents Tracked
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-full bg-orange-500/10 mb-2">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white font-display">
              <AnimatedCounter value={98} suffix="%" />
            </div>
            <div className="text-sm text-slate-400 uppercase tracking-wider font-medium">
              Accuracy Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
