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
    
    // Auto-reload on chunk load failures (common after new deployments)
    const isChunkLoadError = 
      error.message.includes('chunk') || 
      error.message.includes('dynamically imported module') ||
      error.name === 'ChunkLoadError';
      
    if (isChunkLoadError) {
      const lastReload = sessionStorage.getItem('folusho_last_chunk_reload');
      const now = Date.now();
      
      // Prevent infinite reload loops (only reload if last reload was > 5s ago)
      if (!lastReload || (now - parseInt(lastReload)) > 5000) {
        sessionStorage.setItem('folusho_last_chunk_reload', now.toString());
        console.warn('Chunk load error detected, forcing page reload to sync with deployment...');
        window.location.reload();
        return;
      }
    }

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
        <div className="min-h-screen flex items-center justify-center bg-folusho-slate-950 p-4">
          <div className="max-w-md w-full bg-folusho-slate-900/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl p-12 text-center border border-white/5">
            <div className="w-24 h-24 mx-auto mb-10 rounded-full bg-folusho-coral-500/20 flex items-center justify-center shadow-2xl animate-pulse border border-folusho-coral-500/30">
              <AlertTriangle className="w-10 h-10 text-folusho-coral-400" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Oops! Something went wrong</h2>
            <p className="text-folusho-slate-400 mb-10 leading-relaxed font-bold">
              We encountered an unexpected error. Don't worry, our team has been notified and is working on it.
            </p>
            {(import.meta.env.DEV || this.props.showDetails) && this.state.error && (
              <div className="mb-10 p-6 bg-folusho-coral-500/5 rounded-3xl text-left border border-folusho-coral-500/10">
                <p className="font-mono text-xs text-folusho-coral-400 break-all leading-relaxed">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <p className="font-mono text-[9px] text-folusho-slate-500 mt-4 line-clamp-3 uppercase tracking-wider">
                    {this.state.errorInfo.componentStack}
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col gap-4 w-full">
              {this.props.enableRetry !== false && (
                <button
                  onClick={this.handleRetry}
                  className="px-10 py-4 bg-folusho-sage-400 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-folusho-sage-500 transition-all flex items-center justify-center gap-3 shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => (window.location.href = "/")}
                  className="flex-1 px-6 py-4 bg-folusho-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-folusho-slate-700 transition-all border border-white/5"
                >
                  Return Home
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/";
                  }}
                  className="flex-1 px-6 py-4 bg-folusho-coral-500/10 text-folusho-coral-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-folusho-coral-500/20 transition-all border border-folusho-coral-500/20"
                >
                  Reset State
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary