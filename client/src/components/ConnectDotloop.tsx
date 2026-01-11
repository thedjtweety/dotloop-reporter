import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link2, CheckCircle2, Clock, Shield, Zap, RefreshCw } from 'lucide-react';

interface ConnectDotloopProps {
  variant?: 'button' | 'card';
  onConnect?: () => void;
}

export default function ConnectDotloop({ variant = 'button', onConnect }: ConnectDotloopProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleConnect = () => {
    setShowDialog(true);
    onConnect?.();
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
                Connect Your Dotloop Account
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Automatically sync your transaction data in real-time. No more manual CSV uploads—your reports update automatically every night.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-muted-foreground">Automatic sync</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-muted-foreground">Read-only access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-muted-foreground">Real-time updates</span>
                </div>
              </div>
              <Button onClick={handleConnect} className="w-full md:w-auto">
                <Link2 className="w-4 h-4 mr-2" />
                Connect Dotloop
              </Button>
            </div>
          </div>
        </Card>

        <ComingSoonDialog open={showDialog} onOpenChange={setShowDialog} />
      </>
    );
  }

  return (
    <>
      <Button onClick={handleConnect} variant="outline" className="gap-2">
        <Link2 className="w-4 h-4" />
        Connect Dotloop
      </Button>

      <ComingSoonDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}

function ComingSoonDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Dotloop Integration Coming Soon</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                We're building something amazing
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            We're currently in the process of integrating with Dotloop's OAuth system to provide you with seamless, automatic data synchronization.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              What to Expect
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">One-Click Connection:</strong> Securely link your Dotloop account with OAuth 2.0</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Automatic Sync:</strong> Your data updates nightly without manual uploads</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Read-Only Access:</strong> We never modify your Dotloop data—only read it</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Instant Revocation:</strong> Disconnect anytime from your Dotloop settings</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Security First
                </h5>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  We never store your Dotloop password. All connections use industry-standard OAuth 2.0, and you can revoke access instantly from your Dotloop account settings.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            In the meantime, continue using CSV uploads to access all reporting features.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
