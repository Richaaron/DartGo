import { forwardRef } from 'react'
import { Student, SubjectResult, Subject } from '../types'

interface PrintResultProps {
  child: Student
  results: SubjectResult[]
  subjects: Subject[]
  classPositionText?: string
}

const PrintResult = forwardRef<HTMLDivElement, PrintResultProps>(({ child, results, subjects, classPositionText }, ref) => {
  const overallAverage = results.length > 0
    ? Math.round((results.reduce((sum, r) => sum + r.percentage, 0) / results.length) * 100) / 100
    : 0

  const getGradeFromScore = (percentage: number): string => {
    if (percentage >= 70) return 'A'
    if (percentage >= 65) return 'B'
    if (percentage >= 55) return 'C'
    if (percentage >= 50) return 'D'
    if (percentage >= 45) return 'E'
    return 'F'
  }

  const getRemark = (percentage: number): string => {
    if (percentage >= 70) return 'EXCELLENT'
    if (percentage >= 65) return 'VERY GOOD'
    if (percentage >= 55) return 'CREDIT'
    if (percentage >= 50) return 'FAIR'
    if (percentage >= 45) return 'WEAK PASS'
    return 'FAIL'
  }

  return (
    <div ref={ref} className="bg-white p-10 max-w-[800px] mx-auto shadow-2xl border-t-[12px] border-slate-900 relative overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", color: '#1e293b' }}>
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none rotate-[-30deg]">
        <h1 className="text-[120px] font-black uppercase text-slate-900 whitespace-nowrap">AUTHENTIC</h1>
      </div>

      {/* School Header */}
      <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-100">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl border-2 border-amber-500/20">
            <svg viewBox="0 0 24 24" className="w-16 h-16 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L1 7l11 5 11-5-11-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">Folusho Victory Schools</h1>
            <p className="text-amber-600 font-bold tracking-[0.2em] mt-1 text-sm uppercase italic">Excellence & Integrity</p>
            <div className="flex gap-3 mt-3 text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1"><div className="w-1 h-1 bg-amber-500 rounded-full" /> ABUJA, NIGERIA</span>
              <span className="flex items-center gap-1"><div className="w-1 h-1 bg-amber-500 rounded-full" /> +234 800 000 0000</span>
              <span className="flex items-center gap-1"><div className="w-1 h-1 bg-amber-500 rounded-full" /> INFO@FOLUSHO.COM</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block px-4 py-2 bg-slate-900 text-amber-500 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg">
            Report Card
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Serial No: FVS-{Math.floor(100000 + Math.random() * 900000)}</p>
        </div>
      </div>

      {/* Student Data Cards */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Student Information</p>
          <h2 className="text-lg font-black text-slate-900 leading-tight uppercase">{child.firstName} {child.lastName}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Reg: <span className="text-slate-700">{child.registrationNumber}</span></p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Academic Context</p>
          <p className="text-sm font-black text-slate-900 uppercase">{child.class}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Term: <span className="text-slate-700 uppercase">{results[0]?.term || '1st'} Term</span></p>
          <p className="text-xs text-slate-500 font-semibold italic">{results[0]?.academicYear || '2024/2025'}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-center">
          <p className="text-[9px] text-amber-500/60 font-black uppercase tracking-widest mb-1">Overall Performance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white leading-none">{overallAverage.toFixed(1)}%</span>
            <span className="text-xs text-amber-500 font-black uppercase tracking-tighter">Average</span>
          </div>
          {classPositionText && (
            <p className="text-[10px] text-white/70 font-bold uppercase mt-1">Rank: <span className="text-amber-400">{classPositionText}</span></p>
          )}
        </div>
      </div>

      {/* Main Results Table */}
      <div className="mb-10 overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white uppercase tracking-widest text-[10px] font-black">
              <th className="p-4 text-left border-r border-slate-800">Subject Description</th>
              <th className="p-4 text-center border-r border-slate-800">1st CA</th>
              <th className="p-4 text-center border-r border-slate-800">2nd CA</th>
              <th className="p-4 text-center border-r border-slate-800">Exam</th>
              <th className="p-4 text-center border-r border-slate-800">Total</th>
              <th className="p-4 text-center border-r border-slate-800">Grade</th>
              <th className="p-4 text-center border-r border-slate-800">Rank</th>
              <th className="p-4 text-center">Outcome</th>
            </tr>
          </thead>
          <tbody className="font-semibold text-slate-700">
            {results.map((result, idx) => {
              const subject = subjects.find((s) => s.id === result.subjectId)
              const grade = getGradeFromScore(result.percentage)
              const isFailing = grade === 'F'
              
              return (
                <tr key={result.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 transition-colors hover:bg-amber-50/30`}>
                  <td className="p-4 text-slate-900 font-black uppercase border-r border-slate-100">{subject?.name || 'N/A'}</td>
                  <td className="p-4 text-center border-r border-slate-100 font-bold text-slate-600">{result.firstCA}</td>
                  <td className="p-4 text-center border-r border-slate-100 font-bold text-slate-600">{result.secondCA}</td>
                  <td className="p-4 text-center border-r border-slate-100 font-bold text-slate-600">{result.exam}</td>
                  <td className="p-4 text-center border-r border-slate-100 font-black text-slate-900">{result.totalScore}</td>
                  <td className={`p-4 text-center border-r border-slate-100 font-black ${isFailing ? 'text-red-600' : 'text-slate-900'}`}>{grade}</td>
                  <td className="p-4 text-center border-r border-slate-100 text-[9px] font-black uppercase text-amber-600 whitespace-nowrap">{result.positionText || 'N/A'}</td>
                  <td className={`p-4 text-center text-[9px] font-black uppercase tracking-tighter ${isFailing ? 'text-red-500' : 'text-emerald-600'}`}>{getRemark(result.percentage)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Sections: Grading & Signatures */}
      <div className="grid grid-cols-2 gap-10">
        {/* Grading Key */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
            <div className="w-4 h-[2px] bg-amber-500" /> Grading Key
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { g: 'A', r: '70-100', d: 'Excellent' },
              { g: 'B', r: '65-69', d: 'V. Good' },
              { g: 'C', r: '55-64', d: 'Credit' },
              { g: 'D', r: '50-54', d: 'Fair' },
              { g: 'E', r: '45-49', d: 'Pass' },
              { g: 'F', r: '0-44', d: 'Fail' },
            ].map((key) => (
              <div key={key.g} className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                <span className="block text-xs font-black text-slate-900 leading-none">{key.g}</span>
                <span className="block text-[8px] text-slate-500 font-bold mt-1 leading-none">{key.r}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Authenticity Signatures */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center relative">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Form Teacher</p>
            <div className="h-16 flex items-center justify-center">
              <img src="/assets/teacher_signature.png" alt="Teacher Signature" className="max-h-full max-w-full mix-blend-multiply opacity-90" />
            </div>
            <div className="border-t border-slate-300 w-full mt-1" />
            <p className="text-[8px] font-black uppercase text-slate-900 mt-1">Authorized Official</p>
          </div>
          <div className="text-center relative">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Principal</p>
            <div className="h-16 flex items-center justify-center">
              <img src="/assets/principal_signature.png" alt="Principal Signature" className="max-h-full max-w-full mix-blend-multiply opacity-90" />
            </div>
            <div className="border-t border-slate-300 w-full mt-1" />
            <p className="text-[8px] font-black uppercase text-slate-900 mt-1">Stamp & Seal</p>
            
            {/* Stamp Circle */}
            <div className="absolute top-2 right-2 w-14 h-14 border-4 border-red-600/30 rounded-full flex items-center justify-center rotate-[-15deg] pointer-events-none">
              <div className="text-[8px] font-black text-red-600/40 uppercase text-center leading-none">Folusho<br/>Approved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">Folusho Reporting System • Secure Academic Document • 2024</p>
        <div className="mt-2 flex justify-center gap-1">
          {[...Array(50)].map((_, i) => (
            <div key={i} className={`h-[2px] w-[2px] rounded-full ${i % 2 === 0 ? 'bg-amber-500' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>
    </div>
  )
})



PrintResult.displayName = 'PrintResult'

export default PrintResult