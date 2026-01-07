/**
 * UploadZone Component
 * Drag-and-drop area for CSV file uploads with visual feedback
 */

import { useState, useRef } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export default function UploadZone({ onFileUpload, isLoading = false }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        setFileName(file.name);
        onFileUpload(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setFileName(file.name);
      onFileUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleChange}
        className="hidden"
      />
      <Card
        className={`p-12 border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/50'
        }`}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >

      <div className="flex flex-col items-center justify-center text-center">
        {isLoading ? (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              Processing your file...
            </h3>
            <p className="text-muted-foreground">
              Parsing CSV data and calculating metrics
            </p>
          </>
        ) : fileName ? (
          <>
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              File uploaded successfully
            </h3>
            <p className="text-muted-foreground mb-4">
              {fileName}
            </p>
            <p className="text-sm text-muted-foreground">
              Scroll down to view your report
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              Upload your Dotloop CSV export
            </h3>
            <p className="text-muted-foreground mb-6">
              Drag and drop your file here, or click to browse
            </p>
            <Button size="lg" className="gap-2">
              <Upload className="w-4 h-4" />
              Choose File
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported format: CSV (exported from Dotloop Broker Report Builder)
            </p>
          </>
        )}
      </div>
      </Card>
    </>
  );
}