/**
 * CSV Upload Widget
 * 
 * Dedicated file upload component for commission calculator
 * Handles CSV file selection, validation, and parsing
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, AlertCircle, CheckCircle, X, FileText, Loader2 } from 'lucide-react';
import { parseCSV } from '@/lib/csvParser';
import type { DotloopRecord } from '@/lib/csvParser';
import toast from 'react-hot-toast';

interface CSVUploadWidgetProps {
  onDataLoaded: (data: DotloopRecord[], fileName: string) => void;
  isLoading?: boolean;
}

export default function CSVUploadWidget({ onDataLoaded, isLoading = false }: CSVUploadWidgetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return { valid: false, error: 'Please upload a CSV file' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    return { valid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Read file content
      const fileContent = await selectedFile.text();

      // Parse CSV
      const records = parseCSV(fileContent);

      if (records.length === 0) {
        setError('No valid transaction records found in the CSV file');
        return;
      }

      // Validate required columns - check for key fields that indicate valid Dotloop records
      const requiredFields = ['loopId', 'agents', 'salePrice', 'closingDate'];
      const firstRecord = records[0];
      const missingFields = requiredFields.filter(field => !(field in firstRecord));

      if (missingFields.length > 0) {
        setError(`Missing required columns: ${missingFields.join(', ')}. Please ensure you're uploading a valid Dotloop export.`);
        return;
      }

      // Success
      setSuccess(true);
      onDataLoaded(records, selectedFile.name);
      toast.success(`Loaded ${records.length} transactions from ${selectedFile.name}`);

      // Reset form
      setTimeout(() => {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSuccess(false);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse CSV file';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(false);
  };

  return (
    <Card className="p-6 border-primary/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Upload Transaction Data</h3>
            <p className="text-sm text-muted-foreground">
              Select a Dotloop export CSV file to calculate commissions
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing || isLoading}
          />

          <div className="space-y-3">
            <div className="flex justify-center">
              <FileText className="h-12 w-12 text-primary/40" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {selectedFile ? selectedFile.name : 'Drag and drop CSV file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse your computer
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              CSV files up to 10MB • Required columns: Loop ID, Agent Name, Amount, Date
            </p>
          </div>
        </div>

        {/* File Info */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                setError(null);
                setSuccess(false);
              }}
              disabled={isProcessing || isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              File uploaded successfully! Ready to calculate commissions.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isProcessing || isLoading}
            className="flex-1 gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload & Parse
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              setError(null);
              setSuccess(false);
            }}
            disabled={!selectedFile || isProcessing || isLoading}
          >
            Clear
          </Button>
        </div>

        {/* File Requirements */}
        <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
          <p className="font-medium text-foreground">Required CSV Columns:</p>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>• <span className="font-mono">loopId</span> - Unique transaction identifier</li>
            <li>• <span className="font-mono">agentName</span> - Name of the agent</li>
            <li>• <span className="font-mono">transactionAmount</span> - Transaction amount in dollars</li>
            <li>• <span className="font-mono">transactionDate</span> - Date in YYYY-MM-DD format</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
