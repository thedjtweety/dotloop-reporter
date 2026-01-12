import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Trash2, Calendar, BarChart3, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UploadHistoryProps {
  onSelectUpload: (uploadId: number) => void;
  currentUploadId?: number;
}

export default function UploadHistory({ onSelectUpload, currentUploadId }: UploadHistoryProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  const { data: uploads, isLoading, refetch } = trpc.uploads.list.useQuery();
  const deleteMutation = trpc.uploads.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteConfirmId(null);
    },
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (!uploads || uploads.length === 0) {
    return (
      <Card className="p-6 border-dashed">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Upload History</h3>
          <p className="text-sm text-foreground">
            Your uploaded CSV files will appear here for quick access.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Upload History</h3>
            </div>
            <span className="text-xs text-foreground">
              {uploads.length} {uploads.length === 1 ? 'upload' : 'uploads'}
            </span>
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          <div className="p-2 space-y-2">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className={`
                  group relative p-3 rounded-lg border transition-all cursor-pointer
                  ${currentUploadId === upload.id 
                    ? 'bg-primary/10 border-primary shadow-sm' 
                    : 'bg-card border-border hover:bg-muted/50 hover:border-primary/50'
                  }
                `}
                onClick={() => onSelectUpload(upload.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className={`w-4 h-4 flex-shrink-0 ${currentUploadId === upload.id ? 'text-primary' : 'text-foreground'}`} />
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {upload.fileName}
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(upload.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <span className="text-foreground/50">•</span>
                      <span className="font-medium">
                        {upload.recordCount} {upload.recordCount === 1 ? 'record' : 'records'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(upload.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    
                    {currentUploadId !== upload.id && (
                      <ChevronRight className="w-4 h-4 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                {currentUploadId === upload.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg"></div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Upload?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this upload and all its transaction data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) {
                  deleteMutation.mutate({ uploadId: deleteConfirmId });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
