import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link2, CheckCircle2, Shield, Zap, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { skipToken } from '@tanstack/react-query';

interface ConnectDotloopProps {
  variant?: 'button' | 'card';
  onConnect?: () => void;
}

export default function ConnectDotloop({ variant = 'button', onConnect }: ConnectDotloopProps) {
  const [isLoading, setIsLoading] = useState(false);
  const getAuthUrlQuery = trpc.dotloopOAuth.getAuthorizationUrl.useQuery(skipToken, {
    enabled: false,
  });

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      // Get authorization URL from backend
      const result = await getAuthUrlQuery.refetch();
      
      if (result.data?.url) {
        // Redirect after a brief delay to ensure UI updates
        setTimeout(() => {
          window.location.href = result.data.url;
          onConnect?.();
        }, 500);
      } else {
        console.error('Failed to get authorization URL');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error getting authorization URL:', error);
      setIsLoading(false);
    }
  };

  if (variant === 'card') {
    return (
      <>
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Login to Dotloop
              </h3>
              <p className="text-sm text-foreground mb-4">
                Automatically sync your transaction data in real-time. No more manual CSV uploads—your reports update automatically every night.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-foreground">Automatic sync</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-foreground">Read-only access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-foreground">Real-time updates</span>
                </div>
              </div>
              <Button onClick={handleConnect} disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Login to Dotloop
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <Button onClick={handleConnect} variant="outline" className="gap-2" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            Login to Dotloop
          </>
        )}
      </Button>
    </>
  );
}
