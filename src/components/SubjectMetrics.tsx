import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Area
} from 'recharts'
import { Student, SubjectResult, Subject } from '../types'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, PieChart as PieChartIcon, Activity, AlertTriangle } from 'lucide-react'

interface SubjectMetricsProps {
  students: Student[]
  results: SubjectResult[]
  subjects: Subject[]
  selectedClass: string
}

const COLORS = ['#749f82', '#ff8a71', '#94a3b8', '#e2e8f0', '#f8fafc'];
const GRADE_COLORS: Record<string, string> = {
  'A': '#749f82', // Sage
  'B': '#8fb39a', 
  'C': '#a9c7b3',
  'D': '#ff8a71', // Coral
  'E': '#ffa18d',
  'F': '#ffb9aa',
};

export default function SubjectMetrics({ students, results, subjects, selectedClass }: SubjectMetricsProps) {
  const classResults = useMemo(() => {
    if (selectedClass === 'All') return results;
    const classStudentIds = students
      .filter(s => s.class === selectedClass)
      .map(s => s.id);
    return results.filter(r => classStudentIds.includes(r.studentId));
  }, [results, students, selectedClass]);

  const subjectPerformanceData = useMemo(() => {
    const data: Record<string, { total: number, count: number, passCount: number, name: string }> = {};
    
    classResults.forEach(result => {
      const subject = subjects.find(s => s.id === result.subjectId);
      if (!subject) return;
      
      if (!data[subject.id]) {
        data[subject.id] = { total: 0, count: 0, passCount: 0, name: subject.name };
      }
      
      data[subject.id].total += result.totalScore;
      data[subject.id].count += 1;
      if (result.totalScore >= 50) data[subject.id].passCount += 1;
    });
    
    return Object.values(data).map(d => ({
      name: d.name,
      average: Math.round(d.total / d.count),
      passRate: Math.round((d.passCount / d.count) * 100),
      count: d.count
    })).sort((a, b) => b.average - a.average);
  }, [classResults, subjects]);

  const gradeDistributionData = useMemo(() => {
    const distribution: Record<string, number> = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0 };
    
    classResults.forEach(r => {
      const score = r.totalScore;
      let grade = 'F';
      if (score >= 70) grade = 'A';
      else if (score >= 60) grade = 'B';
      else if (score >= 50) grade = 'C';
      else if (score >= 45) grade = 'D';
      else if (score >= 40) grade = 'E';
      
      distribution[grade]++;
    });
    
    return Object.entries(distribution)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [classResults]);

  const scoreRangeData = useMemo(() => {
    const ranges = [
      { name: '0-39', count: 0 },
      { name: '40-49', count: 0 },
      { name: '50-59', count: 0 },
      { name: '60-69', count: 0 },
      { name: '70-79', count: 0 },
      { name: '80-100', count: 0 },
    ];
    
    classResults.forEach(r => {
      const s = r.totalScore;
      if (s < 40) ranges[0].count++;
      else if (s < 50) ranges[1].count++;
      else if (s < 60) ranges[2].count++;
      else if (s < 70) ranges[3].count++;
      else if (s < 80) ranges[4].count++;
      else ranges[5].count++;
    });
    
    return ranges;
  }, [classResults]);

  const laggingSubjects = useMemo(() => {
    return subjectPerformanceData.filter(s => s.passRate < 50);
  }, [subjectPerformanceData]);

  if (classResults.length === 0) {
    return (
      <div className="folusho-card flex flex-col items-center justify-center py-32 bg-folusho-cream-50/20 border-dashed">
        <div className="p-8 bg-folusho-cream-50 rounded-full w-fit mx-auto mb-8 border border-folusho-cream-100 shadow-inner">
          <Activity className="w-12 h-12 text-folusho-slate-300 opacity-50" />
        </div>
        <p className="text-sm font-black text-folusho-slate-400 uppercase tracking-[0.4em]">No Personnel Intelligence Found</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-folusho-sage-100/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-folusho-coral-100/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Alert for Lagging Subjects */}
      <AnimatePresence>
        {laggingSubjects.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-folusho-coral-50 border border-folusho-coral-200 rounded-[2.5rem] flex items-start gap-6 relative z-10 shadow-sm"
          >
            <div className="p-3 bg-white rounded-2xl text-folusho-coral-500 shadow-sm border border-folusho-coral-100">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-folusho-coral-600 uppercase tracking-[0.4em]">Critical Protocol Alert: Lagging Logic</h3>
              <p className="text-xs font-black text-folusho-slate-600 uppercase tracking-widest mt-2 leading-relaxed">
                The following operational sectors have an efficiency rate below <span className="text-folusho-coral-500">50%</span>: 
                <span className="text-folusho-slate-900 ml-2 bg-white px-3 py-1 rounded-lg border border-folusho-coral-100">
                  {laggingSubjects.map(s => s.name).join(', ')}
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
        {/* Subject Performance Bar Chart */}
        <div className="folusho-card !p-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-folusho-sage-100 rounded-2xl text-folusho-sage-600 border border-folusho-sage-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-folusho-slate-900 leading-none">Sector <br /> <span className="text-folusho-sage-500">Efficiency</span></h3>
              <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1">Pass Rates (%)</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformanceData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-6 shadow-folusho rounded-[2rem] border border-folusho-cream-200 min-w-[240px]">
                          <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-folusho-cream-100 pb-3">{data.name}</p>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">Efficiency:</span>
                              <span className={`text-sm font-black ${data.passRate < 50 ? 'text-folusho-coral-500' : 'text-folusho-sage-600'}`}>{data.passRate}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">Logic Score:</span>
                              <span className="text-sm font-black text-folusho-slate-900">{data.average}%</span>
                            </div>
                            <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest opacity-50 mt-2">{data.count} Personnel Recorded</p>
                          </div>
                        </div>
                      )
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="passRate" 
                  radius={[0, 10, 10, 0]}
                  barSize={16}
                >
                  {subjectPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.passRate < 50 ? '#ff8a71' : '#749f82'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-6 opacity-60">
            * Operational Efficiency threshold: 50% Protocol Fulfillment.
          </p>
        </div>

        {/* Grade Distribution Pie Chart */}
        <div className="folusho-card !p-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-folusho-coral-100 rounded-2xl text-folusho-coral-600 border border-folusho-coral-200">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-folusho-slate-900 leading-none">Grade <br /> <span className="text-folusho-coral-500">Consolidated</span></h3>
              <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1">Institutional Breakdown</p>
            </div>
          </div>
          <div className="h-[350px] w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.name] || COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 shadow-folusho rounded-2xl border border-folusho-cream-200">
                          <p className="text-[10px] font-black text-folusho-slate-900 uppercase tracking-widest">
                            Grade {payload[0].name}: <span className="text-folusho-sage-600">{payload[0].value}</span> Units
                          </p>
                        </div>
                      )
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">Grade {value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-6">
              <p className="text-[10px] font-black text-folusho-slate-300 uppercase tracking-widest italic">Breakdown across all specialized sectors in {selectedClass}</p>
            </div>
          </div>
        </div>

        {/* Score Range Histogram */}
        <div className="folusho-card !p-10 lg:col-span-2">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-folusho-cream-100 rounded-2xl text-folusho-slate-600 border border-folusho-cream-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-folusho-slate-900 leading-none">Logic <br /> <span className="text-folusho-slate-400">Distribution</span></h3>
              <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1">Operational Histogram</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreRangeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ 
                     borderRadius: '2rem', 
                     border: '1px solid #f1f5f9', 
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                     padding: '24px'
                   }}
                   labelStyle={{ 
                     fontSize: '10px', 
                     fontWeight: 900, 
                     textTransform: 'uppercase', 
                     letterSpacing: '0.3em', 
                     color: '#94a3b8',
                     marginBottom: '12px',
                     display: 'block',
                     borderBottom: '1px solid #f1f5f9',
                     paddingBottom: '12px'
                   }}
                   itemStyle={{
                     fontSize: '14px',
                     fontWeight: 900,
                     color: '#749f82'
                   }}
                />
                <Bar dataKey="count" name="Personnel Units" fill="#749f82" radius={[12, 12, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] font-black text-center text-folusho-slate-400 uppercase tracking-[0.4em] mt-8">
            Personnel fulfillment variance across operational sectors.
          </p>
        </div>
      </div>
    </div>
  )
}
