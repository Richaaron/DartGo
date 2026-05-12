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
    <div className="min-h-screen bg-folusho-cream-100 text-folusho-slate-900 overflow-hidden relative selection:bg-folusho-sage-500/20">
      {/* ── Immersive Background ──────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Organic Sage Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] bg-folusho-sage-200/40 rounded-full blur-[180px] animate-folusho-blob" />
        
        {/* Dynamic Blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 60, 0],
            x: [0, 80, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] right-[10%] w-[700px] h-[700px] bg-folusho-yellow-100/30 rounded-full blur-[140px]" 
        />
        
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -60, 0],
            y: [0, 80, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-[15%] left-[5%] w-[600px] h-[600px] bg-folusho-coral-100/30 rounded-full blur-[120px]" 
        />
        
        {/* Premium Noise Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-[0.6] mix-blend-multiply" />
        
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-folusho-cream-200/40" />
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
                  <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full bg-folusho-cream-50 border border-folusho-cream-200 text-folusho-sage-600 text-[10px] font-black tracking-[0.4em] uppercase shadow-sm">
                    <div className="w-10 h-10 bg-folusho-sage-50 rounded-2xl flex items-center justify-center p-2 shadow-sm border border-folusho-sage-100">
                      <img src="/school_logo.png?v=20260512" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    FOLUSHO ACADEMIC PORTAL
                  </div>

                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-folusho-slate-900">
                    Nurturing <br />
                    Intelligence <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">
                      Harmoniously.
                    </span>
                  </h1>

                  <p className="text-folusho-slate-400 text-lg md:text-xl max-w-xl font-bold leading-relaxed tracking-tight">
                    Welcome to the Folusho Ecosystem. A refined, organic space for academic governance, transparent growth, and educational excellence.
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
                        className={`group relative overflow-hidden px-12 py-7 rounded-[2.5rem] font-black text-xs tracking-[0.25em] uppercase transition-all shadow-folusho ${
                          type.id === 'admin' 
                            ? 'bg-folusho-sage-400 text-white' 
                            : 'bg-folusho-yellow-300 text-folusho-slate-900'
                        }`}
                      >
                        <div className="relative z-10 flex items-center gap-5">
                          {type.label}
                          <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
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
                        className="px-8 py-5 flex items-center gap-4 text-folusho-coral-500 hover:text-folusho-coral-600 font-black text-xs tracking-[0.25em] uppercase transition-all"
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
                initial={{ opacity: 0, scale: 0.9, x: 80 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="hidden lg:block relative"
              >
                <div className="relative z-10 p-20 rounded-[4rem] bg-folusho-cream-50 border border-folusho-cream-200 shadow-folusho-lg overflow-hidden group">
                  {/* Internal Shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-folusho-cream-50/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1200" />
                  
                  <div className="flex items-center gap-8 mb-16">
                    <div className="w-24 h-24 rounded-[2rem] bg-folusho-sage-50 border border-folusho-sage-100 flex items-center justify-center text-folusho-sage-500 shadow-inner">
                      <Layers size={44} />
                    </div>
                    <h2 className="text-3xl font-black text-folusho-slate-900 tracking-tighter uppercase leading-none">
                      Core <br /> <span className="text-folusho-sage-600">Infrastructure</span>
                    </h2>
                  </div>

                  <div className="space-y-14">
                    {[
                      { label: "Elite Governance", desc: "Sleek intelligence for institutional precision.", color: "bg-folusho-sage-400" },
                      { label: "Growth Metrics", desc: "Holistic frameworks for character and academic growth.", color: "bg-folusho-yellow-400" },
                      { label: "Strategic Alliance", desc: "Transparent engagement for parental stakeholders.", color: "bg-folusho-coral-400" }
                    ].map((item, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex gap-8 group"
                      >
                        <div className="mt-3">
                          <div className={`w-3 h-3 rounded-full ${item.color} shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-150 transition-transform`} />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-lg font-black text-folusho-slate-900 tracking-widest uppercase group-hover:text-folusho-sage-600 transition-colors">
                            {item.label}
                          </h3>
                          <p className="text-folusho-slate-400 text-base font-bold leading-relaxed max-w-sm">
                            {item.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Operational Status */}
                  <div className="mt-20 pt-12 border-t border-folusho-cream-200 flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="w-3.5 h-3.5 rounded-full bg-folusho-sage-400 animate-pulse" />
                      <span className="text-[10px] font-black tracking-widest uppercase text-folusho-sage-600">System Online</span>
                    </div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-folusho-slate-400">v1.1.0 PREMIUM</p>
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
                className="flex items-center gap-5 text-folusho-slate-400 hover:text-folusho-slate-900 transition-all group"
              >
                <div className="w-14 h-14 rounded-3xl bg-white flex items-center justify-center group-hover:bg-folusho-sage-50 transition-all border border-folusho-cream-200 shadow-sm">
                  <ArrowRight size={26} className="rotate-180" />
                </div>
                <span className="text-xs font-black tracking-[0.35em] uppercase">Return to Orbit</span>
              </button>

              <div className="p-16 rounded-[4rem] bg-folusho-cream-50 border border-folusho-cream-200 shadow-folusho-lg">
                <div className="text-center mb-14">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-28 h-28 mx-auto rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner ${
                      loginType === 'admin' ? 'bg-folusho-sage-50 text-folusho-sage-500 border border-folusho-sage-100' :
                      loginType === 'teacher' ? 'bg-folusho-yellow-50 text-folusho-yellow-600 border border-folusho-yellow-200' :
                      'bg-folusho-coral-50 text-folusho-coral-500 border border-folusho-coral-100'
                    }`}
                  >
                    {loginType === 'admin' ? <Shield size={56} /> : 
                     loginType === 'teacher' ? <BookOpen size={56} /> : 
                     <Users size={56} />}
                  </motion.div>
                  <h2 className="text-3xl font-black text-folusho-slate-900 tracking-tighter uppercase leading-none">
                    {loginType} <br />
                    <span className={
                      loginType === 'admin' ? 'text-folusho-sage-500' :
                      loginType === 'teacher' ? 'text-folusho-yellow-600' :
                      'text-folusho-coral-500'
                    }>Portal Access</span>
                  </h2>
                  <p className="text-folusho-slate-400 text-base font-bold mt-5">
                    Verify your credentials to access the academic citadel.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-folusho-sage-500/80 px-2">
                      Username
                    </label>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 text-folusho-sage-400 group-focus-within:text-folusho-sage-600 transition-colors" size={20} />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-folusho !pl-16"
                        placeholder="identity.code"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-folusho-sage-500/80 px-2">
                      Access Code
                    </label>
                    <div className="relative group">
                      <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-folusho-sage-400 group-focus-within:text-folusho-sage-600 transition-colors" size={20} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-folusho !pl-16 !pr-16"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-folusho-sage-400 hover:text-folusho-sage-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-folusho-coral-100 border border-folusho-coral-200 text-folusho-coral-600 p-6 rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-5 shadow-sm"
                    >
                      <Zap size={18} className="animate-pulse" />
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`btn-vibrant w-full py-7 rounded-[2rem] text-[10px] tracking-[0.4em] ${
                      loginType === 'admin' ? 'bg-folusho-sage-400 text-white' :
                      loginType === 'teacher' ? 'bg-folusho-yellow-300 text-folusho-slate-900' :
                      'bg-folusho-coral-400 text-white'
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
      <div className="absolute bottom-12 right-12 z-20 opacity-40 hidden xl:block">
        <p className="text-[10px] font-black tracking-[0.7em] uppercase text-folusho-slate-900 text-right leading-relaxed">
          Folusho Academic <br /> 
          <span className="text-folusho-sage-500 font-black">Educational Governance © 2026</span>
        </p>
      </div>
    </div>
  );
}
