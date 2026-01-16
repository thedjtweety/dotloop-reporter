/**
 * ValidationErrorDisplay - User-friendly display of CSV validation errors and warnings
 */

import { AlertCircle, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ValidationResult } from '@/lib/csvValidator';

interface ValidationErrorDisplayProps {
  validationResult: ValidationResult;
  onRetry?: () => void;
  onContinueAnyway?: () => void;
}

export function ValidationErrorDisplay({ 
  validationResult, 
  onRetry, 
  onContinueAnyway 
}: ValidationErrorDisplayProps) {
  const { isValid, errors, warnings, metadata } = validationResult;
  
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  const regularErrors = errors.filter(e => e.severity === 'error');
  
  return (
    <div className="space-y-4">
      {/* File Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            File Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">File Name:</span> {metadata.fileName}
            </div>
            <div>
              <span className="font-medium">File Size:</span> {metadata.fileSizeFormatted}
            </div>
            <div>
              <span className="font-medium">Lines:</span> {metadata.lineCount.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Columns:</span> {metadata.columnCount}
            </div>
            <div>
              <span className="font-medium">Delimiter:</span> {metadata.detectedDelimiter === '\t' ? 'Tab' : metadata.detectedDelimiter}
            </div>
            <div>
              <span className="font-medium">Estimated Records:</span> {metadata.estimatedRecords.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Has Header:</span> {metadata.hasHeader ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Encoding:</span> {metadata.encoding}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Validation Status */}
      {isValid ? (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Validation Passed</AlertTitle>
          <AlertDescription className="text-green-800">
            The file passed all validation checks and is ready to be processed.
            {warnings.length > 0 && ` However, there ${warnings.length === 1 ? 'is' : 'are'} ${warnings.length} warning${warnings.length > 1 ? 's' : ''} to review.`}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Validation Failed</AlertTitle>
          <AlertDescription>
            The file has {criticalErrors.length + regularErrors.length} error{(criticalErrors.length + regularErrors.length) > 1 ? 's' : ''} that must be fixed before processing.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Critical Errors */}
      {criticalErrors.length > 0 && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              Critical Errors ({criticalErrors.length})
            </CardTitle>
            <CardDescription>
              These errors prevent the file from being processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalErrors.map((error, idx) => (
              <div key={idx} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-0.5">
                    {error.code}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-red-900">{error.message}</p>
                    {error.line && (
                      <p className="text-sm text-red-700 mt-1">Line {error.line}</p>
                    )}
                    {error.suggestion && (
                      <p className="text-sm text-red-600 mt-2 italic">
                        💡 {error.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Regular Errors */}
      {regularErrors.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Errors ({regularErrors.length})
            </CardTitle>
            <CardDescription>
              These issues should be addressed for best results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {regularErrors.map((error, idx) => (
              <div key={idx} className="border-l-4 border-orange-500 pl-4 py-2">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 border-orange-500 text-orange-700">
                    {error.code}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-orange-900">{error.message}</p>
                    {error.line && (
                      <p className="text-sm text-orange-700 mt-1">Line {error.line}</p>
                    )}
                    {error.suggestion && (
                      <p className="text-sm text-orange-600 mt-2 italic">
                        💡 {error.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertTriangle className="h-5 w-5" />
              Warnings ({warnings.length})
            </CardTitle>
            <CardDescription>
              These are informational and won't prevent processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {warnings.map((warning, idx) => (
              <div key={idx} className="border-l-4 border-yellow-500 pl-4 py-2">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 border-yellow-500 text-yellow-700">
                    {warning.code}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900">{warning.message}</p>
                    {warning.line && (
                      <p className="text-sm text-yellow-700 mt-1">Line {warning.line}</p>
                    )}
                    {warning.suggestion && (
                      <p className="text-sm text-yellow-600 mt-2 italic">
                        💡 {warning.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Try Another File
          </button>
        )}
        {onContinueAnyway && !isValid && regularErrors.length > 0 && criticalErrors.length === 0 && (
          <button
            onClick={onContinueAnyway}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Continue Anyway
          </button>
        )}
      </div>
    </div>
  );
}
