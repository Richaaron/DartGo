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
    blue: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
    orange: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    red: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <div className="pt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                trend === 'up' 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
              }`}>
                {trend === 'up' ? '↑ Increasing' : '↓ Decreasing'}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
