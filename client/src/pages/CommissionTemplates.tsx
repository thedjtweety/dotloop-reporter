import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, TrendingUp, Users, Zap, Target } from 'lucide-react';
import { useLocation } from 'wouter';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'performance' | 'team' | 'custom';
  splits: { tier: string; percentage: number; condition?: string }[];
  caps?: { tier: string; amount: number }[];
  bestFor: string[];
  example: {
    price: number;
    rate: number;
    commission: number;
  };
  pros: string[];
  cons: string[];
}

const templates: Template[] = [
  {
    id: 'standard-50-50',
    name: 'Standard 50/50 Split',
    description: 'Equal commission split between broker and agent. Most common structure.',
    category: 'standard',
    splits: [
      { tier: 'All transactions', percentage: 50 }
    ],
    bestFor: ['Established brokerages', 'Experienced agents', 'High-volume offices'],
    example: {
      price: 500000,
      rate: 3,
      commission: 7500
    },
    pros: [
      'Simple and transparent',
      'Fair for both parties',
      'Easy to communicate',
      'Predictable for agents'
    ],
    cons: [
      'No incentive for higher volume',
      'May not attract top performers',
      'Doesn\'t reward growth'
    ]
  },
  {
    id: 'standard-60-40',
    name: 'Broker-Favorable 60/40',
    description: 'Broker keeps 60%, agent gets 40%. Provides more revenue to broker.',
    category: 'standard',
    splits: [
      { tier: 'All transactions', percentage: 40 }
    ],
    bestFor: ['Brokers needing higher revenue', 'New brokerages', 'High-support teams'],
    example: {
      price: 500000,
      rate: 3,
      commission: 5000
    },
    pros: [
      'Higher broker revenue',
      'Sustainable for new brokerages',
      'Supports infrastructure costs',
      'Clear expectations'
    ],
    cons: [
      'Less attractive to agents',
      'May lose top talent',
      'Harder to recruit',
      'Competitive disadvantage'
    ]
  },
  {
    id: 'performance-tiered',
    name: 'Performance-Based Tiered',
    description: 'Commission increases with transaction volume. Rewards high performers.',
    category: 'performance',
    splits: [
      { tier: 'First $500K GCI', percentage: 50 },
      { tier: '$500K - $1M GCI', percentage: 55 },
      { tier: 'Over $1M GCI', percentage: 60 }
    ],
    bestFor: ['Competitive markets', 'Growth-focused brokerages', 'Top agent retention'],
    example: {
      price: 500000,
      rate: 3,
      commission: 7500
    },
    pros: [
      'Incentivizes high volume',
      'Rewards top performers',
      'Retains best agents',
      'Drives growth'
    ],
    cons: [
      'More complex to manage',
      'Harder to explain to new agents',
      'Requires tracking',
      'May create competition'
    ]
  },
  {
    id: 'performance-capped',
    name: 'High-Volume Capped',
    description: 'High split percentage with annual cap. Attracts volume but controls costs.',
    category: 'performance',
    splits: [
      { tier: 'All transactions', percentage: 70 }
    ],
    caps: [
      { tier: 'Annual cap', amount: 150000 }
    ],
    bestFor: ['High-volume agents', 'Market leaders', 'Retention strategy'],
    example: {
      price: 500000,
      rate: 3,
      commission: 10500
    },
    pros: [
      'Attracts top talent',
      'Predictable costs',
      'Competitive advantage',
      'Retains superstars'
    ],
    cons: [
      'High initial cost',
      'Complex calculations',
      'Requires monitoring',
      'May not suit all agents'
    ]
  },
  {
    id: 'new-agent-ramp',
    name: 'New Agent Ramp-Up',
    description: 'Higher initial split that decreases over time. Supports new agents.',
    category: 'team',
    splits: [
      { tier: 'Year 1', percentage: 80 },
      { tier: 'Year 2', percentage: 70 },
      { tier: 'Year 3+', percentage: 60 }
    ],
    bestFor: ['Recruiting new agents', 'Training programs', 'Building teams'],
    example: {
      price: 500000,
      rate: 3,
      commission: 12000
    },
    pros: [
      'Attracts new talent',
      'Supports training',
      'Builds loyalty',
      'Reduces risk'
    ],
    cons: [
      'High upfront cost',
      'Complex tracking',
      'Agents may leave after ramp',
      'Requires clear communication'
    ]
  },
  {
    id: 'team-pool',
    name: 'Team Pool Model',
    description: 'Shared commission pool split among team members. Encourages collaboration.',
    category: 'team',
    splits: [
      { tier: 'Team lead', percentage: 65 },
      { tier: 'Team members', percentage: 55 }
    ],
    bestFor: ['Team-based brokerages', 'Collaboration-focused', 'Large teams'],
    example: {
      price: 500000,
      rate: 3,
      commission: 8250
    },
    pros: [
      'Encourages teamwork',
      'Shared resources',
      'Easier to manage',
      'Builds culture'
    ],
    cons: [
      'May reduce individual motivation',
      'Complex calculations',
      'Potential conflicts',
      'Requires clear rules'
    ]
  },
  {
    id: 'custom-hybrid',
    name: 'Custom Hybrid Model',
    description: 'Combines multiple structures. Fully customizable for your needs.',
    category: 'custom',
    splits: [
      { tier: 'Base split', percentage: 50 },
      { tier: 'Volume bonus', percentage: 5, condition: 'per $500K GCI' },
      { tier: 'Referral bonus', percentage: 10, condition: 'per referral' }
    ],
    bestFor: ['Unique business models', 'Specialized markets', 'Complex scenarios'],
    example: {
      price: 500000,
      rate: 3,
      commission: 7500
    },
    pros: [
      'Fully customizable',
      'Aligns with business goals',
      'Competitive advantage',
      'Flexible'
    ],
    cons: [
      'Complex to manage',
      'Hard to explain',
      'Requires expertise',
      'May confuse agents'
    ]
  }
];

export default function CommissionTemplates() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (template: Template) => {
    const templateJSON = {
      name: template.name,
      description: template.description,
      splits: template.splits,
      caps: template.caps || [],
      bestFor: template.bestFor
    };
    
    const jsonString = JSON.stringify(templateJSON, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(template.id);
      toast.success(`✓ ${template.name} copied to clipboard!`, {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold',
        },
      });
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy to clipboard', {
        duration: 2000,
        position: 'top-center',
      });
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'standard':
        return <Target className="h-4 w-4" />;
      case 'performance':
        return <TrendingUp className="h-4 w-4" />;
      case 'team':
        return <Users className="h-4 w-4" />;
      case 'custom':
        return <Zap className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'standard':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'performance':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'team':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'custom':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      default:
        return '';
    }
  };

  const groupedTemplates = {
    standard: templates.filter(t => t.category === 'standard'),
    performance: templates.filter(t => t.category === 'performance'),
    team: templates.filter(t => t.category === 'team'),
    custom: templates.filter(t => t.category === 'custom')
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-foreground">Commission Plan Templates</h1>
          <p className="text-lg text-foreground/70">
            Choose from pre-built templates or customize your own commission structure
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Plans</TabsTrigger>
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          {/* All Plans */}
          <TabsContent value="all" className="space-y-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isCopied={copied === template.id}
                onCopy={() => handleCopy(template)}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                onSelect={() => setLocation('/commission-management')}
              />
            ))}
          </TabsContent>

          {/* Standard Plans */}
          <TabsContent value="standard" className="space-y-6">
            {groupedTemplates.standard.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isCopied={copied === template.id}
                onCopy={() => handleCopy(template)}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                onSelect={() => setLocation('/commission-management')}
              />
            ))}
          </TabsContent>

          {/* Performance Plans */}
          <TabsContent value="performance" className="space-y-6">
            {groupedTemplates.performance.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isCopied={copied === template.id}
                onCopy={() => handleCopy(template)}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                onSelect={() => setLocation('/commission-management')}
              />
            ))}
          </TabsContent>

          {/* Team Plans */}
          <TabsContent value="team" className="space-y-6">
            {groupedTemplates.team.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isCopied={copied === template.id}
                onCopy={() => handleCopy(template)}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                onSelect={() => setLocation('/commission-management')}
              />
            ))}
          </TabsContent>

          {/* Custom Plans */}
          <TabsContent value="custom" className="space-y-6">
            {groupedTemplates.custom.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isCopied={copied === template.id}
                onCopy={() => handleCopy(template)}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                onSelect={() => setLocation('/commission-management')}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  isCopied: boolean;
  onCopy: (template: Template) => void;
  getCategoryIcon: (category: string) => React.ReactNode;
  getCategoryColor: (category: string) => string;
  onSelect: () => void;
}

function TemplateCard({
  template,
  isCopied,
  onCopy,
  getCategoryIcon,
  getCategoryColor,
  onSelect
}: TemplateCardProps) {
  return (
    <Card className="p-6 border-border bg-card/50 hover:bg-card/80 transition-colors">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-foreground">{template.name}</h3>
              <Badge className={getCategoryColor(template.category)}>
                {getCategoryIcon(template.category)}
                <span className="ml-1 capitalize">{template.category}</span>
              </Badge>
            </div>
            <p className="text-foreground/70">{template.description}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Splits */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">Commission Splits</h4>
            <div className="space-y-2">
              {template.splits.map((split, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-background/50 rounded">
                  <span className="text-sm text-foreground/70">{split.tier}</span>
                  <span className="font-bold text-primary">{split.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Caps */}
          {template.caps && template.caps.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">Caps</h4>
              <div className="space-y-2">
                {template.caps.map((cap, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-background/50 rounded">
                    <span className="text-sm text-foreground/70">{cap.tier}</span>
                    <span className="font-bold text-emerald-500">${cap.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">Example</h4>
            <div className="space-y-2 p-3 bg-background/50 rounded">
              <div className="text-xs text-foreground/60">
                <div>Price: ${template.example.price.toLocaleString()}</div>
                <div>Rate: {template.example.rate}%</div>
              </div>
              <div className="text-sm font-bold text-primary">
                Commission: ${template.example.commission.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Best For */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-sm">Best For:</h4>
          <div className="flex flex-wrap gap-2">
            {template.bestFor.map((item, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">Pros</h4>
            <ul className="space-y-1 text-xs text-foreground/70">
              {template.pros.map((pro, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-orange-600 dark:text-orange-400 text-sm">Cons</h4>
            <ul className="space-y-1 text-xs text-foreground/70">
              {template.cons.map((con, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-orange-500">✗</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy(template)}
            className="flex-1"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Template
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={onSelect}
            className="flex-1"
          >
            Use This Plan
          </Button>
        </div>
      </div>
    </Card>
  );
}
