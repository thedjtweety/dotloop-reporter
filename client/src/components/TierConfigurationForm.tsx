/**
 * Tier Configuration Form Component
 * 
 * Allows users to configure commission tiers with real-time validation
 * Ensures thresholds are in ascending order and prevents overlapping ranges
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  validateTiers,
  detectOverlappingRanges,
  getTierRangeString,
  suggestDefaultTiers,
  formatValidationErrors,
  type ValidationError,
} from '@/lib/tier-validation';
import { Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import type { CommissionTier } from '@/lib/commission';

interface TierConfigurationFormProps {
  tiers: CommissionTier[];
  onTiersChange: (tiers: CommissionTier[]) => void;
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void;
}

export default function TierConfigurationForm({
  tiers,
  onTiersChange,
  onValidationChange,
}: TierConfigurationFormProps) {
  const [localTiers, setLocalTiers] = useState<CommissionTier[]>(tiers);
  const [validationResult, setValidationResult] = useState(validateTiers(localTiers));

  // Validate tiers whenever they change
  const handleValidation = useCallback((newTiers: CommissionTier[]) => {
    const result = validateTiers(newTiers);
    setValidationResult(result);
    onValidationChange?.(result.valid, result.errors);
    return result;
  }, [onValidationChange]);

  const handleTierChange = (index: number, field: keyof CommissionTier, value: any) => {
    const newTiers = [...localTiers];
    
    if (field === 'threshold' || field === 'splitPercentage') {
      newTiers[index] = {
        ...newTiers[index],
        [field]: typeof value === 'string' ? parseInt(value) : value,
      };
    } else {
      newTiers[index] = {
        ...newTiers[index],
        [field]: value,
      };
    }

    setLocalTiers(newTiers);
    handleValidation(newTiers);
    onTiersChange(newTiers);
  };

  const handleAddTier = () => {
    const newTier: CommissionTier = {
      id: `tier-${Date.now()}`,
      threshold: localTiers.length > 0 
        ? Math.max(...localTiers.map(t => t.threshold)) + 50000
        : 0,
      splitPercentage: 60,
      description: '',
    };

    const newTiers = [...localTiers, newTier];
    setLocalTiers(newTiers);
    handleValidation(newTiers);
    onTiersChange(newTiers);
  };

  const handleRemoveTier = (index: number) => {
    if (localTiers.length <= 1) {
      alert('At least one tier is required');
      return;
    }

    const newTiers = localTiers.filter((_, i) => i !== index);
    setLocalTiers(newTiers);
    handleValidation(newTiers);
    onTiersChange(newTiers);
  };

  const handleUseSuggestedTiers = (count: number) => {
    const suggested = suggestDefaultTiers(count);
    setLocalTiers(suggested);
    handleValidation(suggested);
    onTiersChange(suggested);
  };

  const hasOverlaps = detectOverlappingRanges(localTiers);

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      {!validationResult.valid && validationResult.errors.length > 0 && (
        <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="font-semibold mb-2">Tier Configuration Issues:</div>
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {formatValidationErrors(validationResult.errors)}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      {validationResult.valid && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Tier configuration is valid
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Templates */}
      <Card className="p-4 bg-card border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Templates</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUseSuggestedTiers(2)}
            className="text-xs"
          >
            2-Tier Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUseSuggestedTiers(3)}
            className="text-xs"
          >
            3-Tier Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUseSuggestedTiers(4)}
            className="text-xs"
          >
            4-Tier Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUseSuggestedTiers(5)}
            className="text-xs"
          >
            5-Tier Plan
          </Button>
        </div>
      </Card>

      {/* Tier Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Commission Tiers</h3>
          <Button
            onClick={handleAddTier}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Tier
          </Button>
        </div>

        {localTiers.length === 0 ? (
          <Card className="p-8 bg-card border border-border text-center">
            <p className="text-foreground mb-4">No tiers configured</p>
            <Button onClick={handleAddTier} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Tier
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {localTiers.map((tier, index) => (
              <Card key={tier.id} className="p-4 bg-card border border-border">
                <div className="space-y-4">
                  {/* Tier Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Tier {index}</h4>
                    {localTiers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTier(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Tier Range Display */}
                  <div className="text-sm text-foreground bg-background/50 p-2 rounded">
                    Range: {getTierRangeString(
                      tier,
                      index < localTiers.length - 1 ? localTiers[index + 1].threshold : undefined
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Threshold */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Threshold ($)
                      </label>
                      <Input
                        type="number"
                        value={tier.threshold}
                        onChange={(e) =>
                          handleTierChange(index, 'threshold', e.target.value)
                        }
                        placeholder="0"
                        className="bg-background border border-border text-foreground"
                      />
                      <p className="text-xs text-foreground/60 mt-1">
                        YTD amount to reach this tier
                      </p>
                    </div>

                    {/* Split Percentage */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Agent Split (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={tier.splitPercentage}
                        onChange={(e) =>
                          handleTierChange(index, 'splitPercentage', e.target.value)
                        }
                        placeholder="60"
                        className="bg-background border border-border text-foreground"
                      />
                      <p className="text-xs text-foreground/60 mt-1">
                        Agent receives {tier.splitPercentage}%, broker gets {100 - tier.splitPercentage}%
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Description
                      </label>
                      <Input
                        type="text"
                        value={tier.description}
                        onChange={(e) =>
                          handleTierChange(index, 'description', e.target.value)
                        }
                        placeholder="e.g., $0-$50K: 60/40"
                        className="bg-background border border-border text-foreground"
                      />
                      <p className="text-xs text-foreground/60 mt-1">
                        User-friendly label for this tier
                      </p>
                    </div>
                  </div>

                  {/* Validation Errors for This Tier */}
                  {validationResult.errors.some((e) => e.tierIndex === index) && (
                    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-2">
                      <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1">
                        Issues:
                      </p>
                      <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                        {validationResult.errors
                          .filter((e) => e.tierIndex === index)
                          .map((error, idx) => (
                            <li key={idx}>• {error.message}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {localTiers.length > 0 && (
        <Card className="p-4 bg-card border border-border">
          <h4 className="font-semibold text-foreground mb-3">Tier Summary</h4>
          <div className="space-y-2">
            {localTiers.map((tier, index) => (
              <div
                key={tier.id}
                className="flex items-center justify-between text-sm p-2 bg-background/50 rounded"
              >
                <div>
                  <span className="font-medium text-foreground">Tier {index}:</span>
                  <span className="text-foreground ml-2">{tier.description || '(No description)'}</span>
                </div>
                <div className="text-foreground">
                  {tier.splitPercentage}% / {100 - tier.splitPercentage}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Validation Status */}
      <div className="flex items-center justify-between p-3 bg-background/50 rounded border border-border">
        <div className="text-sm text-foreground">
          {validationResult.valid ? (
            <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              Configuration is valid and ready to use
            </span>
          ) : (
            <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {validationResult.errors.length} validation error(s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
