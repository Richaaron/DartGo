import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Check,
  User,
  GraduationCap,
  Users,
  Eye,
  EyeOff,
  Shield,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "../context/AuthContext";

interface LoginProps {
  onLoginSuccess: () => void;
}

type LoginType = "admin" | "teacher" | "parent";

const loginTypes: {
  id: LoginType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  iconBg: string;
}[] = [
  {
    id: "admin",
    label: "Admin Login",
    desc: "Manage students, teachers and results",
    icon: <Shield className="w-5 h-5" />,
    color: "text-royal-purple-600 dark:text-royal-gold-300",
    iconBg: "bg-gradient-to-br from-royal-purple-100 to-royal-purple-50 dark:from-royal-purple-900/30 dark:to-royal-purple-800/20",
  },
  {
    id: "teacher",
    label: "Teacher Login",
    desc: "Enter and manage subject results",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-royal-gold-600 dark:text-royal-gold-300",
    iconBg: "bg-gradient-to-br from-royal-gold-100 to-royal-gold-50 dark:from-royal-gold-900/30 dark:to-royal-gold-800/20",
  },
  {
    id: "parent",
    label: "Parent Login",
    desc: "View your child's progress",
    icon: <Users className="w-5 h-5" />,
    color: "text-royal-black-600 dark:text-royal-gold-300",
    iconBg: "bg-gradient-to-br from-royal-purple-100 to-royal-gold-50 dark:from-royal-black-800 dark:to-royal-purple-800/20",
  },
];

export default function Login({ onLoginSuccess }: LoginProps) {
  const location = useLocation();
  const [loginType, setLoginType] = useState<LoginType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated) onLoginSuccess();
  }, [isAuthenticated, onLoginSuccess]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    if (type === "admin" || type === "teacher" || type === "parent")
      setLoginType(type);
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    if (!email || !password) {
      setError("Please enter your username and password");
      setIsLoading(false);
      return;
    }
    try {
      const success = await login(email, password);
      if (success) {
        onLoginSuccess();
      } else {
        setError("Invalid username or password");
        setIsLoading(false);
      }
    } catch {
      setError("A network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setLoginType(null);
    setEmail("");
    setPassword("");
    setError("");
  };

  const selectedType = loginTypes.find((t) => t.id === loginType);

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-gradient-to-br from-royal-purple-600 via-royal-black-500 to-royal-purple-700 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Gold glow orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/2 w-80 h-80 bg-royal-gold-500/20 rounded-full blur-3xl -translate-x-1/2"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/3 w-60 h-60 bg-royal-purple-400/15 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.4, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />

        <motion.div 
          className="relative z-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo */}
          <motion.div 
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-royal-gold-400 to-royal-gold-500 rounded-2xl mb-8 shadow-2xl shadow-royal-gold-500/40"
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ perspective: '1200px' }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <GraduationCap className="w-11 h-11 text-royal-purple-700" />
            </motion.div>
          </motion.div>

          <h1 className="text-4xl font-bold text-white mb-3 leading-tight animate-fadeInDown">
            Folusho Victory
            <br />
            Schools
          </h1>
          <p className="text-royal-gold-300 text-base font-semibold mb-12 animate-fadeInUp">
            Result Management System
          </p>

          {/* Feature list */}
          <div className="space-y-4 text-left">
            {[
              "Student result entry and management",
              "Automated report card generation",
              "Teacher and class management",
              "Real-time performance analytics",
            ].map((feature, i) => (
              <motion.div 
                key={feature}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <motion.div 
                  className="w-5 h-5 rounded-full bg-royal-gold-400/30 border border-royal-gold-400 flex items-center justify-center flex-shrink-0"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Check className="w-3 h-3 text-royal-gold-300" />
                </motion.div>
                <span className="text-royal-gold-200 text-sm font-medium">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom copyright */}
        <motion.p 
          className="absolute bottom-8 text-royal-gold-400 text-xs font-semibold"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          © 2025 Folusho Victory Schools
        </motion.p>
      </div>

      {/* ── Right Panel ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-royal-gold-50 via-white to-royal-purple-50 dark:bg-gradient-to-br dark:from-royal-black-900 dark:via-royal-purple-900/20 dark:to-royal-black-900">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Mobile logo */}
          <motion.div 
            className="flex items-center gap-3 mb-8 lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-royal-purple-600 to-royal-gold-500 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-royal-purple-900 dark:text-royal-gold-300 text-base">
                Folusho Victory Schools
              </p>
              <p className="text-xs text-royal-purple-600 dark:text-royal-gold-400 font-medium">Result Management System</p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!loginType ? (
              /* ── Role selection ── */
              <motion.div
                key="role-select"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-royal-purple-600 to-royal-gold-500 mb-1">
                  Welcome back
                </h2>
                <p className="text-royal-purple-600 dark:text-royal-gold-400 mb-8 text-sm font-semibold">
                  Select your role to continue
                </p>

                <div className="space-y-3">
                  {loginTypes.map((type, i) => (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02, translateX: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => setLoginType(type.id)}
                      className="w-full flex items-center gap-4 p-4 bg-white dark:bg-royal-black-800 border-2 border-royal-gold-200 dark:border-royal-purple-700/50 rounded-xl hover:border-royal-purple-400 dark:hover:border-royal-gold-500 hover:shadow-xl transition-all duration-200 group text-left"
                    >
                      <motion.div
                        className={`p-3 rounded-lg ${type.iconBg} ${type.color} flex-shrink-0`}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {type.icon}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-royal-purple-900 dark:text-white text-base">
                          {type.label}
                        </p>
                        <p className="text-xs text-royal-purple-600 dark:text-royal-gold-400 mt-0.5 font-medium">
                          {type.desc}
                        </p>
                      </div>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ChevronRight className="w-5 h-5 text-royal-gold-500 group-hover:text-royal-purple-600 dark:group-hover:text-royal-gold-400 flex-shrink-0 transition-colors" />
                      </motion.div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* ── Login form ── */
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-royal-purple-600 hover:text-royal-purple-700 dark:text-royal-gold-400 dark:hover:text-royal-gold-300 mb-6 transition-colors font-semibold"
                  whileHover={{ x: -4 }}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back
                </motion.button>

                {/* Role badge */}
                {selectedType && (
                  <motion.div 
                    className="flex items-center gap-3 mb-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div
                      className={`p-3 rounded-lg ${selectedType.iconBg} ${selectedType.color}`}
                    >
                      {selectedType.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-royal-purple-900 dark:text-white">
                        {selectedType.label}
                      </h2>
                      <p className="text-xs text-royal-purple-600 dark:text-royal-gold-400 font-medium">
                        {selectedType.desc}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-xl"
                    >
                      <p className="text-red-700 dark:text-red-300 text-sm font-bold">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                      {loginType === "parent"
                        ? "Parent Username"
                        : "Username / Email"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-royal-purple-400 dark:text-royal-gold-400" />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-12"
                        placeholder={
                          loginType === "parent"
                            ? "Enter parent username"
                            : "Enter your username"
                        }
                        disabled={isLoading}
                        autoComplete="username"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field pr-12"
                        placeholder="Enter your password"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-royal-purple-400 hover:text-royal-purple-600 dark:hover:text-royal-gold-400 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-3 mt-6 text-base font-bold shadow-lg shadow-royal-purple-500/30"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <motion.div 
                          className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Sign In
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
                    <div>
                      <h2 className="text-xl font-bold text-brand-900 dark:text-white">
                        {selectedType.label} Login
                      </h2>
                      <p className="text-xs text-brand-500 dark:text-brand-400">
                        {selectedType.desc}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg"
                    >
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                      {loginType === "parent"
                        ? "Parent Username"
                        : "Username / Email"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-9"
                        placeholder={
                          loginType === "parent"
                            ? "Enter parent username"
                            : "Enter your username"
                        }
                        disabled={isLoading}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field pr-10"
                        placeholder="Enter your password"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-3 mt-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Sign In
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
