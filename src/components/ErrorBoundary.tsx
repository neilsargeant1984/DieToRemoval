import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#121622] border border-rose-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-fantasy font-black text-xl text-white tracking-wider">Something went wrong</h2>
              <p className="text-xs text-stone-400 mt-1">
                A client rendering error occurred. You can reload the page or reset the view.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-[11px] bg-black/60 p-3 rounded-xl text-rose-300 font-mono text-left overflow-x-auto max-h-32 border border-white/5">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn-mythic-spark w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload DieToRemoval</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
