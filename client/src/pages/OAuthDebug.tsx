/**
 * OAuth Debug Page
 * 
 * Helps diagnose Dotloop OAuth connection issues
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function OAuthDebug() {
  const [location] = useLocation();
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const trpcUtils = trpc.useUtils();

  useEffect(() => {
    // Check URL parameters for OAuth callback data
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const dotloopError = params.get('dotloop_error');
    const dotloopConnected = params.get('dotloop');

    if (code) {
      addLog(`✅ Authorization code received: ${code.substring(0, 10)}...`);
      setStatus('success');
    }

    if (state) {
      addLog(`✅ State parameter: ${state}`);
    }

    if (error) {
      addLog(`❌ OAuth error: ${error}`);
      setStatus('error');
    }

    if (dotloopError) {
      addLog(`❌ Dotloop error: ${dotloopError}`);
      setStatus('error');
    }

    if (dotloopConnected === 'connected') {
      addLog(`✅ Successfully connected to Dotloop!`);
      setStatus('success');
    }
  }, [location]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testCallback = async () => {
    setStatus('loading');
    addLog('Testing callback endpoint...');
    
    try {
      const response = await fetch('/api/dotloop/callback?error=test_from_debug');
      addLog(`Callback endpoint response: ${response.status} ${response.statusText}`);
      
      if (response.redirected) {
        addLog(`✅ Callback endpoint is working (redirected to: ${response.url})`);
        setStatus('success');
      } else {
        addLog(`✅ Callback endpoint responded`);
        setStatus('success');
      }
    } catch (err) {
      addLog(`❌ Callback endpoint error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('error');
    }
  };

  const testAuthUrl = async () => {
    setStatus('loading');
    addLog('Fetching authorization URL...');
    
    try {
      // Use tRPC client (same as Home.tsx)
      const state = Math.random().toString(36).substring(2, 15);
      const result = await trpcUtils.client.dotloopOAuth.getAuthorizationUrl.query({ state });
      
      if (result) {
        addLog(`✅ Authorization URL generated successfully`);
        addLog(`URL: ${result.url.substring(0, 80)}...`);
        addLog(`State: ${result.state}`);
        addLog(`Full URL: ${result.url}`);
        setStatus('success');
      } else {
        addLog(`❌ No authorization URL in response`);
        setStatus('error');
      }
    } catch (err) {
      addLog(`❌ Authorization URL error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">OAuth Debug Page</h1>
          <p className="text-foreground/70">Diagnose Dotloop OAuth connection issues</p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Connection Status</h2>
          <div className="flex items-center gap-2 mb-4">
            {status === 'idle' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
            {status === 'loading' && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            <span className="text-foreground font-medium">
              {status === 'idle' && 'Ready to test'}
              {status === 'loading' && 'Testing...'}
              {status === 'success' && 'Test passed'}
              {status === 'error' && 'Test failed'}
            </span>
          </div>

          <div className="flex gap-4">
            <Button onClick={testCallback} disabled={status === 'loading'}>
              Test Callback Endpoint
            </Button>
            <Button onClick={testAuthUrl} disabled={status === 'loading'} variant="outline">
              Test Auth URL
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Debug Logs</h2>
          <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-slate-500">No logs yet. Click a test button above.</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <div><span className="font-semibold">Current URL:</span> {window.location.href}</div>
            <div><span className="font-semibold">Origin:</span> {window.location.origin}</div>
            <div><span className="font-semibold">Expected Callback:</span> {window.location.origin}/api/dotloop/callback</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
