import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Log to Sentry if available
    if (window.__SENTRY__) {
      window.__SENTRY__.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 dark:text-red-400" />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-100">Something went wrong</h3>
              <p className="text-sm text-red-600 dark:text-red-300 max-w-md">
                We've encountered an unexpected error. Our team has been notified and will investigate.
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="w-full text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-3 rounded text-left">
                <summary className="cursor-pointer font-semibold mb-2">Error Details (Development Only)</summary>
                <pre className="overflow-auto whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo && `\n\n${this.state.errorInfo.componentStack}`}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="default"
                className="flex items-center gap-2"
                onClick={this.handleReset}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                className="bg-white hover:bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:hover:bg-red-900 dark:border-red-800 dark:text-red-300"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Extend window type for Sentry
declare global {
  interface Window {
    __SENTRY__?: any;
  }
}

export default ErrorBoundary;
