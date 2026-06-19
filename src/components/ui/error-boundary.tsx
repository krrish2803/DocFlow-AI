'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center mb-4">
            <span className="text-red-500 text-lg">!</span>
          </div>
          <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
          <p className="text-sm text-neutral-400 mb-4 max-w-md">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <Button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
