import React from 'react'
import { Bell } from 'lucide-react'
import NotificationDashboard from '../components/NotificationDashboard'

export const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-nebula-indigo-500/10 border border-nebula-indigo-500/20 text-nebula-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-md">
            Broadcast Protocols
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
            Notification <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nebula-indigo-400 via-nebula-teal-400 to-nebula-pink-400">Broadcast.</span>
          </h1>
          <p className="text-nebula-slate-400 text-lg font-bold max-w-xl leading-relaxed tracking-tight">
            Monitor and calibrate automated communication streams across the institutional network.
          </p>
        </div>
      </div>

      <div className="nebula-card !p-0 overflow-hidden">
        <div className="p-10">
          <NotificationDashboard />
        </div>
      </div>

      {/* Protocol Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <div className="nebula-card !p-8 border-nebula-indigo-500/10 bg-nebula-indigo-500/[0.02]">
          <h3 className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] mb-4">Registry Initialization</h3>
          <p className="text-sm text-white font-bold tracking-tight">
            Automated transmission sequence triggered upon student registration synchronization.
          </p>
        </div>

        <div className="nebula-card !p-8 border-nebula-teal-500/10 bg-nebula-teal-500/[0.02]">
          <h3 className="text-[10px] font-black text-nebula-teal-400 uppercase tracking-[0.3em] mb-4">Result Synchronization</h3>
          <p className="text-sm text-white font-bold tracking-tight">
            Broadcast initiated upon the successful capture of academic evaluation matrices.
          </p>
        </div>

        <div className="nebula-card !p-8 border-nebula-pink-500/10 bg-nebula-pink-500/[0.02]">
          <h3 className="text-[10px] font-black text-nebula-pink-400 uppercase tracking-[0.3em] mb-4">Presence Alert</h3>
          <p className="text-sm text-white font-bold tracking-tight">
            Low-presence detection protocols trigger warning signals to relevant guardians.
          </p>
        </div>

        <div className="nebula-card !p-8 border-nebula-pink-500/10 bg-nebula-pink-500/[0.02]">
          <h3 className="text-[10px] font-black text-nebula-pink-400 uppercase tracking-[0.3em] mb-4">Critical Grade Alert</h3>
          <p className="text-sm text-white font-bold tracking-tight">
            Performance drop detection protocols trigger automated intervention notifications.
          </p>
        </div>

        <div className="nebula-card !p-8 border-nebula-indigo-500/10 bg-nebula-indigo-500/[0.02]">
          <h3 className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] mb-4">Faculty Deployment</h3>
          <p className="text-sm text-white font-bold tracking-tight">
            Sector assignment updates transmitted to newly deployed faculty units.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
