import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Search,
  RefreshCw,
  Filter,
  Mail,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { activityService, Activity } from "../services/activityService";
import api from "../services/api";

// Map raw HTTP action strings to human-readable labels
function humanizeAction(action: string): { label: string; category: string } {
  if (!action || typeof action !== "string") {
    return { label: "Unknown Action", category: "other" };
  }
  const parts = action.trim().split(" ");
  const method = parts[0];
  const url = parts[1] || "";
  const path = url.replace("/api/", "");
  const segments = path.split("/");
  const resource = segments[0] ?? "";
  const sub = segments[1] ?? "";

  const labels: Record<string, string> = {
    students: "Student",
    teachers: "Teacher",
    results: "Result",
    attendance: "Attendance",
    subjects: "Subject",
    observations: "Observation",
    "student-subjects": "Subject Assignment",
    deadlines: "Deadline",
  };

  const label = labels[resource] || resource;

  let text = "";
  if (method === "POST") {
    if (sub === "bulk") text = `Submitted Bulk ${label}s`;
    else if (sub === "upload") text = `Uploaded ${label}`;
    else if (sub === "submit") text = `Submitted ${label}`;
    else text = `Added ${label}`;
  } else if (method === "PUT" || method === "PATCH") {
    if (sub === "submit") text = `Submitted ${label}`;
    else text = `Updated ${label}`;
  } else if (method === "DELETE") {
    text = `Deleted ${label}`;
  } else {
    text = `${method} ${label}`;
  }

  const category =
    resource === "results"
      ? "results"
      : resource === "attendance"
        ? "attendance"
        : resource === "students"
          ? "students"
          : "other";

  return { label: text, category };
}

function getActionBadgeStyle(action: string): string {
  if (action.startsWith("DELETE"))
    return "bg-folusho-coral-50 text-folusho-coral-500 border-folusho-coral-100";
  if (action.startsWith("POST"))
    return "bg-folusho-sage-50 text-folusho-sage-600 border-folusho-sage-100";
  if (action.startsWith("PUT") || action.startsWith("PATCH"))
    return "bg-folusho-yellow-50 text-folusho-yellow-600 border-folusho-yellow-100";
  return "bg-folusho-cream-50 text-folusho-slate-500 border-folusho-cream-100";
}

function getActionDotColor(action: string): string {
  if (action.startsWith("DELETE")) return "bg-folusho-coral-500";
  if (action.startsWith("POST")) return "bg-folusho-sage-500";
  if (action.startsWith("PUT") || action.startsWith("PATCH"))
    return "bg-folusho-yellow-500";
  return "bg-folusho-slate-300";
}

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "results", label: "Results" },
  { id: "students", label: "Students" },
  { id: "attendance", label: "Attendance" },
  { id: "schemes", label: "Schemes" },
];

export default function TeacherActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sendingDigest, setSendingDigest] = useState(false);
  const [digestSent, setDigestSent] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await activityService.getActivities();
      setActivities(data);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
    const interval = window.setInterval(loadActivities, 30000);
    return () => window.clearInterval(interval);
  }, [loadActivities]);

  const handleSendDigest = async () => {
    setSendingDigest(true);
    try {
      await api.post("/activities/send-digest", {});
      setDigestSent(true);
      setTimeout(() => setDigestSent(false), 4000);
    } catch (err) {
      console.error("Failed to send digest:", err);
    } finally {
      setSendingDigest(false);
    }
  };

  const handleClearLog = async () => {
    if (!window.confirm("Are you sure you want to clear the entire activity log? This action cannot be undone.")) {
      return;
    }

    setClearing(true);
    try {
      await activityService.clearActivities();
      await loadActivities();
    } catch (error) {
      console.error("Failed to clear activity log:", error);
      alert("Failed to clear activity log. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  const filteredActivities = activities.filter((a) => {
    const matchesSearch =
      a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.details.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === "all") return true;

    const { category } = humanizeAction(a.action);
    return category === activeFilter;
  });

  return (
    <div className="bg-white rounded-[2.5rem] shadow-folusho overflow-hidden border border-folusho-cream-200">
      {/* Header */}
      <div className="p-8 border-b border-folusho-cream-100 bg-folusho-cream-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-folusho-sage-500 rounded-2xl shadow-folusho">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-folusho-slate-900 tracking-tight">
                Academic Surveillance
              </h2>
              <p className="text-xs font-bold text-folusho-slate-400 mt-1">
                Real-time tactical log of institutional maneuvers
                {" · "}
                <span className="text-folusho-sage-500 font-black">
                  SYNC: {" "}
                  {lastRefreshed.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Send Digest Button */}
            <button
              onClick={handleSendDigest}
              disabled={sendingDigest || digestSent}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                digestSent
                  ? "bg-folusho-sage-50 text-folusho-sage-600 border border-folusho-sage-100"
                  : "bg-folusho-sage-500 text-white hover:bg-folusho-sage-600 shadow-folusho"
              } disabled:opacity-40`}
            >
              {digestSent ? (
                <>
                  <CheckCircle className="w-4 h-4" /> Sent
                </>
              ) : sendingDigest ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> ...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" /> Dispatch Digest
                </>
              )}
            </button>

            {/* Clear Log Button */}
            <button
              onClick={handleClearLog}
              disabled={clearing || activities.length === 0}
              className="flex items-center gap-3 px-5 py-2.5 bg-folusho-coral-50 text-folusho-coral-500 border border-folusho-coral-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-folusho-coral-100 transition-all disabled:opacity-30"
            >
              {clearing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Purge Log
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadActivities}
              disabled={loading}
              className="p-3 bg-white border border-folusho-cream-200 rounded-2xl hover:bg-folusho-cream-50 transition-all shadow-sm group"
            >
              <RefreshCw
                className={`w-5 h-5 text-folusho-slate-400 group-hover:text-folusho-sage-500 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mt-8 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-folusho-slate-400 group-focus-within:text-folusho-sage-500 transition-colors" />
            <input
              type="text"
              placeholder="Locate specific maneuvers by teacher or action..."
              className="input-folusho !pl-12 !py-3.5 !rounded-2xl shadow-inner !text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 p-1.5 bg-folusho-cream-100 rounded-2xl border border-folusho-cream-200 shadow-inner overflow-x-auto scrollbar-none">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeFilter === tab.id
                    ? "bg-white text-folusho-sage-600 shadow-folusho"
                    : "text-folusho-slate-400 hover:text-folusho-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-folusho-cream-100 border-b border-folusho-cream-100 bg-white">
        {[
          {
            label: "Total Today",
            value: activities.filter(
              (a) =>
                new Date(a.createdAt).toDateString() ===
                new Date().toDateString(),
            ).length,
            color: "text-folusho-slate-900",
          },
          {
            label: "Results Entered",
            value: activities.filter((a) => a.action.includes("results"))
              .length,
            color: "text-folusho-sage-500",
          },
          {
            label: "Deletions",
            value: activities.filter((a) => a.action.startsWith("DELETE"))
              .length,
            color: "text-folusho-coral-500",
          },
        ].map((stat) => (
          <div key={stat.label} className="px-6 py-5 text-center">
            <p className={`text-2xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
            <p className="text-[9px] text-folusho-slate-400 font-black uppercase tracking-[0.2em] mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-folusho-cream-50/50 border-b border-folusho-cream-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                Tactical Unit
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                Operational Action
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                Data Payload
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-folusho-cream-50 bg-white">
            {loading && activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <RefreshCw className="w-10 h-10 text-folusho-sage-500 animate-spin mx-auto mb-6" />
                  <p className="text-xs font-black text-folusho-slate-400 uppercase tracking-widest">
                    Retrieving Institutional Logs...
                  </p>
                </td>
              </tr>
            ) : filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <div className="w-20 h-20 bg-folusho-cream-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-folusho-cream-100 shadow-inner">
                    <Eye className="w-10 h-10 text-folusho-slate-200" />
                  </div>
                  <p className="text-sm font-black text-folusho-slate-900 uppercase tracking-tight">
                    Logs Empty
                  </p>
                  <p className="text-[10px] font-bold text-folusho-slate-400 mt-2 uppercase tracking-widest">
                    Operational silence detected in current filter.
                  </p>
                </td>
              </tr>
            ) : (
              filteredActivities.map((activity) => {
                const { label: actionLabel } = humanizeAction(activity.action);
                const dotColor = getActionDotColor(activity.action);
                const badgeStyle = getActionBadgeStyle(activity.action);

                // Parse details to show a short snippet
                let detailSnippet = activity.details;
                try {
                  const parsed = JSON.parse(activity.details);
                  const HIDDEN = ["password", "image", "token"];
                  const entries = Object.entries(parsed)
                    .filter(([k]) => !HIDDEN.includes(k))
                    .slice(0, 3);
                  detailSnippet = entries
                    .map(([k, v]) => `${k}: ${String(v).substring(0, 40)}`)
                    .join(" · ");
                } catch {
                  /* leave as-is */
                }

                return (
                  <tr
                    key={activity._id}
                    className="hover:bg-folusho-sage-50/20 transition-all group"
                  >
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-folusho-sage-50 border border-folusho-sage-100 rounded-2xl flex items-center justify-center text-folusho-sage-600 font-black text-base shadow-sm">
                            {activity.userName.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${dotColor} rounded-full border-[3px] border-white shadow-sm`}
                          />
                        </div>
                        <div>
                          <p className="text-base font-black text-folusho-slate-900 leading-none">
                            {activity.userName}
                          </p>
                          <p className="text-[10px] font-black text-folusho-slate-400 mt-2 uppercase tracking-widest">
                            {activity.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${badgeStyle} shadow-sm`}
                      >
                        {actionLabel}
                      </span>
                    </td>
                    <td className="px-8 py-6 max-w-sm">
                      <p className="text-xs font-bold text-folusho-slate-500 truncate leading-relaxed">
                        {detailSnippet || "—"}
                      </p>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <p className="text-xs font-black text-folusho-slate-900 uppercase tracking-tighter">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] font-black text-folusho-sage-500 mt-1 uppercase tracking-widest">
                        {new Date(activity.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {activities.length > 0 && (
        <div className="px-8 py-5 bg-folusho-cream-50/50 border-t border-folusho-cream-100 flex items-center justify-between">
          <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">
            Displaying {filteredActivities.length} of {activities.length}{" "}
            Operational Records
          </p>
        </div>
      )}
    </div>
  );
}
