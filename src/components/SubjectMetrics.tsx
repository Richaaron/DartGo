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
} from 'recharts'
import { Student, SubjectResult, Subject } from '../types'
import { BarChart3, PieChart as PieChartIcon, Activity, AlertTriangle } from 'lucide-react'

interface SubjectMetricsProps {
  students: Student[]
  results: SubjectResult[]
  subjects: Subject[]
  selectedClass: string
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#64748b'];
const GRADE_COLORS: Record<string, string> = {
  'A': '#10b981', 
  'B': '#34d399', 
  'C': '#6366f1',
  'D': '#f59e0b', 
  'E': '#f97316',
  'F': '#ef4444',
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No result data available for this selection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alert for Lagging Subjects */}
      {laggingSubjects.length > 0 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-rose-600 shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">Attention Required</h3>
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">
              Low pass rate (under 50%) in: {laggingSubjects.map(s => s.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Performance Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Subject Pass Rates</h3>
              <p className="text-xs text-slate-500">Percentage of students who passed (50%+)</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformanceData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 p-4 shadow-xl rounded-lg border border-slate-200 dark:border-slate-800">
                          <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">{data.name}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Pass Rate:</span>
                              <span className={`text-xs font-bold ${data.passRate < 50 ? 'text-rose-600' : 'text-emerald-600'}`}>{data.passRate}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Avg Score:</span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{data.average}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="passRate" 
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                >
                  {subjectPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.passRate < 50 ? '#f43f5e' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
              <PieChartIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Grade Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of student grades across the class.</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 p-2 shadow-lg rounded-lg border border-slate-200 dark:border-slate-800">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Grade {payload[0].name}: {payload[0].value} Students
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
                  formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase">Grade {value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Range Histogram */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Score Ranges</h3>
              <p className="text-xs text-slate-500">Number of students in each score bracket.</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreRangeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ 
                     borderRadius: '12px', 
                     border: '1px solid #e2e8f0', 
                     boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                     padding: '12px'
                   }}
                   labelStyle={{ 
                     fontSize: '10px', 
                     fontWeight: 700, 
                     textTransform: 'uppercase', 
                     color: '#64748b',
                     marginBottom: '4px'
                   }}
                />
                <Bar dataKey="count" name="Students" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
