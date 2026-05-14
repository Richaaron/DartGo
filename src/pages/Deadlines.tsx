import { useState, useEffect } from "react";

import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Timer,
} from "lucide-react";
import {
  fetchDeadlines,
  createDeadline,
  updateDeadline,
  deleteDeadline,
} from "../services/api";
import { formatDate } from "../utils/calculations";

export default function Deadlines() {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline_date: "",
    type: "RESULT_ENTRY",
  });

  useEffect(() => {
    loadDeadlines();
  }, []);

  const loadDeadlines = async () => {
    try {
      const data = await fetchDeadlines();
      setDeadlines(data);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Failed to load deadlines:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDeadline(formData);
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        deadline_date: "",
        type: "RESULT_ENTRY",
      });
      loadDeadlines();
    } catch (error) {
      window.alert("Failed to create deadline");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this deadline?")) {
      try {
        await deleteDeadline(id);
        loadDeadlines();
      } catch (error) {
        window.alert("Failed to delete deadline");
      }
    }
  };

  const getStatusColor = (deadline: any) => {
    if (deadline.status === "COMPLETED")
      return "text-emerald-500 bg-emerald-50 border-emerald-100";
    const isExpired = new Date(deadline.deadline_date) < new Date();
    if (isExpired) return "text-rose-500 bg-rose-50 border-rose-100";
    return "text-amber-500 bg-amber-50 border-amber-100";
  };

  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Schedules
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Deadlines & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">Timeline.</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold max-w-xl leading-relaxed tracking-tight">
            Manage institutional deadlines and schedules for the school.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} />
          Create Deadline
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-40">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {deadlines.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-40 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
              <Clock className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-6" />
              <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">
                No Deadlines Scheduled
              </p>
            </div>
          ) : (
            deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl group hover:border-indigo-500/50 transition-all border border-slate-200 dark:border-slate-800 shadow-lg"
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      new Date(deadline.deadline_date) < new Date()
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : deadline.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    }`}
                  >
                    {new Date(deadline.deadline_date) < new Date()
                      ? "Expired"
                      : deadline.status}
                  </div>
                  <button
                    onClick={() => handleDelete(deadline.id)}
                    className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:text-rose-600 hover:bg-rose-500/20 transition-all border border-rose-500/10 shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase">
                  {deadline.title}
                </h3>
                <p className="text-sm font-bold text-slate-500 mb-8 line-clamp-3 leading-relaxed">
                  {deadline.description}
                </p>

                <div className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Due: {formatDate(deadline.deadline_date)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    <AlertCircle size={14} />
                    <span>Type: {deadline.type.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-8">
            <div
              className="bg-white dark:bg-slate-900 max-w-xl w-full !p-0 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl"
            >
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                  New <br /> <span className="text-indigo-600 dark:text-indigo-400">Deadline</span>
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-6">Create a new schedule</p>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. 1st Term Result Entry"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
                    Description
                  </label>
                  <textarea
                    className="input h-32 resize-none !bg-slate-50 dark:!bg-slate-950/50"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Provide details..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="input !py-4 !bg-slate-50 dark:!bg-slate-950/50"
                      value={formData.deadline_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deadline_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
                      Type
                    </label>
                    <select
                      className="input !py-4 !bg-slate-50 dark:!bg-slate-950/50"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      <option value="RESULT_ENTRY">Result Entry</option>
                      <option value="SCHEME_OF_WORK">Scheme of Work</option>
                      <option value="ATTENDANCE">Attendance</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-6 pt-8">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">
                    Create Deadline
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
