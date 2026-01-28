import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';

export default function OAuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const handleCallbackMutation = trpc.dotloopOAuth.handleCallback.useMutation();

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    const processCallback = async () => {
      try {
        // Get query parameters from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');

        // Handle OAuth errors
        if (errorParam) {
          setError(`OAuth Error: ${errorParam} - ${errorDescription || 'Unknown error'}`);
          setIsProcessing(false);
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setError('Missing authorization code or state parameter');
          setIsProcessing(false);
          return;
        }

        // Exchange code for tokens
        const result = await handleCallbackMutation.mutateAsync({
          code,
          state,
          ipAddress: window.location.hostname,
          userAgent: navigator.userAgent,
        });

        // Success - redirect to home after 2 seconds
        setTimeout(() => {
          setLocation('/');
        }, 2000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('OAuth callback error:', err);
        setError(errorMessage);
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [setLocation, handleCallbackMutation, user, authLoading]);

  if (isProcessing && !error && !handleCallbackMutation.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Connecting to Dotloop
          </h1>
          <p className="text-muted-foreground">
            Please wait while we complete your authentication...
          </p>
        </Card>
      </div>
    );
  }

  if (error || handleCallbackMutation.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
            Connection Failed
          </h1>
          <p className="text-muted-foreground mb-6 text-center">
            {error || handleCallbackMutation.error?.message}
          </p>
          <Button 
            onClick={() => setLocation('/')} 
            className="w-full"
          >
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Successfully Connected!
        </h1>
        <p className="text-muted-foreground mb-6">
          Your Dotloop account has been connected. You can now sync your loops and view reports.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting you to the dashboard...
        </p>
      </Card>
    </div>
  );
}
