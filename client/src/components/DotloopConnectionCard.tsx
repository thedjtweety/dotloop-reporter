import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, CheckCircle2, AlertCircle, RefreshCw, Zap, Workflow, Upload, Database } from 'lucide-react';

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
    <Card className="p-8 border-2 border-emerald-500/20 bg-gradient-to-br from-card to-emerald-950/5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 h-full flex flex-col">
      <div className="space-y-6 flex-1">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <Link2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground">
              Dotloop Connection
            </h3>
          </div>
          <p className="text-sm text-foreground/70">
            Connect directly to your Dotloop account for real-time data sync
          </p>
        </div>

        {/* Status Indicator */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
            {isConnected ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Connected</p>
                  {accountEmail && (
                    <p className="text-xs text-foreground/60 truncate">{accountEmail}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Not Connected</p>
                  <p className="text-xs text-foreground/60">Connect to enable automatic sync</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Last Sync Info */}
        {isConnected && lastSyncTime && (
          <div className="text-xs text-foreground/60 flex items-center gap-2 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/30">
            <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Last synced: {lastSyncTime}
          </div>
        )}

        {/* Benefits List */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Key Benefits:</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-foreground">Real-time transaction data sync</span>
            </li>
            <li className="flex items-start gap-3">
              <Workflow className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-foreground">Automatic commission calculations</span>
            </li>
            <li className="flex items-start gap-3">
              <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-foreground">No manual CSV uploads needed</span>
            </li>
            <li className="flex items-start gap-3">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-foreground">Always current and up-to-date</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-6 border-t border-border/50">
        {isConnected ? (
          <>
            <Button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/50"
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
              className="w-full font-semibold"
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            onClick={onConnect}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/50 group relative overflow-hidden"
          >
            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <Link2 className="w-4 h-4 mr-2 group-hover:animate-pulse relative z-10" />
            <span className="relative z-10">Connect to Dotloop</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
