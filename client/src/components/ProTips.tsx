import { Lightbulb, Zap, BarChart3, FileDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ProTip {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip: string;
}

const proTips: ProTip[] = [
  {
    icon: <Zap className="h-6 w-6 text-primary" />,
    title: 'Bulk Assign Commissions',
    description: 'Save hours of manual setup',
    tip: 'Select multiple agents at once and assign them to a commission plan in seconds. Perfect for onboarding new brokerages.',
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    title: 'Drill-Down Analytics',
    description: 'Uncover hidden insights',
    tip: 'Click any chart segment to filter your entire dashboard. Discover trends by property type, location, or agent.',
  },
  {
    icon: <FileDown className="h-6 w-6 text-primary" />,
    title: 'Export in Multiple Formats',
    description: 'Share data your way',
    tip: 'Export reports as CSV, Excel, or PDF. Customize date ranges and selected agents before exporting.',
  },
  {
    icon: <Lightbulb className="h-6 w-6 text-primary" />,
    title: 'Commission Templates',
    description: 'Pre-built structures ready to use',
    tip: 'Choose from 7 proven commission templates (50/50, 60/40, high-volume, etc.) or create custom plans.',
  },
];

export default function ProTips() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Pro Tips</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {proTips.map((tip, index) => (
          <Card key={index} className="p-4 border border-border hover:border-primary/50 transition-colors">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">{tip.icon}</div>
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-semibold text-sm">{tip.title}</h4>
                  <p className="text-xs text-foreground/60">{tip.description}</p>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">{tip.tip}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
