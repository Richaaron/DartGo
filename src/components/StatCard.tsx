import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "blue" | "green" | "purple" | "orange" | "red";
  trend?: "up" | "down";
}


export default function StatCard({
  icon,
  label,
  value,
  color,
  trend,
}: StatCardProps) {
  const colorMap = {
    blue: "bg-folusho-sage-500/10 text-folusho-sage-400 border-folusho-sage-500/20",
    green: "bg-folusho-sage-500/10 text-folusho-sage-400 border-folusho-sage-500/20",
    purple: "bg-folusho-coral-500/10 text-folusho-coral-400 border-folusho-coral-500/20",
    orange: "bg-folusho-yellow-500/10 text-folusho-yellow-500 border-folusho-yellow-500/20",
    red: "bg-folusho-coral-500/10 text-folusho-coral-400 border-folusho-coral-500/20",
  };

  return (
    <div className="folusho-card group !p-8 !bg-folusho-slate-900/40 backdrop-blur-md border-white/5 shadow-2xl">
      <div className="flex items-center justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <p className="text-[11px] font-black text-folusho-slate-400 uppercase tracking-[0.25em]">
            {label}
          </p>
          <p className="text-4xl font-black text-white tracking-tighter">
            {value}
          </p>
          {trend && (
            <div className="pt-2">
              <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                trend === 'up' 
                  ? 'bg-folusho-sage-500/10 text-folusho-sage-400 border border-folusho-sage-500/20' 
                  : 'bg-folusho-coral-500/10 text-folusho-coral-400 border border-folusho-coral-500/20'
              }`}>
                {trend === 'up' ? '↑ Performance Growth' : '↓ Attention Required'}
              </span>
            </div>
          )}
        </div>
        <div className={`p-5 rounded-[2rem] transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${colorMap[color] || colorMap.blue} border`}>
          <span className="transition-transform duration-500 block">
            {icon}
          </span>
        </div>
      </div>
      
      {/* Decorative Blob */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-folusho-sage-500/5 rounded-full blur-2xl group-hover:bg-folusho-sage-500/10 transition-colors duration-500" />
    </div>
  );
}
