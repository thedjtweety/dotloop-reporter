/**
 * UploadStatusBar - Inline progress bar shown below the upload zone during CSV processing.
 * Replaces the modal dialog for a less intrusive, always-visible experience.
 */
import { CheckCircle, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { UploadStage } from './UploadProgress';

interface UploadStatusBarProps {
  stages: UploadStage[];
  fileName: string;
  onCancel?: () => void;
  visible: boolean;
}

export function UploadStatusBar({ stages, fileName, onCancel, visible }: UploadStatusBarProps) {
  if (!visible) return null;

  const overallProgress = Math.round(
    stages.reduce((sum, stage) => sum + stage.progress, 0) / stages.length
  );

  const hasError = stages.some(s => s.status === 'error');
  const isComplete = stages.every(s => s.status === 'complete');
  const activeStage = stages.find(s => s.status === 'in-progress');
  const currentMessage = activeStage?.message || (isComplete ? 'Processing complete!' : 'Preparing...');

  const stageLabels: Record<string, string> = {
    validation: 'Validating',
    parsing: 'Parsing',
    upload: 'Finalizing',
  };

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-xl border transition-all duration-300 overflow-hidden ${
        hasError
          ? 'border-red-500/40 bg-red-950/20'
          : isComplete
          ? 'border-emerald-500/40 bg-emerald-950/20'
          : 'border-primary/30 bg-card/80'
      }`}
    >
      {/* Top bar: file name + overall progress */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {hasError ? (
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          ) : isComplete ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          )}
          <span className="text-sm font-medium text-foreground truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-foreground/60 tabular-nums">{overallProgress}%</span>
          {!isComplete && !hasError && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-6 px-2 text-xs text-foreground/50 hover:text-foreground"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="px-5 pb-3">
        <Progress
          value={overallProgress}
          className={`h-1.5 ${hasError ? '[&>div]:bg-red-500' : isComplete ? '[&>div]:bg-emerald-500' : ''}`}
        />
      </div>

      {/* Stage pills */}
      <div className="px-5 pb-4 flex items-center gap-3">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-1.5">
            {stage.status === 'complete' ? (
              <CheckCircle className="w-3 h-3 text-emerald-500" />
            ) : stage.status === 'error' ? (
              <AlertCircle className="w-3 h-3 text-red-500" />
            ) : stage.status === 'in-progress' ? (
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-foreground/20" />
            )}
            <span
              className={`text-xs ${
                stage.status === 'complete'
                  ? 'text-emerald-500'
                  : stage.status === 'error'
                  ? 'text-red-500'
                  : stage.status === 'in-progress'
                  ? 'text-foreground'
                  : 'text-foreground/40'
              }`}
            >
              {stageLabels[stage.id] || stage.id}
            </span>
            {/* Divider between stages */}
            {stage.id !== 'upload' && (
              <span className="text-foreground/20 text-xs ml-1">→</span>
            )}
          </div>
        ))}
        <span className="ml-auto text-xs text-foreground/50 truncate max-w-[200px]">{currentMessage}</span>
      </div>
    </div>
  );
}
