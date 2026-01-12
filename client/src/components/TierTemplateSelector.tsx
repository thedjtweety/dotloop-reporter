import React, { useState } from 'react';
import {
  TIER_TEMPLATES,
  getAllCategories,
  getTemplatesByCategory,
  applyTemplateToTiers,
  type TierTemplate,
} from '@/lib/tier-templates';
import { CommissionTier } from '@/lib/commission';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Copy, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TierTemplateSelectorProps {
  onSelectTemplate: (tiers: CommissionTier[]) => void;
}

export function TierTemplateSelector({ onSelectTemplate }: TierTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TierTemplate | null>(null);
  const categories = getAllCategories();

  const handleApplyTemplate = (template: TierTemplate) => {
    const tiers = applyTemplateToTiers(template.id);
    if (tiers) {
      onSelectTemplate(tiers);
      setSelectedTemplate(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'aggressive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'conservative':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'balanced':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'high-volume':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap className="h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commission Tier Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-built tier structure or customize your own
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category.replace('-', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {getTemplatesByCategory(category as any).map((template) => (
                <Card key={template.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category}
                          </Badge>
                        </div>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplyTemplate(template)}
                        className="gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Apply
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground/70">Tier Structure:</p>
                      <div className="space-y-1">
                        {template.tiers.map((tier, index) => (
                          <div
                            key={tier.id}
                            className="flex items-center justify-between text-sm bg-muted p-2 rounded"
                          >
                            <span className="font-medium">Tier {index + 1}</span>
                            <span className="text-foreground/70">{tier.description}</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {tier.splitPercentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
            Template Guide
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              <strong>Aggressive Growth:</strong> Steep increases to motivate high performance
            </li>
            <li>
              <strong>Conservative:</strong> Modest increases with stable base for established teams
            </li>
            <li>
              <strong>Balanced Growth:</strong> Moderate increases for most brokerages
            </li>
            <li>
              <strong>High Volume:</strong> Incentivizes transaction count for high-transaction brokerages
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
