// src/components/ui/ErrorBoundary.jsx — catches render errors in any subtree
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-64 p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-base font-semibold text-gray-700 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-400 mb-4 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred on this page.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-secondary btn-sm"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
