/**
 * Commission Management - Coming Soon
 *
 * This module is under development. Commission plan management,
 * team structures, agent assignments, and audit reports will be
 * available in a future release.
 */
import { DollarSign, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLocation } from 'wouter';

export default function CommissionManagement() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Commission Management</CardTitle>
          <CardDescription className="text-base mt-2">
            This module is currently under development and will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-left space-y-3">
            <p className="text-sm font-medium text-foreground">Coming soon:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                'Commission plan creation and management',
                'Team structure configuration',
                'Agent commission assignments',
                'Commission audit reports',
                'Automated commission calculations',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
