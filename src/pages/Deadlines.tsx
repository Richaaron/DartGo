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
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-folusho-sage-500/10 border border-white/5 text-folusho-sage-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Chronos Protocol
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Temporal <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">Governance.</span>
          </h1>
          <p className="text-folusho-slate-500 text-base font-bold max-w-xl leading-relaxed tracking-tight">
            Manage institutional deadlines and temporal synchronizations for the Folusho citadel.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="btn-vibrant bg-folusho-sage-400 shadow-folusho"
        >
          <Plus size={20} />
          Initialize Deadline
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-40">
          <div className="w-12 h-12 border-4 border-folusho-sage-500/20 border-t-folusho-sage-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {deadlines.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-40 folusho-card border-dashed border-white/5 bg-white/5">
              <Clock className="w-16 h-16 text-folusho-slate-700 mb-6" />
              <p className="text-folusho-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">
                Zero Temporal Constraints Detected
              </p>
            </div>
          ) : (
            deadlines.map((deadline) => (
              <motion.div
                key={deadline.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="folusho-card group hover:border-folusho-sage-500/50 transition-all border-white/5 shadow-2xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      new Date(deadline.deadline_date) < new Date()
                        ? "bg-folusho-coral-500/10 text-folusho-coral-400 border-folusho-coral-500/20"
                        : deadline.status === "COMPLETED"
                        ? "bg-folusho-sage-500/10 text-folusho-sage-400 border-folusho-sage-500/20"
                        : "bg-folusho-yellow-500/10 text-folusho-yellow-400 border-folusho-yellow-500/20"
                    }`}
                  >
                    {new Date(deadline.deadline_date) < new Date()
                      ? "Expired"
                      : deadline.status}
                  </div>
                  <button
                    onClick={() => handleDelete(deadline.id)}
                    className="p-3 rounded-2xl bg-folusho-coral-500/10 text-folusho-coral-400 hover:text-folusho-coral-300 hover:bg-folusho-coral-500/20 transition-all border border-white/5 shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight group-hover:text-folusho-sage-400 transition-colors uppercase">
                  {deadline.title}
                </h3>
                <p className="text-sm font-bold text-folusho-slate-400 mb-8 line-clamp-3 leading-relaxed">
                  {deadline.description}
                </p>

                <div className="space-y-4 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3 text-[10px] font-black text-folusho-slate-500 uppercase tracking-widest">
                    <Calendar size={14} className="text-folusho-sage-400" />
                    <span>Terminus: {formatDate(deadline.deadline_date)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black text-folusho-yellow-500 uppercase tracking-widest">
                    <AlertCircle size={14} />
                    <span>Protocol: {deadline.type.replace("_", " ")}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="folusho-card max-w-xl w-full !p-0 overflow-hidden border-white/5 shadow-2xl bg-folusho-slate-900"
            >
              <div className="p-10 border-b border-white/5 bg-white/5">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                  Timeline <br /> <span className="text-folusho-sage-400">Injection</span>
                </h2>
                <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.4em] mt-6">Establish temporal constraint</p>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] px-2">
                    Constraint Identification
                  </label>
                  <input
                    type="text"
                    required
                    className="input-folusho !py-5 !bg-folusho-slate-950/50"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. 1st Term Result Entry"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] px-2">
                    Logistical Overview
                  </label>
                  <textarea
                    className="input-folusho h-32 resize-none !bg-folusho-slate-950/50"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Provide details for units..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] px-2">
                      Termination Date
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="input-folusho !py-4 !bg-folusho-slate-950/50"
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
                    <label className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] px-2">
                      Constraint Category
                    </label>
                    <select
                      className="input-folusho !py-4 !bg-folusho-slate-950/50"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      <option value="RESULT_ENTRY" className="bg-folusho-slate-900">Result Entry</option>
                      <option value="SCHEME_OF_WORK" className="bg-folusho-slate-900">Scheme of Work</option>
                      <option value="ATTENDANCE" className="bg-folusho-slate-900">Attendance</option>
                      <option value="OTHER" className="bg-folusho-slate-900">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-6 pt-8">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 btn-vibrant bg-white/5 !text-folusho-slate-400 border border-white/5 hover:border-folusho-coral-500/30 shadow-sm"
                  >
                    Abort
                  </button>
                  <button type="submit" className="flex-1 btn-vibrant bg-folusho-sage-400 shadow-folusho">
                    Execute
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
