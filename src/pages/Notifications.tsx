import React from 'react'
import { Bell } from 'lucide-react'
import NotificationDashboard from '../components/NotificationDashboard'

export const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-folusho-sage-500/10 border border-white/5 text-folusho-sage-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Broadcast Protocols
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Notification <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">Broadcast.</span>
          </h1>
          <p className="text-folusho-slate-500 text-base font-bold max-w-xl leading-relaxed tracking-tight">
            Monitor and calibrate automated communication streams across the Folusho academic citadel.
          </p>
        </div>
      </div>

      <div className="folusho-card !p-0 overflow-hidden border-white/5 bg-folusho-slate-900/40 backdrop-blur-md shadow-2xl">
        <div className="p-10">
          <NotificationDashboard />
        </div>
      </div>

      {/* Protocol Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <div className="folusho-card !p-10 border-white/5 bg-folusho-sage-500/10 shadow-xl">
          <h3 className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-folusho-sage-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            Registry Initialization
          </h3>
          <p className="text-sm text-folusho-slate-400 font-bold tracking-tight leading-relaxed uppercase">
            Automated transmission sequence triggered upon student registration synchronization.
          </p>
        </div>

        <div className="folusho-card !p-10 border-white/5 bg-folusho-yellow-500/10 shadow-xl">
          <h3 className="text-[10px] font-black text-folusho-yellow-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-folusho-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
            Result Synchronization
          </h3>
          <p className="text-sm text-folusho-slate-400 font-bold tracking-tight leading-relaxed uppercase">
            Broadcast initiated upon the successful capture of academic evaluation matrices.
          </p>
        </div>

        <div className="folusho-card !p-10 border-white/5 bg-folusho-coral-500/10 shadow-xl">
          <h3 className="text-[10px] font-black text-folusho-coral-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-folusho-coral-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            Presence Alert
          </h3>
          <p className="text-sm text-folusho-slate-400 font-bold tracking-tight leading-relaxed uppercase">
            Low-presence detection protocols trigger warning signals to relevant guardians.
          </p>
        </div>

        <div className="folusho-card !p-10 border-white/5 bg-folusho-coral-500/10 shadow-xl">
          <h3 className="text-[10px] font-black text-folusho-coral-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-folusho-coral-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            Critical Grade Alert
          </h3>
          <p className="text-sm text-folusho-slate-400 font-bold tracking-tight leading-relaxed uppercase">
            Performance drop detection protocols trigger automated intervention notifications.
          </p>
        </div>

        <div className="folusho-card !p-10 border-white/5 bg-folusho-sage-500/10 shadow-xl">
          <h3 className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-folusho-sage-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            Faculty Deployment
          </h3>
          <p className="text-sm text-folusho-slate-400 font-bold tracking-tight leading-relaxed uppercase">
            Sector assignment updates transmitted to newly deployed faculty units.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
