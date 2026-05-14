import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  fetchStudents,
  saveBulkAttendance,
  fetchAttendance,
} from "../services/api";
import { Student } from "../types";

// Sample students for testing when no students exist in database
const SAMPLE_STUDENTS: Student[] = [
  {
    id: "sample-1",
    firstName: "John",
    lastName: "Doe",
    registrationNumber: "REG001",
    class: "Primary 1",
    gender: "Male",
    dateOfBirth: new Date("2015-01-01"),
    parentName: "Parent 1",
    parentPhone: "08012345678",
    parentEmail: "parent1@example.com",
    address: "Sample Address 1",
    enrollmentDate: new Date("2023-01-01"),
    isActive: true,
  },
  {
    id: "sample-2",
    firstName: "Jane",
    lastName: "Smith",
    registrationNumber: "REG002",
    class: "Primary 1",
    gender: "Female",
    dateOfBirth: new Date("2015-02-01"),
    parentName: "Parent 2",
    parentPhone: "08087654321",
    parentEmail: "parent2@example.com",
    address: "Sample Address 2",
    enrollmentDate: new Date("2023-01-01"),
    isActive: true,
  },
  {
    id: "sample-3",
    firstName: "Mike",
    lastName: "Johnson",
    registrationNumber: "REG003",
    class: "Primary 2",
    gender: "Male",
    dateOfBirth: new Date("2014-03-01"),
    parentName: "Parent 3",
    parentPhone: "08011223344",
    parentEmail: "parent3@example.com",
    address: "Sample Address 3",
    enrollmentDate: new Date("2023-01-01"),
    isActive: true,
  },
];

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: string; remarks: string }>
  >({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedClass, setSelectedClass] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [debugInfo, setDebugInfo] = useState("");
  const [usingSampleData, setUsingSampleData] = useState(false);

  const classes = useMemo(
    () => [...new Set(students.filter(Boolean).map((s) => s.class))],
    [students],
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setDebugInfo("Starting to load data...");

      try {
        // Fetch students first
        setDebugInfo("Fetching students...");
        const studentsData = await fetchStudents().catch(() => []);
        const safeStudentsData = Array.isArray(studentsData)
          ? studentsData
          : [];

        if (safeStudentsData.length === 0) {
          setDebugInfo(
            "No students found in database, using sample data for testing",
          );
          setStudents(SAMPLE_STUDENTS);
          setUsingSampleData(true);
        } else {
          setStudents(safeStudentsData);
          setUsingSampleData(false);
          setDebugInfo(
            `Loaded ${safeStudentsData.length} students from database`,
          );
        }

        // Then fetch attendance for the selected date
        try {
          setDebugInfo("Fetching attendance data...");
          const existingAttendance = await fetchAttendance({
            date: selectedDate,
          }).catch(() => []);
          const safeExistingAttendance = Array.isArray(existingAttendance)
            ? existingAttendance
            : [];

          const records: Record<string, { status: string; remarks: string }> =
            {};
          const currentStudents = usingSampleData
            ? SAMPLE_STUDENTS
            : safeStudentsData;
          currentStudents.forEach((s: Student) => {
            if (!s) return;
            const existing = safeExistingAttendance.find(
              (a: any) =>
                a && (a.studentId?._id === s.id || a.studentId === s.id),
            );
            records[s.id] = existing
              ? { status: existing.status, remarks: existing.remarks || "" }
              : { status: "Present", remarks: "" };
          });
          setAttendanceRecords(records);
          setDebugInfo(
            `Attendance records created for ${Object.keys(records).length} students`,
          );
        } catch (attendanceError) {
          console.warn(
            "Failed to fetch attendance, setting default:",
            attendanceError,
          );
          setDebugInfo("Attendance fetch failed, setting default records");
          // Set default attendance records
          const records: Record<string, { status: string; remarks: string }> =
            {};
          const currentStudents = usingSampleData
            ? SAMPLE_STUDENTS
            : studentsData;
          currentStudents.forEach((s: Student) => {
            records[s.id] = { status: "Present", remarks: "" };
          });
          setAttendanceRecords(records);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Failed to load students:", error);
          setMessage({
            type: "error",
            text: "Failed to load student data, using sample data",
          });
        }
        setDebugInfo(
          `Error loading students: ${error.message}, using sample data`,
        );
        // Use sample data as fallback
        setStudents(SAMPLE_STUDENTS);
        setUsingSampleData(true);

        // Set default attendance records
        const records: Record<string, { status: string; remarks: string }> = {};
        SAMPLE_STUDENTS.forEach((s: Student) => {
          records[s.id] = { status: "Present", remarks: "" };
        });
        setAttendanceRecords(records);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedDate]);

  const filteredStudents = useMemo(() => {
    return selectedClass === "All"
      ? students
      : students.filter((s: Student) => s && s.class === selectedClass);
  }, [students, selectedClass]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  const handleSave = async () => {
    if (usingSampleData) {
      setMessage({
        type: "error",
        text: "Cannot save sample data. Please add real students to the database first.",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return;
    }

    setIsSaving(true);
    try {
      const attendanceData = Object.entries(attendanceRecords).map(
        ([studentId, record]) => ({
          studentId,
          date: selectedDate,
          status: record.status,
          remarks: record.remarks,
        }),
      );

      await saveBulkAttendance(attendanceData);
      setMessage({ type: "success", text: "Attendance saved successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Failed to save attendance:", error);
        setMessage({ type: "error", text: "Failed to save attendance" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center py-40">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600 mx-auto"></div>
        <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">Loading attendance records...</p>
        <p className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{debugInfo}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Attendance Log
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Presence <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">Monitoring.</span>
          </h1>
          <p className="text-slate-500 text-base font-bold max-w-xl leading-relaxed tracking-tight">
            Record student attendance for each class.
          </p>
          {usingSampleData && (
            <div className="flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase tracking-widest bg-rose-500/10 p-2.5 px-6 rounded-full border border-rose-500/20 w-fit shadow-sm">
              <AlertCircle size={14} /> Demo Data Active
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input !py-4 !px-8 w-fit bg-slate-900 border-white/5"
          />
          <button
            onClick={handleSave}
            disabled={isSaving || usingSampleData}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
          >
            <Save size={20} />
            {isSaving
              ? "Saving..."
              : usingSampleData
                ? "View Only"
                : "Save Attendance"}
          </button>
        </div>
      </div>

      {message.text && (
        <div 
          className={`p-6 rounded-4xl flex items-center gap-5 border ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-bold tracking-tight">{message.text}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-lg space-y-12">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-200 dark:border-white/5">
            <Calendar className="ml-4 text-indigo-600" size={20} />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-[0.3em] py-3 pr-10 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-white dark:bg-slate-900">All Classes</option>
              {classes.map((cls) => (
                <option key={cls} value={cls} className="bg-white dark:bg-slate-900">
                  Class {cls}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
            Tracking {filteredStudents.length} Students
          </div>
        </div>

        <div className="overflow-hidden rounded-4xl border border-slate-200 dark:border-white/5">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="text-left py-8 px-12 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em]">Student</th>
                <th className="text-left py-8 px-12 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em]">Reg Number</th>
                <th className="text-left py-8 px-12 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em]">Status</th>
                <th className="text-left py-8 px-12 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-8 px-12">
                    <div>
                      <div className="font-black text-slate-900 dark:text-white text-xl tracking-tight">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        Class {student.class}
                      </div>
                    </div>
                  </td>
                  <td className="py-8 px-12 text-indigo-600 dark:text-indigo-400 font-mono text-base font-black">
                    {student.registrationNumber}
                  </td>
                  <td className="py-8 px-12">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStatusChange(student.id, "Present")}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border ${
                          attendanceRecords[student.id]?.status === "Present"
                            ? "bg-emerald-500 text-white border-emerald-400 shadow-lg"
                            : "bg-slate-50 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/5 hover:border-emerald-500/50"
                        }`}
                      >
                        <Check size={14} /> Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, "Absent")}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border ${
                          attendanceRecords[student.id]?.status === "Absent"
                            ? "bg-rose-500 text-white border-rose-400 shadow-lg"
                            : "bg-slate-50 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/5 hover:border-rose-500/50"
                        }`}
                      >
                        <XCircle size={14} /> Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, "Late")}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border ${
                          attendanceRecords[student.id]?.status === "Late"
                            ? "bg-amber-500 text-white border-amber-400 shadow-lg"
                            : "bg-slate-50 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/5 hover:border-amber-500/50"
                        }`}
                      >
                        <Clock size={14} /> Late
                      </button>
                    </div>
                  </td>
                  <td className="py-8 px-12">
                    <input
                      type="text"
                      value={attendanceRecords[student.id]?.remarks || ""}
                      onChange={(e) =>
                        handleRemarksChange(student.id, e.target.value)
                      }
                      placeholder="Add remarks..."
                      className="input !py-4 !px-6 !text-xs !rounded-2xl !bg-slate-50 dark:!bg-slate-950/50 border-slate-200 dark:border-white/5"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="text-center py-32 bg-transparent">
              <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">No students found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
