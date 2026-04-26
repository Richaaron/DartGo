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
    () => [...new Set(students.map((s) => s.class))],
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
        console.error("Failed to load students:", error);
        setMessage({
          type: "error",
          text: "Failed to load student data, using sample data",
        });
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
      : students.filter((s: Student) => s.class === selectedClass);
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
    } catch (error) {
      console.error("Failed to save attendance:", error);
      setMessage({ type: "error", text: "Failed to save attendance" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading attendance data...</p>
        <p className="mt-2 text-sm text-gray-500">{debugInfo}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Attendance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Mark and manage student attendance
          </p>
          {usingSampleData && (
            <p className="text-sm text-orange-600 font-medium mt-2">
              Using sample data for testing. Add real students to enable saving.
            </p>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={handleSave}
            disabled={isSaving || usingSampleData}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {isSaving
              ? "Saving..."
              : usingSampleData
                ? "Sample Data (No Save)"
                : "Save Attendance"}
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {usingSampleData && (
        <div className="mb-6 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
          <AlertCircle size={20} className="inline mr-2" />
          <p className="font-medium">Sample Data Mode</p>
          <p className="text-sm mt-1">
            No students found in the database. Using sample students for
            testing. Add real students through the Students section to enable
            attendance saving.
          </p>
        </div>
      )}

      <div className="card-lg mb-8">
        <div className="flex gap-4 mb-6">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          >
            <option value="All">All Classes</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Student
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Registration
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b dark:border-gray-700">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {student.firstName} {student.lastName}
                        {usingSampleData && (
                          <span className="ml-2 text-xs text-orange-600">
                            (Sample)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {student.class}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                    {student.registrationNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleStatusChange(student.id, "Present")
                        }
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                          attendanceRecords[student.id]?.status === "Present"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        <Check size={16} />
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, "Absent")}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                          attendanceRecords[student.id]?.status === "Absent"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        <XCircle size={16} />
                        Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, "Late")}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                          attendanceRecords[student.id]?.status === "Late"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        <Clock size={16} />
                        Late
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={attendanceRecords[student.id]?.remarks || ""}
                      onChange={(e) =>
                        handleRemarksChange(student.id, e.target.value)
                      }
                      placeholder="Add remarks..."
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">No students found for this class.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
