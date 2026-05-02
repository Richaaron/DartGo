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
  const subjectsVersion = window.localStorage.getItem('subjectsVersion')
  
  // Clear cache and reinitialize if version changed or cache is empty
  if (!existingSubjects || subjectsVersion !== 'v1' || JSON.parse(existingSubjects || '[]').length !== DEFAULT_SUBJECTS.length) {
    window.localStorage.setItem('subjects', JSON.stringify(DEFAULT_SUBJECTS))
    window.localStorage.setItem('subjectsVersion', 'v1')
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
