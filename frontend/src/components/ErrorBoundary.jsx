// ErrorBoundary.jsx — React error boundary
// Catches errors in child components and shows a friendly error page
// Usage: wrap any page or section with <ErrorBoundary>

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev, would go to Sentry in prod
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    if (fallback) return fallback;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 300, padding: 32, textAlign: 'center',
        background: '#fff', borderRadius: 12, border: '1px solid #fee2e2', margin: 16,
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: '#dc2626', fontWeight: 800, margin: '0 0 8px', fontSize: '1rem' }}>
          Something went wrong
        </h3>
        <p style={{ color: '#6b7280', fontSize: '.85rem', margin: '0 0 20px', maxWidth: 380 }}>
          This section encountered an error. The rest of the app is still working.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '8px 18px', background: '#0b1f3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '.82rem', fontWeight: 700 }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 18px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: '.82rem', fontWeight: 700 }}
          >
            Reload Page
          </button>
        </div>
        {process.env.NODE_ENV !== 'production' && this.state.error && (
          <details style={{ marginTop: 16, textAlign: 'left', maxWidth: 500 }}>
            <summary style={{ cursor: 'pointer', fontSize: '.75rem', color: '#9ca3af' }}>Error details (dev only)</summary>
            <pre style={{ fontSize: '.68rem', color: '#dc2626', background: '#fef2f2', padding: 10, borderRadius: 6, marginTop: 8, overflow: 'auto', maxHeight: 200 }}>
              {this.state.error.toString()}
            </pre>
          </details>
        )}
      </div>
    );
  }
}

// ── Page-level error boundary wrapper ────────────────────────────────────
export function withErrorBoundary(Component) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
