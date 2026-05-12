import React from 'react'
import { Bell } from 'lucide-react'
import NotificationDashboard from '../components/NotificationDashboard'

export const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-folusho-sage-50 border border-folusho-sage-100 text-folusho-sage-500 text-[10px] font-black tracking-[0.35em] uppercase">
            Broadcast Protocols
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-folusho-slate-900 tracking-tighter leading-none">
            Notification <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">Broadcast.</span>
          </h1>
          <p className="text-folusho-slate-400 text-base font-bold max-w-xl leading-relaxed tracking-tight">
            Monitor and calibrate automated communication streams across the Folusho academic citadel.
          </p>
        </div>
      </div>

      <div className="folusho-card !p-0 overflow-hidden border-folusho-cream-200">
        <div className="p-10">
          <NotificationDashboard />
        </div>
      </div>

      {/* Protocol Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <div className="folusho-card !p-10 border-folusho-sage-100 bg-folusho-sage-50/30">
          <h3 className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-folusho-sage-500" />
            Registry Initialization
          </h3>
          <p className="text-sm text-folusho-slate-700 font-bold tracking-tight leading-relaxed">
            Automated transmission sequence triggered upon student registration synchronization.
          </p>
        </div>

        <div className="folusho-card !p-10 border-folusho-yellow-100 bg-folusho-yellow-50/30">
          <h3 className="text-[10px] font-black text-folusho-yellow-600 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-folusho-yellow-500" />
            Result Synchronization
          </h3>
          <p className="text-sm text-folusho-slate-700 font-bold tracking-tight leading-relaxed">
            Broadcast initiated upon the successful capture of academic evaluation matrices.
          </p>
        </div>

        <div className="folusho-card !p-10 border-folusho-coral-100 bg-folusho-coral-50/30">
          <h3 className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-folusho-coral-500" />
            Presence Alert
          </h3>
          <p className="text-sm text-folusho-slate-700 font-bold tracking-tight leading-relaxed">
            Low-presence detection protocols trigger warning signals to relevant guardians.
          </p>
        </div>

        <div className="folusho-card !p-10 border-folusho-coral-100 bg-folusho-coral-50/30">
          <h3 className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-folusho-coral-500" />
            Critical Grade Alert
          </h3>
          <p className="text-sm text-folusho-slate-700 font-bold tracking-tight leading-relaxed">
            Performance drop detection protocols trigger automated intervention notifications.
          </p>
        </div>

        <div className="folusho-card !p-10 border-folusho-sage-100 bg-folusho-sage-50/30">
          <h3 className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-folusho-sage-500" />
            Faculty Deployment
          </h3>
          <p className="text-sm text-folusho-slate-700 font-bold tracking-tight leading-relaxed">
            Sector assignment updates transmitted to newly deployed faculty units.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
