import { forwardRef } from 'react'
import { Student, SubjectResult, Subject } from '../types'
import { GraduationCap } from 'lucide-react'

interface PrintResultProps {
  child: Student
  results: SubjectResult[]
  subjects: Subject[]
  classPositionText?: string
  observation?: any
  config?: any
  classTeacher?: any
}

const PrintResult = forwardRef<HTMLDivElement, PrintResultProps>(({ 
  child, 
  results, 
  subjects, 
  classPositionText,
  observation,
  config,
  classTeacher
}, ref) => {
  const grandTotal = results.reduce((sum, r) => sum + r.totalScore, 0)
  const averageScore = results.length > 0 ? (grandTotal / results.length).toFixed(1) : "0.0"

  const renderRating = (val: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${
              i <= val
                ? "bg-indigo-600 border-indigo-600 shadow-sm"
                : "bg-transparent border-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const affectiveDomain = observation?.affectiveDomain || {
    punctuality: 3,
    neatness: 3,
    honesty: 3,
    leadership: 3,
    cooperation: 3,
    selfControl: 3,
  };

  const psychomotorSkills = observation?.psychomotorSkills || {
    handwriting: 3,
    sports: 3,
    arts: 3,
    fluency: 3,
  };

  return (
    <div 
      ref={ref} 
      className="bg-white p-12 max-w-[1000px] mx-auto relative overflow-hidden" 
      style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", color: '#1e293b' }}
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 opacity-20 rounded-full -mt-32 -mr-32 blur-3xl"></div>

      {/* School Header */}
      <div className="text-center border-b-4 border-indigo-600 pb-10 mb-10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-8">
          {config?.schoolLogo ? (
            <img
              src={config.schoolLogo}
              alt="Logo"
              className="w-24 h-24 object-contain shadow-lg rounded-2xl p-2 bg-white"
            />
          ) : (
            <div className="w-24 h-24 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <GraduationCap size={48} />
            </div>
          )}
          <div className="text-left">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-1">
              {config?.schoolName || "FOLUSHO VICTORY SCHOOLS"}
            </h1>
            <p className="text-indigo-600 font-black text-xs uppercase tracking-[0.3em]">
              {config?.motto || "Fountain of Education"}
            </p>
            <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">
              {config?.schoolAddress || "C6 Kwasau street, Barnawa, Kaduna"}{" "}
              | {config?.schoolPhone || "08063020938, 08138115993, 08138594397"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl inline-block">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">
              Report Status
            </p>
            <p className="text-sm font-black uppercase tracking-tighter">
              Official Document
            </p>
          </div>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="grid grid-cols-2 gap-10 mb-12 bg-gray-50/80 p-8 rounded-[1.5rem] border border-gray-100">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Full Name
            </p>
            <p className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {child.firstName} {child.lastName}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                ID Number
              </p>
              <p className="text-sm font-black text-gray-900">
                {child.registrationNumber}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Classification
              </p>
              <p className="text-sm font-black text-gray-900">
                {child.class}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4 text-right">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Academic Level
            </p>
            <p className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {child.level}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Term
              </p>
              <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">
                {results[0]?.term || config?.currentTerm || "1st"} Term
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Session
              </p>
              <p className="text-sm font-black text-gray-900 uppercase tracking-widest">
                {results[0]?.academicYear || config?.currentAcademicYear || "2023/2024"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-[1.5rem] overflow-hidden border-2 border-gray-100 mb-12 shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest">Subject</th>
              <th className="p-5 text-center text-[10px] font-black uppercase tracking-widest">CA 1 (20)</th>
              <th className="p-5 text-center text-[10px] font-black uppercase tracking-widest">CA 2 (20)</th>
              <th className="p-5 text-center text-[10px] font-black uppercase tracking-widest">Exam (60)</th>
              <th className="p-5 text-center text-[10px] font-black uppercase tracking-widest">Total</th>
              <th className="p-5 text-center text-[10px] font-black uppercase tracking-widest">Grade</th>
              <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((r) => {
              const subject = subjects.find((s) => s.id === r.subjectId);
              return (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5 font-black text-gray-900 text-sm tracking-tight">{subject?.name || "Unknown"}</td>
                  <td className="p-5 text-center font-bold text-gray-600">{r.firstCA}</td>
                  <td className="p-5 text-center font-bold text-gray-600">{r.secondCA}</td>
                  <td className="p-5 text-center font-bold text-gray-600">{r.exam}</td>
                  <td className="p-5 text-center font-black text-gray-900">{r.totalScore}</td>
                  <td className="p-5 text-center">
                    <span className={`px-3 py-1 rounded-lg font-black text-xs ${
                      ["A", "B"].includes(r.grade) ? "bg-emerald-100 text-emerald-700" : 
                      r.grade === "C" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    }`}>
                      {r.grade}
                    </span>
                  </td>
                  <td className="p-5 text-xs font-bold italic text-gray-500">{r.remarks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Behavioral and Psychomotor Sections */}
      <div className="grid grid-cols-2 gap-16 mb-16">
        <div className="space-y-6">
          <h3 className="font-black text-indigo-600 text-[10px] uppercase tracking-[0.3em] pb-3 border-b-2 border-indigo-50">Affective Domain</h3>
          <div className="space-y-4">
            {Object.entries(affectiveDomain).map(([key, val]: [string, any]) => (
              <div key={key} className="flex justify-between items-center group">
                <span className="text-xs text-gray-500 font-black tracking-widest group-hover:text-gray-900 transition-colors capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </span>
                {renderRating(val)}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="font-black text-indigo-600 text-[10px] uppercase tracking-[0.3em] pb-3 border-b-2 border-indigo-50">Psychomotor Skills</h3>
          <div className="space-y-4">
            {Object.entries(psychomotorSkills).map(([key, val]: [string, any]) => (
              <div key={key} className="flex justify-between items-center group">
                <span className="text-xs text-gray-500 font-black tracking-widest group-hover:text-gray-900 transition-colors capitalize">
                  {key}
                </span>
                {renderRating(val)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-8 mb-16">
        <div className="p-8 bg-indigo-50/50 rounded-[1.5rem] border-2 border-indigo-100/50 text-center">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Grand Total</p>
          <p className="text-4xl font-black text-indigo-900 tracking-tighter">{grandTotal}</p>
        </div>
        <div className="p-8 bg-emerald-50/50 rounded-[1.5rem] border-2 border-emerald-100/50 text-center">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Average Score</p>
          <p className="text-4xl font-black text-emerald-900 tracking-tighter">{averageScore}</p>
        </div>
        <div className="p-8 bg-violet-50/50 rounded-[1.5rem] border-2 border-violet-100/50 text-center">
          <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">Class Position</p>
          <p className="text-4xl font-black text-violet-900 tracking-tighter">{classPositionText || "N/A"}</p>
        </div>
      </div>

      {/* Narratives */}
      <div className="space-y-8 mb-20">
        <div className="bg-gray-50/50 p-8 rounded-[1.5rem] border-l-8 border-indigo-600">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Class Teacher Evaluation</p>
          <p className="text-gray-900 italic font-bold text-lg leading-relaxed">
            "{observation?.teacherComment || "No qualitative feedback provided for this session."}"
          </p>
        </div>
        <div className="bg-gray-50/50 p-8 rounded-[1.5rem] border-l-8 border-gray-900">
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">
            {config?.principalName ? `${config.principalName} — Principal's Remarks` : "Principal's Remarks"}
          </p>
          <p className="text-gray-900 italic font-bold text-lg leading-relaxed">
            "{observation?.principalComment || "Official remarks pending authorization."}"
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 pt-10 mt-4 border-t-2 border-gray-100">
        <div className="text-center">
          <div className="h-16 mb-1 flex items-end justify-center overflow-hidden pb-1">
            {classTeacher ? (
              <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "2rem", fontWeight: 700, color: "#1e3a8a" }}>
                {classTeacher.name}
              </span>
            ) : <span className="text-[9px] text-gray-300 uppercase tracking-widest border border-dashed border-gray-200 rounded px-3 py-2 select-none">Sign here</span>}
          </div>
          <div className="h-px bg-gray-400 mb-2 w-full" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Class Teacher</p>
        </div>

        <div className="text-center">
          <div className="h-16 mb-1 flex items-end justify-center overflow-hidden pb-1">
            {config?.principalName || "Solomon Benjamin" ? (
              <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "2rem", fontWeight: 700, color: "#1e3a8a" }}>
                {config?.principalName || "Solomon Benjamin"}
              </span>
            ) : <span className="text-[9px] text-gray-300 uppercase tracking-widest border border-dashed border-gray-200 rounded px-3 py-2 select-none">Not set</span>}
          </div>
          <div className="h-px bg-gray-400 mb-2 w-full" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Principal</p>
        </div>

        <div className="text-center">
          <div className="h-16 mb-1 flex items-end justify-center overflow-hidden pb-1">
            {config?.proprietressName || "Olushola Faluyi" ? (
              <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "2rem", fontWeight: 700, color: "#1e3a8a" }}>
                {config?.proprietressName || "Olushola Faluyi"}
              </span>
            ) : <span className="text-[9px] text-gray-300 uppercase tracking-widest border border-dashed border-gray-200 rounded px-3 py-2 select-none">Not set</span>}
          </div>
          <div className="h-px bg-gray-400 mb-2 w-full" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Proprietress</p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">Folusho Reporting System • Secure Academic Document • 2024</p>
      </div>
    </div>
  )
})

PrintResult.displayName = 'PrintResult'

export default PrintResult