/* global localStorage, fetch */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { User, Teacher, Admin, Parent, AuthSession } from '../types'

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return 'http://localhost:3002/api'
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
}

const API_URL = getBaseUrl()

// Development fallback users - ONLY in development mode
const isDevelopment = import.meta.env.DEV
const DEVELOPMENT_FALLBACK_USERS = isDevelopment ? [
  {
    loginIds: ['admin@folusho.com'],
    password: 'AdminPassword123!@#',
    user: {
      id: 'dev-admin',
      email: 'admin@folusho.com',
      name: 'Admin User',
      role: 'Admin' as const,
    },
  },
  {
    loginIds: ['teacher1@folusho.com', 'teacher1'],
    password: 'TeacherPassword123!@#',
    user: {
      id: 'dev-teacher-1',
      email: 'teacher1@folusho.com',
      name: 'Mr. Adeyemi',
      role: 'Teacher' as const,
      teacherId: 'T001',
      username: 'teacher1',
      subject: 'Mathematics',
      level: 'Secondary' as const,
      assignedClasses: ['SSS1A', 'SSS1B', 'SSS2A'],
    },
  },
  {
    loginIds: ['dart-teacher@folusho.com', 'dartteacher'],
    password: 'DartTeacher123!@#',
    user: {
      id: 'dev-teacher-dart',
      email: 'dart-teacher@folusho.com',
      name: 'Ms. Johnson',
      role: 'Teacher' as const,
      teacherId: 'T002',
      username: 'dartteacher',
      subject: 'Dart Programming',
      level: 'Secondary' as const,
      assignedClasses: ['SSS2A', 'SSS2B', 'SSS3A'],
    },
  },
] : []
  session: AuthSession
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  user: User | Teacher | Admin | Parent | null
  token: string | null
  isHydrated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>(() => {
    const defaultSession: AuthSession = {
      user: null,
      token: undefined,
      isAuthenticated: false,
    }

    try {
      const stored = localStorage.getItem('authSession')
      return stored ? JSON.parse(stored) : defaultSession
    } catch (e) {
      console.error('Failed to load auth session:', e)
      return defaultSession
    }
  })
  const [isHydrated] = useState(true)
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null)

  // Session timeout effect
  useEffect(() => {
    if (!session.isAuthenticated) return

    // Clear existing timer
    if (sessionTimer) clearTimeout(sessionTimer)

    // Set new timer
    const timer = setTimeout(() => {
      console.warn('[AUTH] Session timeout - logging out')
      logout()
    }, SESSION_TIMEOUT)

    setSessionTimer(timer)

    // Cleanup
    return () => clearTimeout(timer)
  }, [session.isAuthenticated])

  // Reset session timer on user activity
  useEffect(() => {
    if (!session.isAuthenticated) return

    const resetTimer = () => {
      if (sessionTimer) clearTimeout(sessionTimer)
      const newTimer = setTimeout(() => {
        console.warn('[AUTH] Session timeout - logging out')
        logout()
      }, SESSION_TIMEOUT)
      setSessionTimer(newTimer)
    }

    // Listen for user activity
    window.addEventListener('mousedown', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('scroll', resetTimer)
    window.addEventListener('touchstart', resetTimer)

    return () => {
      window.removeEventListener('mousedown', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('scroll', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
    }
  }, [session.isAuthenticated, sessionTimer])

  const login = useCallback(async (email: string, password: string) => {
    const normalizedLoginId = email.trim().toLowerCase()

    const createSession = (user: User | Teacher | Admin | Parent, token: string) => {
      const newSession: AuthSession = {
        user,
        token,
        isAuthenticated: true,
        lastLogin: new Date().toISOString(),
      }

      setSession(newSession)
      localStorage.setItem('authSession', JSON.stringify(newSession))
      return true
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedLoginId, password }),
      })

      if (res.ok) {
        const { token, user } = await res.json()
        return createSession(user, token)
      }

      console.log('API login failed, checking development fallback credentials')
    } catch (error) {
      console.error('Login error:', error)
      console.log('Falling back to local development credentials')
    }

    const fallbackUser = DEVELOPMENT_FALLBACK_USERS.find(
      (candidate) =>
        candidate.password === password &&
        candidate.loginIds.includes(normalizedLoginId)
    )

    if (!fallbackUser) {
      return false
    }

    return createSession(fallbackUser.user, 'dev-local-token')
  }, [])

  const logout = useCallback(() => {
    setSession({
      user: null,
      token: undefined,
      isAuthenticated: false,
    })
    localStorage.removeItem('authSession')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        login,
        logout,
        isAuthenticated: session.isAuthenticated,
        user: session.user,
        token: session.token || null,
        isHydrated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
