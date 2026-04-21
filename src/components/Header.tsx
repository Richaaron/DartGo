import React from 'react'
import { GraduationCap, Menu, X } from 'lucide-react'
import NotificationBell from './NotificationBell'

interface HeaderProps {
  isDarkMode: boolean
  showMobileMenu: boolean
  setShowMobileMenu: (show: boolean) => void
  config: any
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, showMobileMenu, setShowMobileMenu, config }) => {
  return (
    <div className={`${isDarkMode ? 'bg-gradient-to-r from-black via-purple-900/40 to-black border-b border-gold-500/20' : 'bg-gradient-to-r from-purple-900 to-black border-b border-gold-500/30'} text-white px-4 py-3 flex items-center justify-between z-40`}>
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="p-2 hover:bg-gold-500/10 rounded-lg transition-all active:scale-90"
      >
        {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <div className="flex items-center gap-2">
        {config?.schoolLogo ? (
          <img src={config.schoolLogo} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-500 rounded-lg flex items-center justify-center text-black">
            <GraduationCap size={18} />
          </div>
        )}
        <span className="text-xs font-black uppercase bg-gradient-to-r from-gold-300 to-gold-200 bg-clip-text text-transparent">
          {config?.schoolName?.split(' ')[0] || 'FOLUSHO'}
        </span>
      </div>
      
      <NotificationBell />
    </div>
  )
}

export default Header
