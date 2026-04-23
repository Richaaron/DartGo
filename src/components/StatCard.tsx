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
    blue: 'bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-300',
    green: 'bg-emerald-50 dark:bg-emerald-600/25 text-emerald-600 dark:text-emerald-300',
    purple: 'bg-gold-50 dark:bg-gold-600/25 text-gold-600 dark:text-gold-300',
    orange: 'bg-gold-50 dark:bg-gold-600/25 text-gold-600 dark:text-gold-300',
    red: 'bg-rose-50 dark:bg-rose-600/20 text-rose-600 dark:text-rose-300',
  }

  return (
    <div className="card-lg group overflow-hidden relative">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-current opacity-[0.03] dark:opacity-[0.08] rounded-full blur-2xl group-hover:opacity-[0.08] dark:group-hover:opacity-[0.12] transition-opacity duration-500"></div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-gray-500 dark:text-gray-300 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tighter">{value}</p>
            {trend && (
              <span
                className={`text-xs font-black px-1.5 py-0.5 rounded-md ${
                  trend === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-600/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-600/30 dark:text-rose-300'
                }`}
              >
                {trend === 'up' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>
        <div className={`p-3.5 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm ${colorMap[color]}`}>{icon}</div>
      </div>
    </div>
  )
}
