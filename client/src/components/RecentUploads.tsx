/**
 * RecentUploads Component
 * Displays a list of recently uploaded files for quick resume
 */

import { Clock, FileText, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export interface RecentFile {
  id: string;
  name: string;
  date: number;
  recordCount: number;
  data: any[]; // Stored parsed data
}

interface RecentUploadsProps {
  files: RecentFile[];
  onSelect: (file: RecentFile) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export default function RecentUploads({ files, onSelect, onDelete }: RecentUploadsProps) {
  if (files.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Clock className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          Recent Uploads
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {files.map((file) => (
          <Card 
            key={file.id}
            className="group relative overflow-hidden border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer"
            onClick={() => onSelect(file)}
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={(e) => onDelete(file.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <h4 className="font-medium text-white truncate mb-1" title={file.name}>
                {file.name}
              </h4>
              
              <div className="flex justify-between items-end">
                <div className="text-xs text-slate-400 space-y-1">
                  <p>{file.recordCount} records</p>
                  <p>{formatDistanceToNow(file.date, { addSuffix: true })}</p>
                </div>
                
                <div className="transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
            
            {/* Progress bar effect on hover */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 w-0 group-hover:w-full transition-all duration-500" />
          </Card>
        ))}
      </div>
    </div>
  );
}
