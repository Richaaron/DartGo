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
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
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
  gradient: string;
}[] = [
  {
    id: "admin",
    label: "ADMIN PORTAL",
    desc: "Centralized control of academic records and institutional intelligence.",
    icon: <Shield className="w-5 h-5" />,
    color: "text-white",
    iconBg: "bg-royal-purple-500",
    gradient: "from-royal-purple-600 to-royal-purple-800",
  },
  {
    id: "teacher",
    label: "TEACHER PORTAL",
    desc: "Sophisticated evaluation frameworks for numeric and character development.",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-royal-black-900",
    iconBg: "bg-royal-gold-500",
    gradient: "from-royal-gold-400 to-royal-gold-600",
  },
  {
    id: "parent",
    label: "PARENTAL ACCESS",
    desc: "Real-time academic updates and detailed student performance report cards.",
    icon: <Users className="w-5 h-5" />,
    color: "text-royal-gold-400",
    iconBg: "bg-transparent",
    gradient: "from-transparent to-transparent",
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

  return (
    <div className="min-h-screen bg-nebula-slate-950 text-white overflow-hidden relative selection:bg-nebula-indigo-500/30">
      {/* ── Immersive Background ──────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Deep Core Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-nebula-indigo-900/10 rounded-full blur-[160px] animate-nebula-pulse" />
        
        {/* Dynamic Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] right-[5%] w-[600px] h-[600px] bg-nebula-teal-900/20 rounded-full blur-[120px]" 
        />
        
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -80, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-nebula-pink-900/15 rounded-full blur-[100px]" 
        />
        
        {/* Premium Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] mix-blend-screen" />
      </div>

      <AnimatePresence mode="wait">
        {!loginType ? (
          /* ── Immersive Portal Dashboard ────────────────── */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="relative z-10 min-h-screen flex items-center justify-center p-8 md:p-16 lg:p-32"
          >
            <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-24 items-center">
              
              {/* Left Column: Hero Intelligence */}
              <div className="space-y-12">
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="space-y-8"
                >
                  <div className="inline-flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-nebula-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-md">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-2xl ring-1 ring-white/20">
                      <img src="/school_logo.png?v=20260512" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    FOLUSHO VICTORY SCHOOLS
                  </div>

                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] text-white">
                    Future <br />
                    Intelligence <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-nebula-indigo-400 via-nebula-teal-400 to-nebula-pink-400">
                      Unleashed.
                    </span>
                  </h1>

                  <p className="text-nebula-slate-400 text-base md:text-lg max-w-xl font-bold leading-relaxed tracking-tight">
                    Enter the Nebula ecosystem. A high-performance environment for academic governance, precise evaluation, and strategic partnership.
                  </p>
                </motion.div>

                {/* Cyber Portal Selection */}
                <div className="flex flex-wrap items-center gap-8">
                  {loginTypes.map((type, i) => (
                    type.id !== 'parent' ? (
                      <motion.button
                        key={type.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        whileHover={{ y: -8, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setLoginType(type.id)}
                        className={`group relative overflow-hidden px-10 py-6 rounded-3xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-nebula-lg ${
                          type.id === 'admin' 
                            ? 'bg-gradient-to-br from-nebula-indigo-600 to-nebula-indigo-900 text-white' 
                            : 'bg-gradient-to-br from-nebula-teal-500 to-nebula-teal-800 text-nebula-slate-950'
                        }`}
                      >
                        <div className="relative z-10 flex items-center gap-4">
                          {type.label}
                          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    ) : (
                      <motion.button
                        key={type.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ x: 10 }}
                        onClick={() => setLoginType(type.id)}
                        className="px-8 py-5 flex items-center gap-4 text-nebula-teal-400 hover:text-white font-black text-xs tracking-[0.2em] uppercase transition-all"
                      >
                        {type.label}
                        <ArrowRight size={20} />
                      </motion.button>
                    )
                  ))}
                </div>
              </div>

              {/* Right Column: Dynamic Matrix Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 80 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="hidden lg:block relative"
              >
                <div className="relative z-10 p-16 rounded-5xl bg-nebula-slate-900/40 border border-white/5 backdrop-blur-3xl shadow-nebula-lg overflow-hidden group">
                  {/* Internal Shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <div className="flex items-center gap-8 mb-16">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-nebula-indigo-400 shadow-inner">
                      <Layers size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                      Core <br /> <span className="text-nebula-indigo-500">Infrastructure</span>
                    </h2>
                  </div>

                  <div className="space-y-12">
                    {[
                      { label: "Elite Governance", desc: "Centralized intelligence for institutional precision.", color: "bg-nebula-indigo-500" },
                      { label: "Precision Metrics", desc: "Advanced frameworks for character and academic growth.", color: "bg-nebula-teal-500" },
                      { label: "Strategic Alliance", desc: "Transparent engagement for parental stakeholders.", color: "bg-nebula-pink-500" }
                    ].map((item, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex gap-8 group/item"
                      >
                        <div className="mt-3">
                          <div className={`w-3 h-3 rounded-full ${item.color} shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover/item:scale-150 transition-transform`} />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-base font-black text-white tracking-widest uppercase group-hover/item:text-nebula-indigo-400 transition-colors">
                            {item.label}
                          </h3>
                          <p className="text-nebula-slate-500 text-sm font-bold leading-relaxed max-w-sm">
                            {item.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Operational Status */}
                  <div className="mt-20 pt-10 border-t border-white/5 flex items-center justify-between">
                    <div className="flex gap-3">
                      <div className="w-3 h-3 rounded-full bg-nebula-teal-500 animate-pulse" />
                      <span className="text-[10px] font-black tracking-widest uppercase text-nebula-teal-500">System Online</span>
                    </div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-nebula-slate-600">v1.0.1 PREMIUM</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* ── Secure Access Interface ───────────────────── */
          <motion.div
            key="login-form"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 min-h-screen flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg space-y-10">
              {/* Back Navigation */}
              <button 
                onClick={handleBack}
                className="flex items-center gap-4 text-nebula-slate-400 hover:text-white transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-nebula-indigo-500/20 transition-all border border-white/5">
                  <ArrowRight size={24} className="rotate-180" />
                </div>
                <span className="text-xs font-black tracking-[0.3em] uppercase">Return to Orbit</span>
              </button>

              <div className="p-12 rounded-5xl bg-nebula-slate-900/60 border border-white/5 backdrop-blur-3xl shadow-nebula-lg">
                <div className="text-center mb-12">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-24 h-24 mx-auto rounded-4xl flex items-center justify-center mb-8 shadow-inner ${
                      loginType === 'admin' ? 'bg-nebula-indigo-500/10 text-nebula-indigo-400 border border-nebula-indigo-500/30' :
                      loginType === 'teacher' ? 'bg-nebula-teal-500/10 text-nebula-teal-400 border border-nebula-teal-500/30' :
                      'bg-nebula-pink-500/10 text-nebula-pink-400 border border-nebula-pink-500/30'
                    }`}
                  >
                    {loginType === 'admin' ? <Shield size={48} /> : 
                     loginType === 'teacher' ? <BookOpen size={48} /> : 
                     <Users size={48} />}
                  </motion.div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                    {loginType} <br />
                    <span className={
                      loginType === 'admin' ? 'text-nebula-indigo-500' :
                      loginType === 'teacher' ? 'text-nebula-teal-500' :
                      'text-nebula-pink-500'
                    }>Portal Access</span>
                  </h2>
                  <p className="text-nebula-slate-500 text-sm font-bold mt-4">
                    Decrypt your identity to access the digital citadel.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-nebula-indigo-400/60 px-2">
                      Username
                    </label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-nebula-indigo-500 group-focus-within:text-white transition-colors" size={20} />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-nebula pl-14"
                        placeholder="identity.code"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-nebula-indigo-400/60 px-2">
                      Access Code
                    </label>
                    <div className="relative group">
                      <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-nebula-indigo-500 group-focus-within:text-white transition-colors" size={20} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-nebula pl-14 pr-14"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-nebula-indigo-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-nebula-pink-500/10 border border-nebula-pink-500/30 text-nebula-pink-400 p-5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-4 shadow-lg"
                    >
                      <Zap size={18} className="animate-pulse" />
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`btn-vibrant w-full py-6 rounded-3xl text-xs tracking-[0.3em] ${
                      loginType === 'admin' ? 'from-nebula-indigo-600 to-nebula-indigo-800' :
                      loginType === 'teacher' ? 'from-nebula-teal-500 to-nebula-teal-700 !text-nebula-slate-950' :
                      'from-nebula-pink-600 to-nebula-pink-800'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Authenticating...
                      </div>
                    ) : (
                      "Establish Connection"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corporate Footprint */}
      <div className="absolute bottom-12 right-12 z-20 opacity-30 hidden xl:block">
        <p className="text-[10px] font-black tracking-[0.6em] uppercase text-white text-right leading-relaxed">
          Folusho Victory Schools <br /> 
          <span className="text-nebula-indigo-400">Digital Governance © 2026</span>
        </p>
      </div>
    </div>
  );
}
