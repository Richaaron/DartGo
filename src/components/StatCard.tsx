import React from 'react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  trend?: 'up' | 'down'
}

export default function StatCard({ icon, label, value, color, trend }: StatCardProps) {
  const colorMap = {
    blue: {
      bg: 'bg-gradient-to-br from-purple-50 dark:from-purple-900/25 to-purple-100/50 dark:to-purple-800/10 border-l-4 border-purple-500',
      icon: 'bg-purple-100 dark:bg-purple-600/30 text-purple-600 dark:text-purple-300',
      label: 'text-purple-600 dark:text-purple-400',
      value: 'text-purple-900 dark:text-purple-100'
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-50 dark:from-emerald-900/25 to-emerald-100/50 dark:to-emerald-800/10 border-l-4 border-emerald-500',
      icon: 'bg-emerald-100 dark:bg-emerald-600/30 text-emerald-600 dark:text-emerald-300',
      label: 'text-emerald-600 dark:text-emerald-400',
      value: 'text-emerald-900 dark:text-emerald-100'
    },
    purple: {
      bg: 'bg-gradient-to-br from-gold-50 dark:from-gold-900/25 to-gold-100/50 dark:to-gold-800/10 border-l-4 border-gold-500',
      icon: 'bg-gold-100 dark:bg-gold-600/30 text-gold-600 dark:text-gold-300',
      label: 'text-gold-600 dark:text-gold-400',
      value: 'text-gold-900 dark:text-gold-100'
    },
    orange: {
      bg: 'bg-gradient-to-br from-amber-50 dark:from-amber-900/25 to-amber-100/50 dark:to-amber-800/10 border-l-4 border-amber-500',
      icon: 'bg-amber-100 dark:bg-amber-600/30 text-amber-600 dark:text-amber-300',
      label: 'text-amber-600 dark:text-amber-400',
      value: 'text-amber-900 dark:text-amber-100'
    },
    red: {
      bg: 'bg-gradient-to-br from-rose-50 dark:from-rose-900/25 to-rose-100/50 dark:to-rose-800/10 border-l-4 border-rose-500',
      icon: 'bg-rose-100 dark:bg-rose-600/30 text-rose-600 dark:text-rose-300',
      label: 'text-rose-600 dark:text-rose-400',
      value: 'text-rose-900 dark:text-rose-100'
    },
  }

  const colors = colorMap[color]

  return (
    <div className={`card-lg group overflow-hidden relative ${colors.bg} hover:shadow-2xl transition-all duration-300`}>
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-current opacity-[0.02] dark:opacity-[0.05] rounded-full blur-3xl group-hover:opacity-[0.08] dark:group-hover:opacity-[0.15] transition-all duration-700"></div>
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-gradient-to-tr from-purple-400 to-gold-300 opacity-[0.02] dark:opacity-[0.04] rounded-full blur-3xl group-hover:opacity-[0.06] dark:group-hover:opacity-[0.12] transition-all duration-700"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${colors.label}`}>{label}</p>
          <div className="flex items-baseline gap-3">
            <p className={`text-4xl font-black tracking-tighter ${colors.value}`}>{value}</p>
            {trend && (
              <span className={`inline-flex items-center justify-center text-sm font-black px-2.5 py-1 rounded-lg transition-all ${
                trend === 'up' 
                  ? 'bg-emerald-100 dark:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300' 
                  : 'bg-rose-100 dark:bg-rose-600/30 text-rose-700 dark:text-rose-300'
              }`}>
                {trend === 'up' ? '↗' : '↘'}
              </span>
            )}
          </div>
        </div>
        <div className={`p-4 rounded-2xl transition-all duration-300 group-hover:scale-125 group-hover:-rotate-6 shadow-lg ${colors.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
