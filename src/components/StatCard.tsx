import React from 'react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  trend?: 'up' | 'down'
}

export default function StatCard({ icon, label, value, color, trend }: StatCardProps) {
  // School-inspired color mapping
  const colorMap = {
    blue: {
      bg: 'bg-gradient-to-br from-school-blue/20 dark:from-school-blue/30 to-school-sky/20 dark:to-school-sky/30 border-l-4 border-school-blue rounded-full',
      icon: 'bg-school-blue/30 dark:bg-school-blue/50 text-white',
      label: 'text-school-blue dark:text-school-sky',
      value: 'text-school-blue dark:text-white font-black'
    },
    green: {
      bg: 'bg-gradient-to-br from-school-green/20 dark:from-school-green/30 to-school-blue/20 dark:to-school-blue/30 border-l-4 border-school-green rounded-full',
      icon: 'bg-school-green/30 dark:bg-school-green/50 text-white',
      label: 'text-school-green dark:text-school-green',
      value: 'text-school-green dark:text-white font-black'
    },
    purple: {
      bg: 'bg-gradient-to-br from-school-purple/20 dark:from-school-purple/30 to-school-pink/20 dark:to-school-pink/30 border-l-4 border-school-purple rounded-full',
      icon: 'bg-school-purple/30 dark:bg-school-purple/50 text-white',
      label: 'text-school-purple dark:text-school-purple',
      value: 'text-school-purple dark:text-white font-black'
    },
    orange: {
      bg: 'bg-gradient-to-br from-school-orange/20 dark:from-school-orange/30 to-school-red/20 dark:to-school-red/30 border-l-4 border-school-orange rounded-full',
      icon: 'bg-school-orange/30 dark:bg-school-orange/50 text-white',
      label: 'text-school-orange dark:text-school-orange',
      value: 'text-school-orange dark:text-white font-black'
    },
    red: {
      bg: 'bg-gradient-to-br from-school-red/20 dark:from-school-red/30 to-school-pink/20 dark:to-school-pink/30 border-l-4 border-school-red rounded-full',
      icon: 'bg-school-red/30 dark:bg-school-red/50 text-white',
      label: 'text-school-red dark:text-school-red',
      value: 'text-school-red dark:text-white font-black'
    },
  }

  const colors = colorMap[color]

  return (
    <div className={`card-lg group overflow-hidden relative ${colors.bg} hover:shadow-2xl transition-all duration-300 animate-pulse-bright hover:animate-none`}>
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-school-yellow opacity-[0.03] dark:opacity-[0.05] rounded-full blur-3xl group-hover:opacity-[0.08] dark:group-hover:opacity-[0.15] transition-all duration-700"></div>
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-gradient-to-tr from-school-red to-school-yellow opacity-[0.02] dark:opacity-[0.04] rounded-full blur-3xl group-hover:opacity-[0.06] dark:group-hover:opacity-[0.12] transition-all duration-700"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className={`text-xs font-black uppercase tracking-widest mb-2 ${colors.label}`}>{label}</p>
          <div className="flex items-baseline gap-3">
            <p className={`text-4xl font-black tracking-tighter ${colors.value}`}>{value}</p>
            {trend && (
              <span className={`inline-flex items-center justify-center text-sm font-black px-2.5 py-1 rounded-full transition-all ${
                trend === 'up' 
                  ? 'bg-school-green/30 dark:bg-school-green/50 text-white' 
                  : 'bg-school-red/30 dark:bg-school-red/50 text-white'
              }`}>
                {trend === 'up' ? '↗' : '↘'}
              </span>
            )}
          </div>
        </div>
        <div className={`p-4 rounded-full transition-all duration-300 group-hover:scale-125 group-hover:-rotate-12 shadow-lg animate-bounce-slow hover:animate-none ${colors.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
