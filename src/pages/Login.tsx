import { useState, useEffect } from 'react'
import { LogIn, User, GraduationCap, Users } from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'

interface LoginProps {
  onLoginSuccess: () => void
}

type LoginType = 'admin' | 'teacher' | 'parent'

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loginType, setLoginType] = useState<LoginType | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuthContext()

  useEffect(() => {
    if (isAuthenticated) {
      onLoginSuccess()
    }
  }, [isAuthenticated, onLoginSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email || !password) {
      setError('Please enter username and password')
      setIsLoading(false)
      return
    }

    try {
      const success = await login(email, password)
      
      if (success) {
        console.log('Login successful')
        // Force state update and callback
        onLoginSuccess()
      } else {
        setError('Invalid username or password')
        setIsLoading(false)
      }
    } catch (err) {
      setError('A network error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setLoginType(null)
    setEmail('')
    setPassword('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">FOLUSHO</h1>
          <p className="text-blue-100">Result Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {!loginType ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Select Login Type
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Choose your role to proceed
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => setLoginType('admin')}
                  className="w-full flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                >
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">Admin Login</p>
                    <p className="text-sm text-gray-600">Manage students, teachers & results</p>
                  </div>
                </button>

                <button
                  onClick={() => setLoginType('teacher')}
                  className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">Teacher Login</p>
                    <p className="text-sm text-gray-600">Enter & manage subject results</p>
                  </div>
                </button>

                <button
                  onClick={() => setLoginType('parent')}
                  className="w-full flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                >
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">Parent Portal</p>
                    <p className="text-sm text-gray-600">View your child's results</p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="text-blue-600 hover:text-blue-800 text-sm mb-4"
              >
                ← Back to login type selection
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                {loginType === 'admin' && 'Admin Login'}
                {loginType === 'teacher' && 'Teacher Login'}
                {loginType === 'parent' && 'Parent Portal'}
              </h2>
              
              <p className="text-gray-600 text-center mb-6">
                {loginType === 'admin' && 'Enter your admin credentials'}
                {loginType === 'teacher' && 'Enter your teacher username and password'}
                {loginType === 'parent' && 'Enter your parent username (from student registration)'}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {loginType === 'parent' ? 'Parent Username' : 'Username / Email'}
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={loginType === 'parent' ? 'Enter parent username' : 'Enter your username'}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {loginType === 'parent' ? 'Parent Password' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={loginType === 'parent' ? 'Enter parent password' : 'Enter your password'}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn size={18} />
                      <span>Authorize Access</span>
                    </div>
                  )}
                </button>
              </form>

              {/* Demo Credentials Removed */}
            </>
          )}
        </div>
      </div>
    </div>
  )
}