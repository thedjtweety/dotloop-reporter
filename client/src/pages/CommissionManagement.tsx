/**
 * Commission Management - Coming Soon
 * 
 * Placeholder for future commission management features
 */

import { useAuth } from '@/_core/hooks/useAuth';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ModeToggle } from '@/components/ModeToggle';
import { useLocation } from 'wouter';

export default function CommissionManagement() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Analytics
            </Button>
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Commission Management</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <div className="text-sm text-muted-foreground hidden sm:block">
                {user.name || user.email}
              </div>
            )}
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        {/* Coming Soon Message */}
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Commission Management</h2>
          <p className="text-muted-foreground mb-6">
            Advanced commission planning, team management, and automatic calculations coming soon.
          </p>
          <div className="space-y-2 text-sm text-left mb-6 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
            <p className="flex items-center gap-2"><span className="text-primary">✓</span> Commission plan builder</p>
            <p className="flex items-center gap-2"><span className="text-primary">✓</span> Team management</p>
            <p className="flex items-center gap-2"><span className="text-primary">✓</span> Agent assignments</p>
            <p className="flex items-center gap-2"><span className="text-primary">✓</span> Automatic calculations</p>
          </div>
          <Button onClick={() => setLocation('/')} className="w-full">
            Back to Dashboard
          </Button>
        </Card>
      </main>
    </div>
  );
}
