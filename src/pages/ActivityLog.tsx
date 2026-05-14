import { Eye } from 'lucide-react'
import TeacherActivityLog from '../components/TeacherActivityLog'

export default function ActivityLog() {
  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Activity Log
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            System <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">History.</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold max-w-xl leading-relaxed tracking-tight">
            Monitor administrative actions and events.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 !p-0 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg">
        <TeacherActivityLog />
      </div>
    </div>
  )
}
