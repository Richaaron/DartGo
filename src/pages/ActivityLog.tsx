import { Eye } from 'lucide-react'
import TeacherActivityLog from '../components/TeacherActivityLog'

export default function ActivityLog() {
  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-nebula-indigo-500/10 border border-nebula-indigo-500/20 text-nebula-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-md">
            Surveillance Protocols
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
            Operation <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nebula-indigo-400 via-nebula-teal-400 to-nebula-pink-400">Omniscience.</span>
          </h1>
          <p className="text-nebula-slate-400 text-lg font-bold max-w-xl leading-relaxed tracking-tight">
            Monitor institutional action sequences for administrative integrity and operational alignment.
          </p>
        </div>
      </div>

      <div className="nebula-card !p-0 overflow-hidden">
        <TeacherActivityLog />
      </div>
    </div>
  )
}
