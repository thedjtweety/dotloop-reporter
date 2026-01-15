import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface DotloopConnectionCardProps {
  isConnected?: boolean;
  accountEmail?: string;
  lastSyncTime?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export default function DotloopConnectionCard({
  isConnected = false,
  accountEmail,
  lastSyncTime,
  onConnect,
  onDisconnect,
  onSyncNow,
  isSyncing = false,
}: DotloopConnectionCardProps) {
  return (
    <Card className="p-8 border-2 border-border bg-card/50 hover:bg-card/80 transition-colors h-full flex flex-col">
      <div className="space-y-6 flex-1">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground">
              Dotloop Connection
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect directly to your Dotloop account for real-time data sync
          </p>
        </div>

        {/* Status Indicator */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            {isConnected ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Connected</p>
                  {accountEmail && (
                    <p className="text-xs text-muted-foreground truncate">{accountEmail}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Not Connected</p>
                  <p className="text-xs text-muted-foreground">Connect to enable automatic sync</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Last Sync Info */}
        {isConnected && lastSyncTime && (
          <div className="text-xs text-muted-foreground">
            Last synced: {lastSyncTime}
          </div>
        )}

        {/* Benefits List */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Benefits:</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
              <span>Real-time transaction data sync</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
              <span>Automatic commission calculations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
              <span>No manual CSV uploads needed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
              <span>Always current and up-to-date</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-6 border-t border-border">
        {isConnected ? (
          <>
            <Button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
            <Button
              onClick={onDisconnect}
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            onClick={onConnect}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Connect to Dotloop
          </Button>
        )}
      </div>
    </Card>
  );
}
