/**
 * Seed Data Button Component
 * 
 * Provides UI trigger to seed sample commission plans and agent assignments
 * into the database for testing and demonstration purposes.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Zap, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import toast from 'react-hot-toast';

interface SeedDataButtonProps {
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export default function SeedDataButton({
  onSuccess,
  variant = 'outline',
  size = 'default',
}: SeedDataButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const seedMutation = trpc.seed.seedSampleData.useMutation();
  const clearMutation = trpc.seed.clearSampleData.useMutation();

  const handleSeed = async () => {
    try {
      setIsLoading(true);
      await seedMutation.mutateAsync();
      toast.success('Sample data seeded successfully! 3 plans and 10 agents created.');
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to seed data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      setIsLoading(true);
      await clearMutation.mutateAsync();
      toast.success('Sample data cleared successfully!');
      setIsClearOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant={variant}
          size={size}
          onClick={() => setIsOpen(true)}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Seed Sample Data
        </Button>
        <Button
          variant="ghost"
          size={size}
          onClick={() => setIsClearOpen(true)}
          disabled={isLoading}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
      </div>

      {/* Seed Data Confirmation Dialog */}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed Sample Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create 3 sample commission plans (Standard, Aggressive, Conservative) and 10 sample agents with assignments. Perfect for testing the commission calculator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Sample Plans:</h4>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                <li><strong>Standard:</strong> 80/20 split with $18K cap</li>
                <li><strong>Aggressive:</strong> 90/10 split with $25K cap (sliding scale)</li>
                <li><strong>Conservative:</strong> 70/30 split with $12K cap</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Sample Agents:</h4>
              <p className="text-foreground">10 agents will be created and assigned to plans with various anniversary dates for testing YTD calculations.</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeed} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Seeding...
                </>
              ) : (
                'Seed Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Data Confirmation Dialog */}
      <AlertDialog open={isClearOpen} onOpenChange={setIsClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Sample Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all sample commission plans and agent assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Clearing...
                </>
              ) : (
                'Clear Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
