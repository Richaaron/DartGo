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
    <div className="min-h-screen bg-[#050510] text-white overflow-hidden relative selection:bg-royal-gold-500/30">
      {/* ── Background Elements ───────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Main Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-royal-purple-900/10 rounded-full blur-[120px]" />
        
        {/* Accent Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-royal-gold-950/10 rounded-full blur-[100px]" 
        />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <AnimatePresence mode="wait">
        {!loginType ? (
          /* ── Portal Selection Dashboard ────────────────── */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 min-h-screen flex items-center justify-center p-6 md:p-12 lg:p-24"
          >
            <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Left Column: Hero Content */}
              <div className="space-y-10">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="space-y-6"
                >
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-royal-purple-900/30 border border-royal-purple-500/30 text-royal-gold-400 text-xs font-black tracking-[0.2em] uppercase">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center p-1 shadow-lg ring-1 ring-royal-purple-500/30">
                      <img src="/school_logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    FOLUSHO VICTORY SCHOOLS
                  </div>

                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white">
                    Excellence <br />
                    Defined by <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-royal-purple-400 via-royal-purple-500 to-royal-gold-500">
                      Legacy.
                    </span>
                  </h1>

                  <p className="text-royal-purple-200/60 text-lg md:text-xl max-w-lg font-medium leading-relaxed">
                    Welcome to the Folusho Victory Schools digital citadel. A sanctuary of academic precision, teacher empowerment, and parental partnership.
                  </p>
                </motion.div>

                {/* Portal Buttons */}
                <div className="flex flex-wrap items-center gap-6">
                  {loginTypes.map((type, i) => (
                    type.id !== 'parent' ? (
                      <motion.button
                        key={type.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLoginType(type.id)}
                        className={`group relative overflow-hidden px-8 py-5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-2xl ${
                          type.id === 'admin' 
                            ? 'bg-gradient-to-br from-royal-purple-600 to-royal-purple-800 text-white shadow-royal-purple-500/20' 
                            : 'bg-gradient-to-br from-royal-gold-400 to-royal-gold-600 text-royal-black-900 shadow-royal-gold-500/20'
                        }`}
                      >
                        <div className="relative z-10 flex items-center gap-3">
                          {type.label}
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                        {/* Internal Glow Effect */}
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    ) : (
                      <motion.button
                        key={type.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        onClick={() => setLoginType(type.id)}
                        className="px-6 py-4 flex items-center gap-3 text-royal-gold-400 hover:text-white font-black text-sm tracking-widest uppercase transition-colors"
                      >
                        {type.label}
                        <ArrowRight size={18} />
                      </motion.button>
                    )
                  ))}
                </div>
              </div>

              {/* Right Column: Academic Pillar Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="hidden lg:block relative"
              >
                {/* Floating Elements around the card */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-10 -right-10 w-24 h-24 bg-royal-gold-500/10 rounded-2xl blur-xl"
                />
                
                {/* The Pillar Card */}
                <div className="relative z-10 p-12 rounded-[40px] bg-gradient-to-br from-royal-purple-900/40 to-royal-black-950/80 border border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-6 mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-royal-black-950/50 border border-white/5 flex items-center justify-center text-royal-purple-400">
                      <Layers size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                      Academic Pillar
                    </h2>
                  </div>

                  <div className="space-y-10">
                    {loginTypes.map((item) => (
                      <div key={item.id} className="flex gap-6 group">
                        <div className="mt-2.5">
                          <div className={`w-3 h-3 rounded-full ${
                            item.id === 'admin' ? 'bg-royal-gold-500 shadow-[0_0_10px_#f59e0b]' : 
                            item.id === 'teacher' ? 'bg-royal-purple-500 shadow-[0_0_10px_#8b5cf6]' : 
                            'bg-royal-black-400 shadow-[0_0_10px_#475569]'
                          }`} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-black text-white tracking-widest uppercase group-hover:text-royal-gold-400 transition-colors">
                            {item.label === 'PARENTAL ACCESS' ? 'PARENTAL ENGAGEMENT' : item.label === 'TEACHER PORTAL' ? 'SCHOLARLY ASSESSMENT' : 'ROYAL GOVERNANCE'}
                          </h3>
                          <p className="text-royal-purple-200/40 text-sm font-medium leading-relaxed max-w-xs">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Accents */}
                  <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between opacity-40">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <div className="w-12 h-2 rounded-full bg-royal-purple-500/50" />
                    </div>
                    <p className="text-[10px] font-black tracking-widest uppercase">Est. 2005</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* ── Actual Login Form ─────────────────────────── */
          <motion.div
            key="login-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-10 min-h-screen flex items-center justify-center p-6"
          >
            <div className="w-full max-w-md space-y-8">
              {/* Back Button */}
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-royal-purple-300 hover:text-white transition-colors group mb-4"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                  <ArrowRight size={20} className="rotate-180" />
                </div>
                <span className="text-xs font-black tracking-widest uppercase">Go Back</span>
              </button>

              <div className="p-10 rounded-[32px] bg-gradient-to-br from-royal-black-900/90 to-royal-black-950 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/50">
                <div className="text-center mb-10">
                  <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-2xl ${
                    loginType === 'admin' ? 'bg-royal-purple-600/20 text-royal-purple-400 border border-royal-purple-500/30' :
                    loginType === 'teacher' ? 'bg-royal-gold-600/20 text-royal-gold-400 border border-royal-gold-500/30' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {loginType === 'admin' ? <Shield size={40} /> : 
                     loginType === 'teacher' ? <BookOpen size={40} /> : 
                     <Users size={40} />}
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                    {loginType} <br />
                    <span className="text-royal-gold-400">Portal</span>
                  </h2>
                  <p className="text-royal-purple-200/50 text-sm font-medium mt-2">
                    Verify your credentials to enter the citadel.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-royal-purple-300 px-1">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-purple-500" size={18} />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-royal-black-950 border-2 border-white/5 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-royal-purple-500/50 transition-all font-bold"
                        placeholder="your.name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-royal-purple-300 px-1">
                      Access Code
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-purple-500" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-royal-black-950 border-2 border-white/5 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-royal-purple-500/50 transition-all font-bold"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-royal-purple-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-bold flex items-center gap-3"
                    >
                      <Zap size={14} />
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-5 rounded-2xl font-black text-sm tracking-widest uppercase shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
                      loginType === 'admin' ? 'bg-royal-purple-600 hover:bg-royal-purple-700 shadow-royal-purple-500/20' :
                      loginType === 'teacher' ? 'bg-royal-gold-500 text-royal-black-900 hover:bg-royal-gold-600 shadow-royal-gold-500/20' :
                      'bg-white text-royal-black-900 hover:bg-slate-100 shadow-white/20'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Authenticating...
                      </div>
                    ) : (
                      "Secure Entry"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Copyright */}
      <div className="absolute bottom-10 left-10 z-20 opacity-20 hidden md:block">
        <p className="text-[10px] font-black tracking-[0.5em] uppercase text-white">
          Folusho Victory Schools <br /> 
          <span className="text-royal-gold-400">Digital Fortress © 2025</span>
        </p>
      </div>
    </div>
  );
}
