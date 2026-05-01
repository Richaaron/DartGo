import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
  enableRetry?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // Report to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: errorInfo })
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  handleRetry = () => {
    const maxRetries = 3
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    } else {
      // Max retries reached, reload page
      this.handleReload()
    }
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, retryCount: 0 })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-slate-800 to-purple-900 dark:from-brand-950 dark:via-slate-900 dark:to-purple-950 p-4">
          <div className="max-w-md w-full bg-gradient-to-br from-white to-brand-50 dark:from-brand-800/95 dark:to-brand-900/95 dark:backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center border border-purple-200/50 dark:border-purple-600/30">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/40 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-3">Oops! Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed font-medium">
              We encountered an unexpected error. Don't worry, our team has been notified and is working on it.
            </p>
            {(import.meta.env.DEV || this.props.showDetails) && this.state.error && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-left border border-rose-200 dark:border-rose-800/40">
                <p className="font-mono text-xs text-rose-700 dark:text-rose-300 break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-3">
                    {this.state.errorInfo.componentStack}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              {this.props.enableRetry !== false && (
                <button
                  onClick={this.handleRetry}
                  className="btn-primary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              )}
              <button
                onClick={this.handleGoHome}
                className="btn-secondary flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary