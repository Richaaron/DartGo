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
    label: "ADMIN",
    desc: "Manage school records and settings.",
    icon: <Shield className="w-5 h-5" />,
    color: "text-white",
    iconBg: "bg-indigo-600",
    gradient: "from-indigo-600 to-indigo-800",
  },
  {
    id: "teacher",
    label: "TEACHER",
    desc: "Record and manage student results.",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-slate-900",
    iconBg: "bg-amber-400",
    gradient: "from-amber-400 to-amber-600",
  },
  {
    id: "parent",
    label: "PARENT",
    desc: "View your child's academic performance.",
    icon: <Users className="w-5 h-5" />,
    color: "text-indigo-400",
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
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative selection:bg-indigo-500/20">
      {/* ── Immersive Background ──────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      </div>

      {!loginType ? (
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8 md:p-16 lg:p-32">
            <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-24 items-center">
              
              {/* Left Column: Hero Intelligence */}
              <div className="space-y-12">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/5 border border-white/5 text-indigo-400 text-[10px] font-black tracking-[0.4em] uppercase shadow-sm">
                    <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center p-2 shadow-sm border border-white/5">
                      <img src="/school_logo.png?v=20260512" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    FOLUSHO PORTAL
                  </div>

                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-white">
                    Excellence <br />
                    in <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600">
                      Education.
                    </span>
                  </h1>

                  <p className="text-slate-500 text-lg md:text-xl max-w-xl font-bold leading-relaxed tracking-tight">
                    Welcome to the Folusho Result Management System. A simple and efficient tool for academic administration.
                  </p>
                </div>

                {/* Cyber Portal Selection */}
                <div className="flex flex-wrap items-center gap-8">
                  {loginTypes.map((type) => (
                    type.id !== 'parent' ? (
                      <button
                        key={type.id}
                        onClick={() => setLoginType(type.id)}
                        className={`group relative overflow-hidden px-12 py-7 rounded-[2.5rem] font-black text-xs tracking-[0.25em] uppercase transition-all shadow-2xl ${
                          type.id === 'admin' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-amber-400 text-slate-900'
                        }`}
                      >
                        <div className="relative z-10 flex items-center gap-5">
                          {type.label}
                          <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                      </button>
                    ) : (
                      <button
                        key={type.id}
                        onClick={() => setLoginType(type.id)}
                        className="px-8 py-5 flex items-center gap-4 text-rose-500 hover:text-rose-600 font-black text-xs tracking-[0.25em] uppercase transition-all"
                      >
                        {type.label}
                        <ArrowRight size={20} />
                      </button>
                    )
                  ))}
                </div>
              </div>

              {/* Right Column: Dynamic Matrix Card */}
              <div className="hidden lg:block relative">
                <div className="relative z-10 p-20 rounded-[4rem] bg-slate-900 border border-white/5 shadow-2xl overflow-hidden group">
                  <div className="flex items-center gap-8 mb-16">
                    <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-white/5 flex items-center justify-center text-indigo-400 shadow-inner">
                      <Layers size={44} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                      Core <br /> <span className="text-indigo-400">Features</span>
                    </h2>
                  </div>

                  <div className="space-y-14">
                    {[
                      { label: "Administration", desc: "Efficient tools for school management.", color: "bg-indigo-400" },
                      { label: "Student Progress", desc: "Track academic and behavioral growth.", color: "bg-amber-400" },
                      { label: "Communication", desc: "Stay connected with all stakeholders.", color: "bg-rose-400" }
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        className="flex gap-8 group"
                      >
                        <div className="mt-3">
                          <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm group-hover:scale-150 transition-transform`} />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-lg font-black text-white tracking-widest uppercase group-hover:text-indigo-400 transition-colors">
                            {item.label}
                          </h3>
                          <p className="text-slate-500 text-base font-bold leading-relaxed max-w-sm">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-20 pt-12 border-t border-white/5 flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[10px] font-black tracking-widest uppercase text-indigo-400">System Ready</span>
                    </div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">v1.1.0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Secure Access Interface ───────────────────── */
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
            <div className="w-full max-w-lg space-y-10">
              <button 
                onClick={handleBack}
                className="flex items-center gap-5 text-slate-500 hover:text-white transition-all group"
              >
                <div className="w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-all border border-white/5 shadow-sm">
                  <ArrowRight size={26} className="rotate-180" />
                </div>
                <span className="text-xs font-black tracking-[0.35em] uppercase">Go Back</span>
              </button>

              <div className="p-16 rounded-[4rem] bg-slate-900 border border-white/5 shadow-2xl">
                <div className="text-center mb-14">
                  <div className={`w-28 h-28 mx-auto rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner ${
                    loginType === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-white/5' :
                    loginType === 'teacher' ? 'bg-amber-400/10 text-amber-500 border border-white/5' :
                    'bg-rose-500/10 text-rose-400 border border-white/5'
                  }`}>
                    {loginType === 'admin' ? <Shield size={56} /> : 
                     loginType === 'teacher' ? <BookOpen size={56} /> : 
                     <Users size={56} />}
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                    {loginType} <br />
                    <span className={
                      loginType === 'admin' ? 'text-indigo-400' :
                      loginType === 'teacher' ? 'text-amber-500' :
                      'text-rose-400'
                    }>Portal Access</span>
                  </h2>
                  <p className="text-slate-500 text-base font-bold mt-5">
                    Enter your credentials to login.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500/80 px-2">
                      Username
                    </label>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input !pl-16 !bg-slate-950/50"
                        placeholder="Username"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500/80 px-2">
                      Password
                    </label>
                    <div className="relative group">
                      <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input !pl-16 !pr-16 !bg-slate-950/50"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                      >
                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div
                      className="bg-rose-100 border border-rose-200 text-rose-600 p-6 rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-5 shadow-sm"
                    >
                      <Zap size={18} className="animate-pulse" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-7 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all ${
                      loginType === 'admin' ? 'bg-indigo-600 text-white' :
                      loginType === 'teacher' ? 'bg-amber-400 text-slate-900' :
                      'bg-rose-500 text-white'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Logging in...
                      </div>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      {/* Footer */}
      <div className="absolute bottom-12 right-12 z-20 opacity-40 hidden xl:block">
        <p className="text-[10px] font-black tracking-[0.7em] uppercase text-white text-right leading-relaxed">
          Folusho Portal <br /> 
          <span className="text-indigo-400 font-black">© 2026</span>
        </p>
      </div>
    </div>
  );
}
