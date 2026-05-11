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
  return (
    <div className="royal-card group overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-royal-purple-400 uppercase tracking-[0.2em] mb-2">
            {label}
          </p>
          <p className="text-4xl font-black text-white tracking-tighter">
            {value}
          </p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {trend === 'up' ? '↑ TRENDING UP' : '↓ TRENDING DOWN'}
              </span>
            </div>
          )}
        </div>
        <div className="p-4 bg-royal-purple-500/10 rounded-2xl group-hover:bg-royal-purple-500 group-hover:text-white transition-all duration-500">
          <span className="text-royal-purple-400 group-hover:text-white transition-colors">
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}
