import React, { useState, useEffect } from 'react'
import { Check, User, GraduationCap, Users, BookOpen, Zap, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthContext } from '../context/AuthContext'

interface LoginProps {
  onLoginSuccess: () => void
}

type LoginType = 'admin' | 'teacher' | 'parent'

// Animation for graduation cap
const graduationCapVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1] as any
    }
  },
  hover: {
    y: [-5, 5, -5],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1] as any
    }
  }
} as any

// Animation variants for floating elements
const floatingVariants = (delay: number) => ({
  hidden: { opacity: 0, y: 0 },
  visible: {
    opacity: [0.3, 0.6, 0.3],
    y: [0, -30, 0],
    transition: {
      duration: 4,
      delay,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1] as any
    }
  }
}) as any

const rotatingVariants = (delay: number) => ({
  hidden: { opacity: 0, rotate: 0 },
  visible: {
    opacity: [0.2, 0.5, 0.2],
    rotate: 360,
    transition: {
      duration: 8,
      delay,
      repeat: Infinity,
      ease: [0.5, 0.5, 0.5, 0.5] as any
    }
  }
})

const AcademicBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Floating Books */}
    <motion.div
      className="absolute top-20 left-10"
      variants={floatingVariants(0)}
      initial="hidden"
      animate="visible"
    >
      <BookOpen className="w-12 h-12 text-gold-300/20" strokeWidth={1.5} />
    </motion.div>

    <motion.div
      className="absolute top-40 right-20"
      variants={floatingVariants(1)}
      initial="hidden"
      animate="visible"
    >
      <BookOpen className="w-16 h-16 text-purple-300/15" strokeWidth={1.5} />
    </motion.div>

    <motion.div
      className="absolute bottom-32 left-1/4"
      variants={floatingVariants(2)}
      initial="hidden"
      animate="visible"
    >
      <BookOpen className="w-14 h-14 text-gold-400/10" strokeWidth={1.5} />
    </motion.div>

    {/* Floating Graduation Caps */}
    <motion.div
      className="absolute top-1/3 right-10"
      variants={floatingVariants(1.5)}
      initial="hidden"
      animate="visible"
    >
      <GraduationCap className="w-14 h-14 text-purple-300/15" strokeWidth={1.5} />
    </motion.div>

    <motion.div
      className="absolute bottom-20 right-1/4"
      variants={floatingVariants(2.5)}
      initial="hidden"
      animate="visible"
    >
      <GraduationCap className="w-12 h-12 text-gold-300/20" strokeWidth={1.5} />
    </motion.div>

    {/* Floating Trophies */}
    <motion.div
      className="absolute top-1/4 left-1/3"
      variants={floatingVariants(0.8)}
      initial="hidden"
      animate="visible"
    >
      <Trophy className="w-10 h-10 text-emerald-300/15" strokeWidth={1.5} />
    </motion.div>

    <motion.div
      className="absolute bottom-40 right-1/3"
      variants={floatingVariants(1.8)}
      initial="hidden"
      animate="visible"
    >
      <Trophy className="w-12 h-12 text-gold-400/10" strokeWidth={1.5} />
    </motion.div>

    {/* Rotating Zap Icons */}
    <motion.div
      className="absolute top-1/2 left-20"
      variants={rotatingVariants(0)}
      initial="hidden"
      animate="visible"
    >
      <Zap className="w-10 h-10 text-gold-300/10" strokeWidth={1.5} />
    </motion.div>

    <motion.div
      className="absolute bottom-1/4 right-10"
      variants={rotatingVariants(2)}
      initial="hidden"
      animate="visible"
    >
      <Zap className="w-12 h-12 text-purple-300/15" strokeWidth={1.5} />
    </motion.div>

    {/* Animated gradient orbs */}
    <motion.div
      className="absolute top-1/4 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
      animate={{
        x: [0, 30, 0],
        y: [0, -30, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />

    <motion.div
      className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl"
      animate={{
        x: [0, -30, 0],
        y: [0, 30, 0],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1
      }}
    />
  </div>
)

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
    } catch {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
      <AcademicBackground />
      <div className="w-full max-w-5xl relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          className="w-full flex flex-col items-center text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-500 rounded-full mb-4 shadow-lg shadow-gold-400/30"
            variants={graduationCapVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <GraduationCap className="w-8 h-8 text-black" strokeWidth={2} />
          </motion.div>
          <motion.h1
            className="w-full max-w-4xl mx-auto whitespace-nowrap text-[1.05rem] sm:text-[1.35rem] md:text-[1.8rem] lg:text-[2.3rem] font-black uppercase tracking-[0.12em] text-center mb-3"
            animate={{
              scale: [1, 1.03, 1],
              textShadow: [
                '0 0 12px rgba(251,191,36,0.35), 0 0 24px rgba(245,158,11,0.2)',
                '0 0 20px rgba(251,191,36,0.75), 0 0 40px rgba(245,158,11,0.45)',
                '0 0 12px rgba(251,191,36,0.35), 0 0 24px rgba(245,158,11,0.2)',
              ],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              color: '#fbbf24',
              WebkitTextStroke: '1px rgba(120, 53, 15, 0.65)',
              letterSpacing: '0.12em',
            }}
          >
            FOLUSHO VICTORY SCHOOLS
          </motion.h1>
          <p className="text-gold-200 font-semibold tracking-[0.25em] uppercase">Result Management System</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          className="w-full max-w-md bg-white dark:bg-black/60 dark:backdrop-blur-md rounded-lg shadow-2xl p-8 border border-gold-200/30 dark:border-gold-500/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {!loginType ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Select Login Type
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                Choose your role to proceed
              </p>
              
              <div className="space-y-4">
                <motion.button
                  onClick={() => setLoginType('admin')}
                  className="w-full flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800/40 border-2 border-purple-200 dark:border-purple-700 rounded-lg transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 dark:text-white">Admin Login</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Manage students, teachers & results</p>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setLoginType('teacher')}
                  className="w-full flex items-center gap-4 p-4 bg-gold-50 dark:bg-gold-900/20 hover:bg-gold-100 dark:hover:bg-gold-800/30 border-2 border-gold-200 dark:border-gold-600 rounded-lg transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-500 rounded-full flex items-center justify-center shadow-lg shadow-gold-400/30">
                    <GraduationCap className="w-6 h-6 text-black" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 dark:text-white">Teacher Login</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Enter & manage subject results</p>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setLoginType('parent')}
                  className="w-full flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 border-2 border-emerald-200 dark:border-emerald-600 rounded-lg transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-400/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 dark:text-white">Parent Portal</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">View your child's results</p>
                  </div>
                </motion.button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="text-purple-600 dark:text-gold-400 hover:text-purple-800 dark:hover:text-gold-300 text-sm mb-4 font-semibold"
              >
                ← Back to login type selection
              </button>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                {loginType === 'admin' && 'Admin Login'}
                {loginType === 'teacher' && 'Teacher Login'}
                {loginType === 'parent' && 'Parent Portal'}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                {loginType === 'admin' && 'Enter your admin credentials'}
                {loginType === 'teacher' && 'Enter your teacher username and password'}
                {loginType === 'parent' && 'Enter your parent username (from student registration)'}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-600 rounded-lg">
                  <p className="text-rose-700 dark:text-rose-400 text-sm font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                    {loginType === 'parent' ? 'Parent Username' : 'Username / Email'}
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder={loginType === 'parent' ? 'Enter parent username' : 'Enter your username'}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                    {loginType === 'parent' ? 'Parent Password' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
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
                      <Check size={18} />
                      <span>Authorize Access</span>
                    </div>
                  )}
                </button>
              </form>

              {/* Demo Credentials Removed */}
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
