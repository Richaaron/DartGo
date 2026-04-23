import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { DEFAULT_SUBJECTS } from './types'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './utils/toast'
import './index.css'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

function initializeSubjects() {
  const existingSubjects = window.localStorage.getItem('subjects')
  if (!existingSubjects || JSON.parse(existingSubjects).length === 0) {
    window.localStorage.setItem('subjects', JSON.stringify(DEFAULT_SUBJECTS))
  }
}

initializeSubjects()

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
