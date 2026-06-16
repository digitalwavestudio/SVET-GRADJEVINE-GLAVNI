import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { exportService } from '../../lib/exportService';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Svet Građevine - Global Enterprise Error Boundary
 * Catch, Report, and Recover from React tree crashes.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Uncaught React Error:', error, errorInfo);
    
    // DEV ERROR LOGGER
    try {
      fetch('/api/dev/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'react_error_boundary',
          name: error.name,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        })
      }).catch(() => console.warn('[ErrorBoundary] Log error failed'));
    } catch(e) {}
    
    // Remote Telemetry Export
    /*
    exportService.reportError(error, {
      componentStack: errorInfo.componentStack,
      type: 'react_crash',
      severity: 'high'
    });
    */
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-white font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-zinc-900 border border-white/5 rounded-2xl p-8 shadow-2xl text-center space-y-6"
          >
            <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
              <p className="text-sm text-zinc-400 leading-relaxed font-mono">
                The application encountered an unexpected runtime error. Our engineers have been notified.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-zinc-950 rounded-lg border border-red-500/30 text-[10px] text-zinc-500 font-mono text-left overflow-auto max-h-48 whitespace-pre-wrap">
                <div className="font-bold border-b border-red-500/30 pb-1 flex justify-between mb-2">
                  <span className="text-red-400">Stack Trace Decrypted</span>
                  <span className="text-red-500">{this.state.error.name}</span>
                </div>
                <div className="text-red-300 break-words font-semibold mb-2">{this.state.error.message}</div>
                <div className="text-zinc-500 break-words mb-2">{this.state.error.stack}</div>
                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                  <div className="mt-3 pt-2 border-t border-red-500/10 text-orange-400 break-words">
                    <div className="text-orange-500 mb-1 font-semibold">Component Stack Tracker:</div>
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors"
              >
                <RefreshCcw className="w-3 h-3" />
                Retry
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-zinc-700 transition-colors border border-white/5"
              >
                <Home className="w-3 h-3" />
                Home
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
