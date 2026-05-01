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
    label: "Admin",
    desc: "Manage students, teachers and results",
    icon: <Shield className="w-5 h-5" />,
    color: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
  },
  {
    id: "teacher",
    label: "Teacher",
    desc: "Enter and manage subject results",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
  },
  {
    id: "parent",
    label: "Parent",
    desc: "View your child's progress",
    icon: <Users className="w-5 h-5" />,
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
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
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-brand-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Blue glow orbs */}
        <div className="absolute top-1/4 left-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2" />
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-8 shadow-lg shadow-blue-600/30">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
            Folusho Victory
            <br />
            Schools
          </h1>
          <p className="text-brand-400 text-sm font-medium mb-12">
            Result Management System
          </p>

          {/* Feature list */}
          <div className="space-y-4 text-left">
            {[
              "Student result entry and management",
              "Automated report card generation",
              "Teacher and class management",
              "Real-time performance analytics",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-brand-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <p className="absolute bottom-8 text-brand-600 text-xs">
          © 2025 Folusho Victory Schools
        </p>
      </div>

      {/* ── Right Panel ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-brand-50 dark:bg-brand-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-brand-900 dark:text-white text-sm">
                Folusho Victory Schools
              </p>
              <p className="text-xs text-brand-500">Result Management System</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!loginType ? (
              /* ── Role selection ── */
              <motion.div
                key="role-select"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-brand-900 dark:text-white mb-1">
                  Welcome back
                </h2>
                <p className="text-brand-500 dark:text-brand-400 mb-8 text-sm">
                  Select your role to continue
                </p>

                <div className="space-y-3">
                  {loginTypes.map((type, i) => (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      onClick={() => setLoginType(type.id)}
                      className="w-full flex items-center gap-4 p-4 bg-white dark:bg-brand-800 border border-brand-200 dark:border-brand-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-card-md transition-all duration-150 group text-left"
                    >
                      <div
                        className={`p-2.5 rounded-lg ${type.iconBg} ${type.color} flex-shrink-0`}
                      >
                        {type.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-brand-900 dark:text-white text-sm">
                          {type.label} Login
                        </p>
                        <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
                          {type.desc}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-brand-400 group-hover:text-brand-600 dark:group-hover:text-brand-300 flex-shrink-0 transition-colors" />
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
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200 mb-6 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back
                </button>

                {/* Role badge */}
                {selectedType && (
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`p-2.5 rounded-lg ${selectedType.iconBg} ${selectedType.color}`}
                    >
                      {selectedType.icon}
                    </div>
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
