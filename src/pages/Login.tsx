import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Check,
  User,
  GraduationCap,
  Users,
  BookOpen,
  Zap,
  Trophy,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthContext } from "../context/AuthContext";

interface LoginProps {
  onLoginSuccess: () => void;
}

type LoginType = "admin" | "teacher" | "parent";

// Animation for graduation cap
const graduationCapVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1] as any,
    },
  },
  hover: {
    y: [-5, 5, -5],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1] as any,
    },
  },
} as any;

// Animation variants for floating elements
const floatingVariants = (delay: number) =>
  ({
    hidden: { opacity: 0, y: 0 },
    visible: {
      opacity: [0.3, 0.6, 0.3],
      y: [0, -30, 0],
      transition: {
        duration: 4,
        delay,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1] as any,
      },
    },
  }) as any;

const rotatingVariants = (delay: number) => ({
  hidden: { opacity: 0, rotate: 0 },
  visible: {
    opacity: [0.2, 0.5, 0.2],
    rotate: 360,
    transition: {
      duration: 8,
      delay,
      repeat: Infinity,
      ease: [0.5, 0.5, 0.5, 0.5] as any,
    },
  },
});

const AcademicBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Floating Books */}
    <motion.div
      className="absolute top-20 left-10"
      variants={floatingVariants(0)}
      initial="hidden"
      animate="visible"
    >
      <BookOpen className="w-12 h-12 text-school-yellow/30" strokeWidth={1.5} />
    </motion.div>

    <motion.div
      className="absolute top-40 right-20"
      variants={floatingVariants(1)}
      initial="hidden"
      animate="visible"
    >
      <BookOpen className="w-16 h-16 text-school-pink/20" strokeWidth={1.5} />
    </motion.div>

    <motion.div
      className="absolute bottom-32 left-1/4"
      variants={floatingVariants(2)}
      initial="hidden"
      animate="visible"
    >
      <BookOpen className="w-14 h-14 text-school-blue/15" strokeWidth={1.5} />
    </motion.div>

    {/* Floating Graduation Caps */}
    <motion.div
      className="absolute top-1/3 right-10"
      variants={floatingVariants(1.5)}
      initial="hidden"
      animate="visible"
    >
      <GraduationCap
        className="w-14 h-14 text-purple-300/15"
        strokeWidth={1.5}
      />
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
        ease: "easeInOut",
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
        ease: "easeInOut",
        delay: 1,
      }}
    />
  </div>
);

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
    if (isAuthenticated) {
      onLoginSuccess();
    }
  }, [isAuthenticated, onLoginSuccess]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");

    if (type === "admin" || type === "teacher" || type === "parent") {
      setLoginType(type);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter username and password");
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(email, password);

      if (success) {
        console.log("Login successful");
        // Force state update and callback
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

  return (
    <div className="min-h-screen bg-gradient-school dark:bg-gradient-school-dark flex items-center justify-center p-4 relative overflow-hidden">
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
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-school-yellow to-school-orange rounded-full mb-4 shadow-lg shadow-school-yellow/50 animate-bounce-slow"
            variants={graduationCapVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <GraduationCap
              className="w-8 h-8 text-school-red"
              strokeWidth={2}
            />
          </motion.div>
          <motion.h1
            className="w-full max-w-4xl mx-auto whitespace-nowrap text-[1.05rem] sm:text-[1.35rem] md:text-[1.8rem] lg:text-[2.3rem] font-black uppercase tracking-[0.12em] text-center mb-3"
            animate={{
              scale: [1, 1.03, 1],
              textShadow: [
                "0 0 12px rgba(255,107,107,0.35), 0 0 24px rgba(255,230,109,0.2)",
                "0 0 20px rgba(255,107,107,0.75), 0 0 40px rgba(255,230,109,0.45)",
                "0 0 12px rgba(255,107,107,0.35), 0 0 24px rgba(255,230,109,0.2)",
              ],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              color: "#FFE66D",
              WebkitTextStroke: "1px rgba(255, 107, 107, 0.65)",
              letterSpacing: "0.12em",
            }}
          >
            FOLUSHO VICTORY SCHOOLS
          </motion.h1>
          <p className="text-school-yellow dark:text-school-yellow font-black tracking-[0.25em] uppercase">
            Result Management System
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          className="w-full max-w-md bg-gradient-to-br from-white to-school-blue/10 dark:from-slate-800/95 dark:to-slate-900/95 dark:backdrop-blur-md rounded-3xl shadow-2xl p-8 border-4 border-dashed border-school-blue dark:border-school-yellow"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {!loginType ? (
            <>
              <h2 className="text-2xl font-black text-school-red dark:text-school-yellow mb-6 text-center uppercase tracking-wider">
                Select Login Type
              </h2>
              <p className="text-school-blue dark:text-school-yellow text-center mb-6 font-black">
                Choose your role to continue
              </p>

              <div className="space-y-4">
                <motion.button
                  onClick={() => setLoginType("admin")}
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-school-red/20 to-school-pink/20 dark:from-school-red/30 dark:to-school-pink/30 hover:from-school-red/30 hover:to-school-pink/30 dark:hover:from-school-red/40 dark:hover:to-school-pink/40 border-2 border-dashed border-school-red dark:border-school-red rounded-2xl transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-school-red to-school-pink rounded-full flex items-center justify-center shadow-lg shadow-school-red/30 animate-bounce-slow">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-school-red dark:text-school-yellow">
                      Admin Login
                    </p>
                    <p className="text-sm text-school-blue dark:text-school-yellow font-bold">
                      Manage students, teachers and results
                    </p>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setLoginType("teacher")}
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-school-yellow/20 to-school-orange/20 dark:from-school-blue/30 dark:to-school-green/30 hover:from-school-yellow/30 hover:to-school-orange/30 dark:hover:from-school-blue/40 dark:hover:to-school-green/40 border-2 border-dashed border-school-yellow dark:border-school-green rounded-2xl transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-school-yellow to-school-orange rounded-full flex items-center justify-center shadow-lg shadow-school-yellow/30 animate-bounce-slow">
                    <GraduationCap className="w-6 h-6 text-school-red" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-school-orange dark:text-school-yellow">
                      Teacher Login
                    </p>
                    <p className="text-sm text-school-blue dark:text-school-yellow font-bold">
                      Enter and manage subject results
                    </p>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setLoginType("parent")}
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-school-green/20 to-school-blue/20 dark:from-school-purple/30 dark:to-school-pink/30 hover:from-school-green/30 hover:to-school-blue/30 dark:hover:from-school-purple/40 dark:hover:to-school-pink/40 border-2 border-dashed border-school-green dark:border-school-pink rounded-2xl transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-school-green to-school-blue rounded-full flex items-center justify-center shadow-lg shadow-school-green/30 animate-bounce-slow">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-school-green dark:text-school-yellow">
                      Parent Login
                    </p>
                    <p className="text-sm text-school-blue dark:text-school-yellow font-bold">
                      View your child's progress
                    </p>
                  </div>
                </motion.button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="text-school-red dark:text-school-yellow hover:text-school-pink dark:hover:text-school-orange text-sm mb-4 font-black"
              >
                ← Back to login type selection
              </button>

              <h2 className="text-2xl font-black text-school-red dark:text-school-yellow mb-2 text-center uppercase tracking-widest">
                {loginType === "admin" && "Admin Login"}
                {loginType === "teacher" && "Teacher Login"}
                {loginType === "parent" && "Parent Login"}
              </h2>

              <p className="text-school-blue dark:text-school-yellow text-center mb-6 font-black">
                {loginType === "admin" && "Enter your admin credentials"}
                {loginType === "teacher" &&
                  "Enter your teacher username and password"}
                {loginType === "parent" &&
                  "Enter your parent username (from student registration)"}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-600/20 border-2 border-rose-200 dark:border-rose-600/40 rounded-lg">
                  <p className="text-rose-700 dark:text-rose-300 text-sm font-semibold">
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                    {loginType === "parent"
                      ? "Parent Username"
                      : "Username / Email"}
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder={
                      loginType === "parent"
                        ? "Enter parent username"
                        : "Enter your username"
                    }
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                    {loginType === "parent" ? "Parent Password" : "Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-12"
                      placeholder={
                        loginType === "parent"
                          ? "Enter parent password"
                          : "Enter your password"
                      }
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-school-blue dark:text-school-yellow hover:text-school-red dark:hover:text-school-orange transition-colors disabled:opacity-50"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
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
  );
}
