import { Eye } from 'lucide-react'
import TeacherActivityLog from '../components/TeacherActivityLog'

export default function ActivityLog() {
  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-folusho-sage-500/10 border border-white/5 text-folusho-sage-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Surveillance Protocols
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Institutional <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">History.</span>
          </h1>
          <p className="text-folusho-slate-500 text-base font-bold max-w-xl leading-relaxed tracking-tight">
            Monitor institutional action sequences for administrative integrity and operational alignment within the Folusho citadel.
          </p>
        </div>
      </div>

      <div className="folusho-card !p-0 overflow-hidden border-white/5 bg-folusho-slate-900/40 backdrop-blur-md shadow-2xl">
        <TeacherActivityLog />
      </div>
    </div>
  )
}
