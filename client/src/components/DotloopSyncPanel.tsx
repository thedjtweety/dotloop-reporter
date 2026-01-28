/**
 * Dotloop Sync Panel Component
 * UI for syncing data from Dotloop API
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

export interface DotloopSyncPanelProps {
  onSync?: () => void;
  isConnected?: boolean;
  lastSync?: Date;
}

export function DotloopSyncPanel({ onSync, isConnected = false, lastSync }: DotloopSyncPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncMessage('Syncing data from Dotloop...');

    try {
      // Call the sync mutation
      if (onSync) {
        await onSync();
      }

      setSyncStatus('success');
      setSyncMessage('Successfully synced data from Dotloop');

      // Reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 3000);
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage(error instanceof Error ? error.message : 'Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Dotloop Not Connected
          </CardTitle>
          <CardDescription>
            Connect your Dotloop account to sync transactions automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="default">
            Connect Dotloop Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sync from Dotloop
        </CardTitle>
        <CardDescription>
          Sync your Dotloop transactions directly into the reporting tool
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Status */}
        {syncStatus !== 'idle' && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 ${
              syncStatus === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : syncStatus === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {syncStatus === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {syncStatus === 'error' && <AlertCircle className="h-5 w-5" />}
            {syncStatus === 'syncing' && <RefreshCw className="h-5 w-5 animate-spin" />}
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Last Sync Info */}
        {lastSync && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last synced: {lastSync.toLocaleString()}</span>
          </div>
        )}

        {/* Sync Button */}
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground">
          Syncing will fetch your latest transactions from Dotloop and add them to your reports.
          This may take a few moments depending on the number of transactions.
        </p>
      </CardContent>
    </Card>
  );
}

export default DotloopSyncPanel;
