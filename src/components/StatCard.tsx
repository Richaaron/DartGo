import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "blue" | "green" | "purple" | "orange" | "red";
  trend?: "up" | "down";
}

const colorConfig = {
  blue: {
    bar: "bg-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    valueColor: "text-brand-900 dark:text-white",
    trendUp:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    trendDown: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  },
  green: {
    bar: "bg-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    valueColor: "text-brand-900 dark:text-white",
    trendUp:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    trendDown: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  },
  purple: {
    bar: "bg-violet-500",
    iconBg: "bg-violet-50 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
    valueColor: "text-brand-900 dark:text-white",
    trendUp:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    trendDown: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  },
  orange: {
    bar: "bg-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    valueColor: "text-brand-900 dark:text-white",
    trendUp:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    trendDown: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  },
  red: {
    bar: "bg-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    valueColor: "text-brand-900 dark:text-white",
    trendUp:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    trendDown: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  },
};

export default function StatCard({
  icon,
  label,
  value,
  color,
  trend,
}: StatCardProps) {
  const cfg = colorConfig[color];

  return (
    <div className="bg-white dark:bg-brand-800 rounded-xl border border-brand-200 dark:border-brand-700 shadow-card overflow-hidden flex transition-shadow duration-200 hover:shadow-card-lg">
      {/* Left accent bar */}
      <div className={`w-1 flex-shrink-0 ${cfg.bar}`} />

      {/* Content */}
      <div className="flex-1 px-5 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-brand-500 dark:text-brand-400 uppercase tracking-wider mb-1 truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <p
              className={`text-2xl font-bold tracking-tight ${cfg.valueColor}`}
            >
              {value}
            </p>
            {trend && (
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                  trend === "up" ? cfg.trendUp : cfg.trendDown
                }`}
              >
                {trend === "up" ? "↑" : "↓"}
              </span>
            )}
          </div>
        </div>

        {/* Icon box */}
        <div className={`p-3 rounded-xl flex-shrink-0 ${cfg.iconBg}`}>
          <span className={`block ${cfg.iconColor}`}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
