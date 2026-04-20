import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { DEFAULT_SUBJECTS } from './types'
import './index.css'

function initializeSubjects() {
  const existingSubjects = window.localStorage.getItem('subjects')
  if (!existingSubjects || JSON.parse(existingSubjects).length === 0) {
    window.localStorage.setItem('subjects', JSON.stringify(DEFAULT_SUBJECTS))
  }
}

initializeSubjects()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
