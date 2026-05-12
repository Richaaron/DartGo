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
    blue: "bg-folusho-sage-50 text-folusho-sage-600 border-folusho-sage-200",
    green: "bg-folusho-sage-100 text-folusho-sage-700 border-folusho-sage-300",
    purple: "bg-folusho-coral-50 text-folusho-coral-600 border-folusho-coral-200",
    orange: "bg-folusho-yellow-100 text-folusho-yellow-700 border-folusho-yellow-300",
    red: "bg-folusho-coral-100 text-folusho-coral-700 border-folusho-coral-300",
  };

  return (
    <div className="folusho-card group !p-8">
      <div className="flex items-center justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <p className="text-[11px] font-black text-folusho-slate-400 uppercase tracking-[0.25em]">
            {label}
          </p>
          <p className="text-4xl font-black text-folusho-slate-900 tracking-tighter">
            {value}
          </p>
          {trend && (
            <div className="pt-2">
              <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                trend === 'up' 
                  ? 'bg-folusho-sage-100 text-folusho-sage-600 border border-folusho-sage-200' 
                  : 'bg-folusho-coral-100 text-folusho-coral-600 border border-folusho-coral-200'
              }`}>
                {trend === 'up' ? '↑ Performance Growth' : '↓ Attention Required'}
              </span>
            </div>
          )}
        </div>
        <div className={`p-5 rounded-[2rem] transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${colorMap[color] || colorMap.blue} border-2`}>
          <span className="transition-transform duration-500 block">
            {icon}
          </span>
        </div>
      </div>
      
      {/* Decorative Blob */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-folusho-cream-200/20 rounded-full blur-2xl group-hover:bg-folusho-cream-200/40 transition-colors duration-500" />
    </div>
  );
}
