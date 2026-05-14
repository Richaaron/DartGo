import React from 'react'
import { Bell } from 'lucide-react'
import NotificationDashboard from '../components/NotificationDashboard'

export const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Broadcast
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Notifications <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">Center.</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold max-w-xl leading-relaxed tracking-tight">
            Monitor and manage automated emails and notifications.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 !p-0 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg">
        <div className="p-10">
          <NotificationDashboard />
        </div>
      </div>

      {/* Protocol Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-10 rounded-3xl border border-emerald-100 dark:border-emerald-800 shadow-lg">
          <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Registration
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold tracking-tight leading-relaxed uppercase">
            Automated email sent upon new student registration.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-3xl border border-amber-100 dark:border-amber-800 shadow-lg">
          <h3 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            Result Added
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold tracking-tight leading-relaxed uppercase">
            Email sent when new results are added for a student.
          </p>
        </div>

        <div className="bg-rose-50 dark:bg-rose-900/10 p-10 rounded-3xl border border-rose-100 dark:border-rose-800 shadow-lg">
          <h3 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            Low Attendance
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold tracking-tight leading-relaxed uppercase">
            Warning email sent to parents for low attendance.
          </p>
        </div>

        <div className="bg-rose-50 dark:bg-rose-900/10 p-10 rounded-3xl border border-rose-100 dark:border-rose-800 shadow-lg">
          <h3 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            Low Grades
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold tracking-tight leading-relaxed uppercase">
            Email sent when a student is performing poorly.
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-10 rounded-3xl border border-emerald-100 dark:border-emerald-800 shadow-lg">
          <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Teacher Assigned
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold tracking-tight leading-relaxed uppercase">
            Email sent to a teacher when they are assigned a class or subject.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
