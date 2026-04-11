
import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can log the error to an error reporting service
    console.error('[MazdaCare ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '24px',
          background: '#0F0A0B', fontFamily: 'sans-serif'
        }}>
          <div style={{
            background: '#1C1618', borderRadius: '16px', padding: '24px',
            maxWidth: '380px', width: '100%', border: '1px solid rgba(163,21,38,.3)'
          }}>
            <div style={{ color: '#A31526', fontWeight: 700, marginBottom: '8px' }}>
              App crashed — error details:
            </div>
            <pre style={{
              color: 'rgba(255,255,255,.7)', fontSize: '11px',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              background: 'rgba(0,0,0,.3)', padding: '12px',
              borderRadius: '8px', maxHeight: '300px', overflow: 'auto'
            }}>
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{
                marginTop: '16px', width: '100%', background: '#A31526',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '12px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear cache and reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
