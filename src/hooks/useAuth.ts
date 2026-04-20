import { useState, useCallback } from 'react'
import { User, Teacher, Admin, UserRole, AuthSession } from '../types'

const MOCK_USERS: Record<string, User | Teacher | Admin> = {
  'admin@folusho.com': {
    id: 'ADMIN001',
    email: 'admin@folusho.com',
    name: 'Admin User',
    role: 'Admin',
  },
  'teacher@folusho.com': {
    id: 'TEACHER001',
    email: 'teacher@folusho.com',
    name: 'Mr. Adeyemi',
    role: 'Teacher',
    teacherId: 'T001',
    username: 'teacher',
    subject: 'Mathematics',
    level: 'Secondary',
    assignedClasses: ['SSS1A', 'SSS1B', 'SSS2A'],
  } as Teacher,
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession>(() => {
    const stored = window.localStorage.getItem('authSession')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        console.log('Loaded session from localStorage:', parsed)
        return parsed
      } catch (e) {
        console.error('Failed to load auth session:', e)
      }
    }

    return {
      user: null,
      isAuthenticated: false,
    }
  })
  const isHydrated = true

  const login = useCallback((email: string, password: string) => {
    console.log('Login attempt:', email)
    const user = MOCK_USERS[email]
    
    if (!user) {
      console.log('User not found:', email)
      return false
    }

    const storedPassword = email === 'admin@folusho.com' ? 'admin123' : 'teacher123'
    if (password !== storedPassword) {
      console.log('Password mismatch')
      return false
    }

    const newSession: AuthSession = {
      user,
      isAuthenticated: true,
      lastLogin: new Date().toISOString(),
    }
    
    console.log('Setting session:', newSession)
    setSession(newSession)
    window.localStorage.setItem('authSession', JSON.stringify(newSession))
    
    // Force a small delay to ensure state updates
    return true
  }, [])

  const logout = useCallback(() => {
    console.log('Logout')
    setSession({
      user: null,
      isAuthenticated: false,
    })
    window.localStorage.removeItem('authSession')
  }, [])

  const hasRole = useCallback((role: UserRole | UserRole[]) => {
    if (!session.user) return false
    if (Array.isArray(role)) {
      return role.includes(session.user.role)
    }
    return session.user.role === role
  }, [session.user])

  return {
    session,
    login,
    logout,
    hasRole,
    isAuthenticated: session.isAuthenticated,
    user: session.user,
    isHydrated,
  }
}
