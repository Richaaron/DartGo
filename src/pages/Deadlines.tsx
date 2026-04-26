import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    } catch (error) {
      console.error("Failed to load deadlines:", error);
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
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Timer className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Deadlines{" "}
              <span className="text-amber-600 dark:text-amber-400">
                Manager
              </span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Set and track important deadlines for your teachers.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Create Deadline
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deadlines.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/40 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Clock className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                No Active Deadlines
              </p>
            </div>
          ) : (
            deadlines.map((deadline) => (
              <motion.div
                key={deadline.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-lg group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(deadline)}`}
                  >
                    {new Date(deadline.deadline_date) < new Date()
                      ? "EXPIRED"
                      : deadline.status}
                  </div>
                  <button
                    onClick={() => handleDelete(deadline.id)}
                    className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                  {deadline.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">
                  {deadline.description}
                </p>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Calendar size={14} />
                    <span>Ends: {formatDate(deadline.deadline_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-500">
                    <AlertCircle size={14} />
                    <span>Type: {deadline.type.replace("_", " ")}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100 dark:border-gray-800"
            >
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">
                Create Deadline
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Deadline Title
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. 1st Term Result Entry"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Description
                  </label>
                  <textarea
                    className="input-field h-24 resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Provide details for teachers..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="input-field"
                      value={formData.deadline_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deadline_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Category
                    </label>
                    <select
                      className="input-field"
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
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
