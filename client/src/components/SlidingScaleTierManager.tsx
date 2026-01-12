import React, { useState } from 'react';
import { CommissionTier } from '@/lib/commission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SlidingScaleTierManagerProps {
  tiers: CommissionTier[];
  onTiersChange: (tiers: CommissionTier[]) => void;
  useSliding: boolean;
  onUseSlidingChange: (value: boolean) => void;
}

export function SlidingScaleTierManager({
  tiers,
  onTiersChange,
  useSliding,
  onUseSlidingChange,
}: SlidingScaleTierManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState<number>(0);
  const [editSplit, setEditSplit] = useState<number>(0);

  const generateDescription = (threshold: number, split: number, nextThreshold?: number) => {
    const formatAmount = (amt: number) => {
      if (amt >= 1000000) return `$${(amt / 1000000).toFixed(1)}M`;
      if (amt >= 1000) return `$${(amt / 1000).toFixed(0)}K`;
      return `$${amt}`;
    };

    const agentShare = split;
    const brokerageShare = 100 - split;

    if (nextThreshold) {
      return `${formatAmount(threshold)}-${formatAmount(nextThreshold)}: ${agentShare}/${brokerageShare}`;
    } else {
      return `${formatAmount(threshold)}+: ${agentShare}/${brokerageShare}`;
    }
  };

  const addTier = () => {
    const newTier: CommissionTier = {
      id: `tier-${Date.now()}`,
      threshold: 0,
      splitPercentage: 60,
      description: '60/40',
    };
    const newTiers = [...tiers, newTier].sort((a, b) => a.threshold - b.threshold);
    onTiersChange(newTiers);
  };

  const updateTier = (id: string, threshold: number, split: number) => {
    const newTiers = tiers.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          threshold,
          splitPercentage: split,
          description: generateDescription(threshold, split),
        };
      }
      return t;
    });
    onTiersChange(newTiers.sort((a, b) => a.threshold - b.threshold));
  };

  const removeTier = (id: string) => {
    onTiersChange(tiers.filter((t) => t.id !== id));
  };

  const startEdit = (tier: CommissionTier) => {
    setEditingId(tier.id);
    setEditThreshold(tier.threshold);
    setEditSplit(tier.splitPercentage);
  };

  const saveEdit = () => {
    if (editingId) {
      updateTier(editingId, editThreshold, editSplit);
      setEditingId(null);
    }
  };

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Sliding Scale Commission</CardTitle>
              <CardDescription>
                Configure tiered commission splits based on YTD performance
              </CardDescription>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useSliding}
              onChange={(e) => onUseSlidingChange(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Enable Sliding Scale</span>
          </label>
        </div>
      </CardHeader>

      {useSliding && (
        <CardContent className="space-y-4">
          {sortedTiers.length === 0 ? (
            <div className="text-center py-8 text-foreground">
              <p className="mb-4">No tiers configured. Add your first tier to get started.</p>
              <Button onClick={addTier} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add First Tier
              </Button>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>YTD Threshold</TableHead>
                      <TableHead>Agent Split %</TableHead>
                      <TableHead>Company Split %</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTiers.map((tier, index) => (
                      <TableRow key={tier.id}>
                        <TableCell>
                          {editingId === tier.id ? (
                            <Input
                              type="number"
                              value={editThreshold}
                              onChange={(e) => setEditThreshold(Number(e.target.value))}
                              className="w-32"
                              min="0"
                              step="1000"
                            />
                          ) : (
                            <Badge variant="outline" className="font-mono">
                              ${tier.threshold.toLocaleString()}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === tier.id ? (
                            <Input
                              type="number"
                              value={editSplit}
                              onChange={(e) => setEditSplit(Number(e.target.value))}
                              className="w-24"
                              min="0"
                              max="100"
                            />
                          ) : (
                            <span className="font-semibold text-green-600">{tier.splitPercentage}%</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === tier.id ? (
                            <span className="font-semibold text-red-600">{100 - editSplit}%</span>
                          ) : (
                            <span className="font-semibold text-red-600">{100 - tier.splitPercentage}%</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {editingId === tier.id ? (
                            <span className="text-blue-600">
                              {generateDescription(editThreshold, editSplit)}
                            </span>
                          ) : (
                            tier.description
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingId === tier.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={saveEdit}
                                  className="h-8 px-2"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                  className="h-8 px-2"
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(tier)}
                                  className="h-8 px-2"
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeTier(tier.id)}
                                  className="h-8 px-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2">
                <Button onClick={addTier} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                  How Sliding Scale Works
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Agents earn better splits as they reach higher YTD thresholds</li>
                  <li>• Each tier applies when YTD reaches its threshold amount</li>
                  <li>• The split percentage shown is the agent's share of commission</li>
                  <li>• Tiers are automatically sorted by threshold amount</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      )}

      {!useSliding && (
        <CardContent>
          <div className="text-center py-8 text-foreground">
            <p className="text-sm">
              Sliding scale is currently disabled. Enable it above to configure tiered commission splits.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
