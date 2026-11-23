import React from 'react';

const isDev = import.meta.env.DEV;

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message + '\n' + error.stack;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: unknown }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-5xl">🌱</div>
            <h1 className="text-2xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              The app hit an unexpected error. Try reloading.
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 rounded-lg btn-brand font-semibold transition-colors"
            >
              Reload app
            </button>
            {isDev && (
              <pre className="mt-4 p-3 text-left text-xs bg-muted text-destructive rounded overflow-auto max-h-48">
                {serializeError(this.state.error)}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}