import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './utils/toast'
import './index.css'

// Suppress harmless Recharts warnings about width/height during Framer Motion animations
const originalConsoleWarn = console.warn;
console.warn = function (...args) {
  if (typeof args[0] === 'string' && args[0].includes('The width(-1) and height(-1) of chart should be greater than 0')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
const isSentryEnabled =
  sentryDsn &&
  sentryDsn.trim() !== '' &&
  sentryDsn.startsWith('https://') &&
  !sentryDsn.includes('your-dsn-string-here') &&
  !sentryDsn.includes('xxxxx')

if (isSentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
