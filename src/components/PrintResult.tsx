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
  const averageScore = results.length > 0 ? (grandTotal / results.length) : 0
  const formattedAverage = Math.round(averageScore)

  const getAutomatedComments = (score: number) => {
    let teacher = "No qualitative feedback provided for this session."
    let principal = "Academic performance under review."

    if (score >= 80) {
      teacher = "An excellent performance. You have demonstrated a high level of academic proficiency. Keep it up."
      principal = "A brilliant result. Very impressive. Keep striving for the peak."
    } else if (score >= 70) {
      teacher = "A very good result. You are a diligent student. Maintain the standard."
      principal = "A commendable performance. You have a great potential for excellence."
    } else if (score >= 60) {
      teacher = "Good performance, but there is still room for improvement. Focus more on your weak areas."
      principal = "A good result overall. With more dedication, you can achieve a higher grade."
    } else if (score >= 50) {
      teacher = "A fair performance. You need to be more serious and work harder in the coming term."
      principal = "An average performance. You are encouraged to put in more effort to improve your standing."
    } else if (score >= 40) {
      teacher = "A weak result. You must devote more time to your studies to avoid failure."
      principal = "A below-average performance. Significant improvement is needed to move forward."
    } else if (score > 0) {
      teacher = "Poor performance. You need to put in extra effort and seek help in all subjects."
      principal = "A disappointing result. You must be more focused and disciplined in your academic work."
    }

    return { teacher, principal }
  }

  const autoComments = getAutomatedComments(averageScore)
  const finalTeacherComment = observation?.teacherComment || autoComments.teacher
  const finalPrincipalComment = observation?.principalComment || autoComments.principal

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
      className="bg-white p-12 max-w-[1000px] mx-auto relative overflow-hidden border-[12px] border-double border-royal-gold-500/30" 
      style={{ fontFamily: "'Outfit', sans-serif", color: '#1a1a1a' }}
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-royal-gold-500/5 rounded-full -mt-48 -mr-48 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-royal-purple-500/5 rounded-full -mb-48 -ml-48 blur-3xl"></div>

      {/* School Header */}
      <div className="text-center border-b-8 border-double border-royal-gold-500 pb-12 mb-12 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-8">
          <img
            src={config?.schoolLogo || "/school_logo.png?v=20260512"}
            alt="Logo"
            className="w-28 h-28 object-contain shadow-xl rounded-3xl p-3 bg-white border-2 border-royal-gold-500"
          />
          <div className="text-left">
            <h1 
              className="text-5xl font-black text-royal-black-900 tracking-tighter uppercase mb-2"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {config?.schoolName || "FOLUSHO VICTORY SCHOOLS"}
            </h1>
            <p 
              className="text-royal-purple-600 font-black text-sm uppercase tracking-[0.4em]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {config?.motto || "Fountain of Knowledge"}
            </p>
            <p className="text-[11px] text-gray-500 font-bold mt-3 uppercase tracking-widest flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-royal-gold-500 rounded-full"></span>
              {config?.schoolAddress || "C6 Kwasau street, Barnawa, Kaduna"}
              <span className="w-1.5 h-1.5 bg-royal-gold-500 rounded-full"></span>
              {config?.schoolPhone || "08063020938, 08138115993"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-royal-black-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl border-2 border-royal-gold-500">
            <p 
              className="text-[9px] font-black uppercase tracking-[0.3em] text-royal-gold-400 mb-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Official Document
            </p>
            <p className="text-md font-black uppercase tracking-tighter">
              Student Record
            </p>
          </div>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="grid grid-cols-2 gap-12 mb-16 bg-royal-black-900 p-10 rounded-[2.5rem] border-2 border-royal-gold-500/20 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-royal-gold-500/5 rotate-45 transform translate-x-16 -translate-y-16"></div>
        <div className="space-y-6 relative z-10">
          <div>
            <p 
              className="text-[9px] font-black text-royal-gold-500 uppercase tracking-[0.3em] mb-2"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Learner Details
            </p>
            <p 
              className="text-3xl font-black text-white uppercase tracking-tight"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {child.firstName} {child.lastName}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                ID Number
              </p>
              <p className="text-md font-black text-royal-gold-400">
                {child.registrationNumber}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Class
              </p>
              <p className="text-md font-black text-royal-gold-400">
                {child.class}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-6 text-right relative z-10">
          <div>
            <p 
              className="text-[9px] font-black text-royal-gold-500 uppercase tracking-[0.3em] mb-2"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Session Overview
            </p>
            <p 
              className="text-3xl font-black text-white uppercase tracking-tight"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {child.level}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Term
              </p>
              <p className="text-md font-black text-royal-gold-400 uppercase tracking-widest">
                {config?.currentTerm || "2nd Term"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Academic Year
              </p>
              <p className="text-md font-black text-royal-gold-400 uppercase tracking-widest">
                {config?.currentAcademicYear || "2023/2024"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-hidden rounded-[2.5rem] border-2 border-royal-gold-500/20 shadow-2xl mb-16 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-royal-purple-900 to-royal-black-900 text-white">
              <th 
                className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Subject
              </th>
              <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30">
                CA (40)
              </th>
              <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30">
                Exam (60)
              </th>
              <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30">
                Total (100)
              </th>
              <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30">
                Grade
              </th>
              <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30">
                Comment
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-royal-gold-500/10">
            {results.map((result, idx) => (
              <tr
                key={idx}
                className="hover:bg-royal-gold-50 transition-colors"
              >
                <td className="px-8 py-5">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    {subjects.find((s) => s.id === result.subjectId)?.name || "Unknown"}
                  </p>
                </td>
                <td className="px-6 py-5 text-center text-sm font-bold text-gray-600">
                  {result.caScore}
                </td>
                <td className="px-6 py-5 text-center text-sm font-bold text-gray-600">
                  {result.examScore}
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="text-md font-black text-royal-purple-900">
                    {result.totalScore}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-black border-2 ${
                      result.grade === "A1"
                        ? "bg-royal-gold-500 text-white border-royal-gold-600 shadow-md"
                        : "bg-royal-purple-50 text-royal-purple-600 border-royal-purple-200"
                    }`}
                  >
                    {result.grade}
                  </span>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                    {result.comment}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Behavioral and Psychomotor Sections */}
      <div className="grid grid-cols-2 gap-20 mb-20">
        <div className="space-y-8">
          <h3 
            className="font-black text-royal-purple-900 text-[10px] uppercase tracking-[0.4em] pb-4 border-b-4 border-royal-gold-500/20"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Affective Domain
          </h3>
          <div className="space-y-5">
            {Object.entries(affectiveDomain).map(([key, val]: [string, any]) => (
              <div key={key} className="flex justify-between items-center group bg-royal-gold-50/50 p-3 rounded-2xl border border-transparent hover:border-royal-gold-500/20 transition-all">
                <span className="text-xs text-gray-600 font-black tracking-widest group-hover:text-royal-purple-900 transition-colors capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </span>
                {renderRating(val)}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <h3 
            className="font-black text-royal-purple-900 text-[10px] uppercase tracking-[0.4em] pb-4 border-b-4 border-royal-gold-500/20"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Psychomotor Skills
          </h3>
          <div className="space-y-5">
            {Object.entries(psychomotorSkills).map(([key, val]: [string, any]) => (
              <div key={key} className="flex justify-between items-center group bg-royal-gold-50/50 p-3 rounded-2xl border border-transparent hover:border-royal-gold-500/20 transition-all">
                <span className="text-xs text-gray-600 font-black tracking-widest group-hover:text-royal-purple-900 transition-colors capitalize">
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
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Percentage</p>
          <p className="text-4xl font-black text-emerald-900 tracking-tighter">{formattedAverage}%</p>
        </div>
        <div className="p-8 bg-violet-50/50 rounded-[1.5rem] border-2 border-violet-100/50 text-center">
          <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">
            {child.level === "Secondary" && (child.class.startsWith("SSS") || child.class.startsWith("SS")) 
              ? "Overall Grade" 
              : "Class Position"}
          </p>
          <p className="text-4xl font-black text-violet-900 tracking-tighter">
            {child.level === "Secondary" && (child.class.startsWith("SSS") || child.class.startsWith("SS")) 
              ? (() => {
                  const mean = averageScore;
                  if (mean >= 80) return "A1";
                  if (mean >= 75) return "B2";
                  if (mean >= 70) return "B3";
                  if (mean >= 65) return "C4";
                  if (mean >= 60) return "C5";
                  if (mean >= 55) return "C6";
                  if (mean >= 50) return "D7";
                  if (mean >= 45) return "E8";
                  return "F9";
                })()
              : (classPositionText || "N/A")}
          </p>
        </div>
      </div>

      {/* Narratives */}
      <div className="space-y-8 mb-20">
        <div className="bg-gray-50/50 p-8 rounded-[1.5rem] border-l-8 border-indigo-600">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Class Teacher Evaluation</p>
          <p className="text-gray-900 italic font-bold text-lg leading-relaxed">
            "{finalTeacherComment}"
          </p>
        </div>
        <div className="bg-gray-50/50 p-8 rounded-[1.5rem] border-l-8 border-gray-900">
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">
            {config?.principalName || "Solomon Benjamin"} — Principal's Remarks
          </p>
          <p className="text-gray-900 italic font-bold text-lg leading-relaxed">
            "{finalPrincipalComment}"
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-16 pt-12 mt-4 border-t-4 border-double border-royal-gold-500/40">
        {/* Form Teacher — typed name */}
        <div className="text-center">
          <div className="h-20 mb-2 flex items-end justify-center">
            <span
              className="text-xl font-black text-royal-purple-900 uppercase tracking-tight"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {classTeacher?.name || "Form Teacher"}
            </span>
          </div>
          <div className="h-0.5 bg-royal-gold-500/30 mb-3 w-full" />
          <p 
            className="text-[10px] font-black text-royal-gold-600 uppercase tracking-[0.4em]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Form Teacher
          </p>
        </div>

        {/* Principal — script signature */}
        <div className="text-center relative">
          <div className="h-20 mb-2 flex items-end justify-center overflow-hidden pb-1">
             {/* Stamp Background */}
             <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <div className="w-20 h-20 border-8 border-royal-gold-500 rounded-full flex items-center justify-center">
                   <div className="w-14 h-14 border-2 border-royal-gold-500 rounded-full"></div>
                </div>
             </div>
            <span
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: "3.2rem",
                fontWeight: 400,
                color: "#1a1a1a",
                lineHeight: 0.8,
                display: "inline-block",
                transform: "rotate(-2deg)",
              }}
            >
              {config?.principalName || "Principal"}
            </span>
          </div>
          <div className="h-0.5 bg-royal-gold-500/30 mb-3 w-full" />
          <p 
            className="text-[10px] font-black text-royal-gold-600 uppercase tracking-[0.4em]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            School Principal
          </p>
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