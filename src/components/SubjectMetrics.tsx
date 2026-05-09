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
import { motion } from 'framer-motion'
import { BarChart3, PieChart as PieChartIcon, Activity, AlertTriangle } from 'lucide-react'

interface SubjectMetricsProps {
  students: Student[]
  results: SubjectResult[]
  subjects: Subject[]
  selectedClass: string
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const GRADE_COLORS: Record<string, string> = {
  'A': '#10b981',
  'B': '#3b82f6',
  'C': '#6366f1',
  'D': '#f59e0b',
  'E': '#f97316',
  'F': '#ef4444',
};

export default function SubjectMetrics({ students, results, subjects, selectedClass }: SubjectMetricsProps) {
  // Filter students by class if a class is selected
  const classStudents = useMemo(() => {
    if (selectedClass === 'All') return students;
    return students.filter(s => s.class === selectedClass);
  }, [students, selectedClass]);

  const classStudentIds = useMemo(() => new Set(classStudents.map(s => s.id)), [classStudents]);

  // Filter results for these students
  const classResults = useMemo(() => {
    return results.filter(r => classStudentIds.has(r.studentId));
  }, [results, classStudentIds]);

  // 1. Bar Chart: Pass Rate per Subject
  const subjectPerformanceData = useMemo(() => {
    const subjectMap: Record<string, { total: number, count: number, passed: number, name: string }> = {};
    
    classResults.forEach(r => {
      const subject = subjects.find(s => s.id === r.subjectId);
      const subjectName = subject?.name || 'Unknown';
      
      if (!subjectMap[r.subjectId]) {
        subjectMap[r.subjectId] = { total: 0, count: 0, passed: 0, name: subjectName };
      }
      subjectMap[r.subjectId].total += r.percentage;
      subjectMap[r.subjectId].count += 1;
      if (r.percentage >= 50) {
        subjectMap[r.subjectId].passed += 1;
      }
    });

    return Object.entries(subjectMap).map(([id, data]) => ({
      name: data.name,
      average: Math.round(data.total / data.count),
      passRate: Math.round((data.passed / data.count) * 100),
      count: data.count
    })).sort((a, b) => a.passRate - b.passRate); // Sort by pass rate ascending to show lagging subjects first
  }, [classResults, subjects]);

  // 2. Pie Chart: Overall Grade Distribution
  const gradeDistributionData = useMemo(() => {
    const grades: Record<string, number> = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0 };
    
    classResults.forEach(r => {
      if (grades[r.grade] !== undefined) {
        grades[r.grade]++;
      }
    });

    return Object.entries(grades)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [classResults]);

  // 3. Histogram: Score Range Distribution
  const scoreRangeData = useMemo(() => {
    const ranges = [
      { name: '0-39', min: 0, max: 39, count: 0 },
      { name: '40-49', min: 40, max: 49, count: 0 },
      { name: '50-59', min: 50, max: 59, count: 0 },
      { name: '60-69', min: 60, max: 69, count: 0 },
      { name: '70-100', min: 70, max: 100, count: 0 },
    ];

    classResults.forEach(r => {
      const range = ranges.find(range => r.percentage >= range.min && r.percentage <= range.max);
      if (range) range.count++;
    });

    return ranges;
  }, [classResults]);

  // Identify lagging subjects (average < 50)
  const laggingSubjects = useMemo(() => {
    return subjectPerformanceData.filter(s => s.average < 50);
  }, [subjectPerformanceData]);

  if (classResults.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No result data available for the selected class to generate metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert for Lagging Subjects */}
      {laggingSubjects.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Lagging Subjects Detected</h3>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
              The following subjects have an average score below 50%: 
              <span className="font-bold ml-1">
                {laggingSubjects.map(s => s.name).join(', ')}
              </span>
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-800 dark:text-white">Subject Pass Rates (%)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformanceData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-900 p-3 shadow-xl rounded-lg border border-gray-100 dark:border-gray-800">
                          <p className="text-xs font-bold text-gray-500 mb-2 border-b pb-1">{data.name}</p>
                          <div className="space-y-1">
                            <p className="text-sm flex justify-between gap-4">
                              <span className="text-gray-400">Pass Rate:</span>
                              <span className="font-black text-emerald-600">{data.passRate}%</span>
                            </p>
                            <p className="text-sm flex justify-between gap-4">
                              <span className="text-gray-400">Avg Score:</span>
                              <span className="font-black text-indigo-600">{data.average}%</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2">{data.count} students recorded</p>
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
                  barSize={20}
                >
                  {subjectPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.passRate < 50 ? '#ef4444' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-gray-400 mt-4 italic">
            * Pass Rate is the percentage of students who scored 50% or above.
          </p>
        </div>

        {/* Grade Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-800 dark:text-white">Overall Grade Distribution</h3>
          </div>
          <div className="h-[300px] w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-500 italic">Breakdown of all grades across all subjects in {selectedClass}</p>
            </div>
          </div>
        </div>

        {/* Score Range Histogram */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-800 dark:text-white">Performance Distribution (Histogram)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreRangeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                   cursor={{ fill: '#f3f4f6' }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" name="Number of Students" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-gray-500 mt-4">
            Shows how many students fall into each performance bracket across all subjects.
          </p>
        </div>
      </div>
    </div>
  )
}
