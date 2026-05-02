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
  try {
    const existingSubjects = window.localStorage.getItem('subjects')
    const subjectsVersion = window.localStorage.getItem('subjectsVersion')
    const appVersion = '2.0.1' // Increment this when subjects change
    
    // Clear cache if version changed, data is empty, or count doesn't match
    const shouldResetCache = 
      !existingSubjects || 
      subjectsVersion !== appVersion || 
      (existingSubjects && JSON.parse(existingSubjects).length !== DEFAULT_SUBJECTS.length)
    
    if (shouldResetCache) {
      console.log('Resetting subjects cache - loading fresh subjects from DEFAULT_SUBJECTS')
      window.localStorage.setItem('subjects', JSON.stringify(DEFAULT_SUBJECTS))
      window.localStorage.setItem('subjectsVersion', appVersion)
    }
  } catch (error) {
    console.error('Error initializing subjects:', error)
    // Force reset on any error
    window.localStorage.setItem('subjects', JSON.stringify(DEFAULT_SUBJECTS))
    window.localStorage.setItem('subjectsVersion', '2.0.1')
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
