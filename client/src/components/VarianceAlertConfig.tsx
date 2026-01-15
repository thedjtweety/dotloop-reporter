import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Bell, Flag } from 'lucide-react';
import {
  getAlertThresholds,
  saveAlertThresholds,
  getAlertSummary,
  DEFAULT_THRESHOLDS,
  AlertThresholds,
} from '@/lib/varianceAlerts';

interface VarianceAlertConfigProps {
  onThresholdsChanged?: (thresholds: AlertThresholds) => void;
}

export default function VarianceAlertConfig({ onThresholdsChanged }: VarianceAlertConfigProps) {
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [alertSummary, setAlertSummary] = useState(getAlertSummary());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = getAlertThresholds();
    setThresholds(saved);
  }, []);

  useEffect(() => {
    setAlertSummary(getAlertSummary());
  }, [thresholds]);

  const handleThresholdChange = (key: keyof AlertThresholds, value: any) => {
    const updated = { ...thresholds, [key]: value };
    setThresholds(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveAlertThresholds(thresholds);
    setHasChanges(false);
    onThresholdsChanged?.(thresholds);
  };

  const handleReset = () => {
    setThresholds(DEFAULT_THRESHOLDS);
    setHasChanges(true);
  };

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3 bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold text-foreground">{alertSummary.activeAlerts}</p>
            </div>
            <Bell className="w-8 h-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-3 bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{alertSummary.criticalAlerts}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-3 bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Flagged Transactions</p>
              <p className="text-2xl font-bold text-amber-600">{alertSummary.flaggedTransactions}</p>
            </div>
            <Flag className="w-8 h-8 text-amber-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Threshold Configuration */}
      <Card className="p-4 bg-card border border-border space-y-4">
        <h3 className="font-semibold text-foreground">Alert Thresholds</h3>

        <div className="space-y-4">
          {/* Major Variance Threshold */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Major Variance Threshold (%)
            </label>
            <p className="text-xs text-muted-foreground">
              Variances at or above this percentage will trigger critical alerts
            </p>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={thresholds.majorVariancePercentage}
              onChange={(e) =>
                handleThresholdChange('majorVariancePercentage', parseFloat(e.target.value))
              }
              className="max-w-xs"
            />
          </div>

          {/* Minor Variance Threshold */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Minor Variance Threshold (%)
            </label>
            <p className="text-xs text-muted-foreground">
              Variances at or above this percentage will trigger warning alerts
            </p>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={thresholds.minorVariancePercentage}
              onChange={(e) =>
                handleThresholdChange('minorVariancePercentage', parseFloat(e.target.value))
              }
              className="max-w-xs"
            />
          </div>
        </div>

        {/* Alert Divider */}
        <div className="border-t border-border pt-4">
          <h4 className="font-medium text-foreground mb-3">Auto-Flagging Options</h4>

          {/* Enable Auto-Flag */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Enable Auto-Flagging</p>
              <p className="text-xs text-muted-foreground">
                Automatically flag transactions when alerts are created
              </p>
            </div>
            <Switch
              checked={thresholds.enableAutoFlag}
              onCheckedChange={(checked) =>
                handleThresholdChange('enableAutoFlag', checked)
              }
            />
          </div>

          {/* Auto-Flag Major Variances */}
          {thresholds.enableAutoFlag && (
            <>
              <div className="flex items-center justify-between py-2 border-t border-border pt-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Flag Major Variances</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically flag transactions with critical alerts
                  </p>
                </div>
                <Switch
                  checked={thresholds.autoFlagMajor}
                  onCheckedChange={(checked) =>
                    handleThresholdChange('autoFlagMajor', checked)
                  }
                />
              </div>

              {/* Auto-Flag Minor Variances */}
              <div className="flex items-center justify-between py-2 border-t border-border pt-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Flag Minor Variances</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically flag transactions with warning alerts
                  </p>
                </div>
                <Switch
                  checked={thresholds.autoFlagMinor}
                  onCheckedChange={(checked) =>
                    handleThresholdChange('autoFlagMinor', checked)
                  }
                />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1"
          >
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Reset to Defaults
          </Button>
        </div>
      </Card>

      {/* Threshold Guide */}
      <Card className="p-4 bg-card border border-border space-y-2">
        <h4 className="font-medium text-foreground">Threshold Guide</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-red-600">Critical (Red):</span> Variance ≥ Major threshold
          </p>
          <p>
            <span className="font-medium text-amber-600">Warning (Amber):</span> Variance ≥ Minor threshold
          </p>
          <p>
            <span className="font-medium text-blue-600">Info (Blue):</span> Variance below Minor threshold
          </p>
        </div>
      </Card>
    </div>
  );
}
