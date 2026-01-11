/**
 * UploadProgress - Multi-stage progress tracking for CSV uploads
 * Shows validation, parsing, and database upload progress
 */

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface UploadStage {
  id: 'validation' | 'parsing' | 'upload';
  label: string;
  status: 'pending' | 'in-progress' | 'complete' | 'error';
  progress: number; // 0-100
  message?: string;
  error?: string;
}

interface UploadProgressProps {
  stages: UploadStage[];
  fileName: string;
  fileSize: string;
  onCancel?: () => void;
}

export function UploadProgress({ stages, fileName, fileSize, onCancel }: UploadProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  
  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);
  
  // Calculate overall progress
  const overallProgress = Math.round(
    stages.reduce((sum, stage) => sum + stage.progress, 0) / stages.length
  );
  
  // Calculate estimated time remaining
  const activeStage = stages.find(s => s.status === 'in-progress');
  const completedStages = stages.filter(s => s.status === 'complete').length;
  const totalStages = stages.length;
  
  const estimatedTimeRemaining = activeStage && elapsedTime > 0
    ? Math.round((elapsedTime / (completedStages + (activeStage.progress / 100))) * (totalStages - completedStages - (activeStage.progress / 100)))
    : null;
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  const hasError = stages.some(s => s.status === 'error');
  const isComplete = stages.every(s => s.status === 'complete');
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              Upload Complete
            </>
          ) : hasError ? (
            <>
              <AlertCircle className="h-5 w-5 text-red-600" />
              Upload Failed
            </>
          ) : (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Uploading File
            </>
          )}
        </CardTitle>
        <CardDescription>
          {fileName} ({fileSize})
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            {estimatedTimeRemaining !== null && !isComplete && !hasError && (
              <span>Est. remaining: {formatTime(estimatedTimeRemaining)}</span>
            )}
          </div>
        </div>
        
        {/* Stage-by-Stage Progress */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.id} className="space-y-2">
              <div className="flex items-center gap-3">
                {/* Stage Icon */}
                <div className="flex-shrink-0">
                  {stage.status === 'complete' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : stage.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : stage.status === 'in-progress' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  )}
                </div>
                
                {/* Stage Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className={`font-medium text-sm ${
                      stage.status === 'complete' ? 'text-green-900' :
                      stage.status === 'error' ? 'text-red-900' :
                      stage.status === 'in-progress' ? 'text-primary' :
                      'text-muted-foreground'
                    }`}>
                      {index + 1}. {stage.label}
                    </span>
                    {stage.status === 'in-progress' && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {stage.progress}%
                      </span>
                    )}
                  </div>
                  
                  {/* Stage Progress Bar */}
                  {(stage.status === 'in-progress' || stage.status === 'complete') && (
                    <Progress 
                      value={stage.progress} 
                      className={`h-1.5 mt-1 ${
                        stage.status === 'complete' ? 'bg-green-100' : ''
                      }`}
                    />
                  )}
                  
                  {/* Stage Message */}
                  {stage.message && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stage.message}
                    </p>
                  )}
                  
                  {/* Stage Error */}
                  {stage.error && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ {stage.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Action Buttons */}
        {!isComplete && !hasError && onCancel && (
          <div className="flex justify-end pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel Upload
            </button>
          </div>
        )}
        
        {/* Success Message */}
        {isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-900">
              ✅ Your file has been successfully uploaded and processed. You can now view your dashboard.
            </p>
          </div>
        )}
        
        {/* Error Message */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-900">
              ❌ Upload failed. Please check the error messages above and try again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook to manage upload progress state
 */
export function useUploadProgress() {
  const [stages, setStages] = useState<UploadStage[]>([
    { id: 'validation', label: 'Validating CSV', status: 'pending', progress: 0 },
    { id: 'parsing', label: 'Parsing Data', status: 'pending', progress: 0 },
    { id: 'upload', label: 'Uploading to Database', status: 'pending', progress: 0 },
  ]);
  
  const updateStage = (
    stageId: UploadStage['id'],
    updates: Partial<Omit<UploadStage, 'id' | 'label'>>
  ) => {
    setStages(prev => prev.map(stage =>
      stage.id === stageId
        ? { ...stage, ...updates }
        : stage
    ));
  };
  
  const startStage = (stageId: UploadStage['id'], message?: string) => {
    updateStage(stageId, { status: 'in-progress', progress: 0, message });
  };
  
  const updateProgress = (stageId: UploadStage['id'], progress: number, message?: string) => {
    updateStage(stageId, { progress: Math.min(100, Math.max(0, progress)), message });
  };
  
  const completeStage = (stageId: UploadStage['id'], message?: string) => {
    updateStage(stageId, { status: 'complete', progress: 100, message });
  };
  
  const errorStage = (stageId: UploadStage['id'], error: string) => {
    updateStage(stageId, { status: 'error', error });
  };
  
  const reset = () => {
    setStages([
      { id: 'validation', label: 'Validating CSV', status: 'pending', progress: 0 },
      { id: 'parsing', label: 'Parsing Data', status: 'pending', progress: 0 },
      { id: 'upload', label: 'Uploading to Database', status: 'pending', progress: 0 },
    ]);
  };
  
  return {
    stages,
    startStage,
    updateProgress,
    completeStage,
    errorStage,
    reset,
  };
}
