import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Trash2, RotateCcw } from 'lucide-react';
import {
  createAdjustment,
  getAdjustmentsByLoop,
  approveAdjustment,
  rejectAdjustment,
  revertAdjustment,
  getAuditLogForAdjustment,
  VarianceAdjustment,
  AuditLogEntry,
  AdjustmentReason,
} from '@/lib/varianceAdjustment';

interface VarianceAdjustmentPanelProps {
  loopId: string;
  agentName: string;
  originalValue: number;
  currentValue: number;
  onAdjustmentSaved?: (adjustment: VarianceAdjustment) => void;
}

const ADJUSTMENT_REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: 'data_error', label: 'Data Entry Error' },
  { value: 'calculation_error', label: 'Calculation Error' },
  { value: 'special_circumstance', label: 'Special Circumstance' },
  { value: 'dispute_resolution', label: 'Dispute Resolution' },
  { value: 'manual_override', label: 'Manual Override' },
  { value: 'other', label: 'Other' },
];

export default function VarianceAdjustmentPanel({
  loopId,
  agentName,
  originalValue,
  currentValue,
  onAdjustmentSaved,
}: VarianceAdjustmentPanelProps) {
  const [adjustments, setAdjustments] = useState<VarianceAdjustment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<VarianceAdjustment | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  // Form state
  const [adjustedValue, setAdjustedValue] = useState<string>(currentValue.toString());
  const [reason, setReason] = useState<AdjustmentReason>('data_error');
  const [notes, setNotes] = useState('');

  // Load adjustments on mount
  useEffect(() => {
    const loopAdjustments = getAdjustmentsByLoop(loopId);
    setAdjustments(loopAdjustments);
  }, [loopId]);

  // Load audit log when adjustment is selected
  useEffect(() => {
    if (selectedAdjustment) {
      const log = getAuditLogForAdjustment(selectedAdjustment.id);
      setAuditLog(log);
    }
  }, [selectedAdjustment]);

  const handleSubmitAdjustment = () => {
    const newValue = parseFloat(adjustedValue);
    if (isNaN(newValue)) {
      alert('Please enter a valid number');
      return;
    }

    const adjustment = createAdjustment(
      loopId,
      agentName,
      originalValue,
      newValue,
      reason,
      notes,
      'Current User' // TODO: Replace with actual user
    );

    const updated = getAdjustmentsByLoop(loopId);
    setAdjustments(updated);
    setShowForm(false);
    setAdjustedValue(currentValue.toString());
    setReason('data_error');
    setNotes('');

    onAdjustmentSaved?.(adjustment);
  };

  const handleApprove = (adjustmentId: string) => {
    approveAdjustment(adjustmentId, 'Current User'); // TODO: Replace with actual user
    const updated = getAdjustmentsByLoop(loopId);
    setAdjustments(updated);
    setSelectedAdjustment(null);
  };

  const handleReject = (adjustmentId: string) => {
    rejectAdjustment(adjustmentId, 'Current User', 'Rejected by user'); // TODO: Replace with actual user
    const updated = getAdjustmentsByLoop(loopId);
    setAdjustments(updated);
    setSelectedAdjustment(null);
  };

  const handleRevert = (adjustmentId: string) => {
    revertAdjustment(adjustmentId, 'Current User'); // TODO: Replace with actual user
    const updated = getAdjustmentsByLoop(loopId);
    setAdjustments(updated);
    setSelectedAdjustment(null);
  };

  const variance = currentValue - originalValue;
  const variancePercent = originalValue !== 0 ? ((variance / originalValue) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-4">
      {/* Variance Summary */}
      <Card className="p-4 bg-card border border-border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Original Value</p>
            <p className="text-lg font-semibold text-foreground">${originalValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Value</p>
            <p className="text-lg font-semibold text-foreground">${currentValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Variance Amount</p>
            <p className={`text-lg font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${variance.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Variance %</p>
            <p className={`text-lg font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variancePercent}%
            </p>
          </div>
        </div>
      </Card>

      {/* Adjustment Form */}
      {showForm && (
        <Card className="p-4 bg-card border border-border space-y-4">
          <h3 className="font-semibold text-foreground">Create Adjustment</h3>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Adjusted Value</label>
              <Input
                type="number"
                step="0.01"
                value={adjustedValue}
                onChange={(e) => setAdjustedValue(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Reason</label>
              <Select value={reason} onValueChange={(value) => setReason(value as AdjustmentReason)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this adjustment..."
                className="mt-1 min-h-20"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmitAdjustment} className="flex-1">
              Create Adjustment
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setAdjustedValue(currentValue.toString());
                setReason('data_error');
                setNotes('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full">
          Create New Adjustment
        </Button>
      )}

      {/* Adjustments List */}
      {adjustments.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Adjustment History</h3>
          {adjustments.map((adj) => (
            <Card
              key={adj.id}
              className={`p-3 cursor-pointer border transition-colors ${
                selectedAdjustment?.id === adj.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedAdjustment(adj)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {adj.status === 'approved' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {adj.status === 'pending' && (
                      <Clock className="w-4 h-4 text-amber-600" />
                    )}
                    {adj.status === 'rejected' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <Badge variant={adj.status === 'approved' ? 'default' : 'secondary'}>
                      {adj.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(adj.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    ${adj.originalValue.toFixed(2)} → ${adj.adjustedValue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{adj.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {adj.adjustmentAmount >= 0 ? '+' : ''}${adj.adjustmentAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Audit Log */}
      {selectedAdjustment && auditLog.length > 0 && (
        <Card className="p-4 bg-card border border-border space-y-3">
          <h3 className="font-semibold text-foreground">Audit Trail</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {auditLog.map((log) => (
              <div key={log.id} className="text-sm border-l-2 border-primary/30 pl-3 py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground capitalize">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                    <p className="text-xs text-muted-foreground">By: {log.actor}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {selectedAdjustment.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleApprove(selectedAdjustment.id)}
                className="flex-1"
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(selectedAdjustment.id)}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          )}

          {selectedAdjustment.status === 'approved' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRevert(selectedAdjustment.id)}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Revert Adjustment
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
