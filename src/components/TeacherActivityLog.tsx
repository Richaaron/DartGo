import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Search,
  RefreshCw,
  Filter,
  Mail,
  CheckCircle,
} from "lucide-react";
import { activityService, Activity } from "../services/activityService";
import api from "../services/api";

// Map raw HTTP action strings to human-readable labels
function humanizeAction(action: string): { label: string; category: string } {
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
    "scheme-of-work": "Scheme of Work",
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
          : resource === "scheme-of-work"
            ? "schemes"
            : "other";

  return { label: text, category };
}

function getActionBadgeStyle(action: string): string {
  if (action.startsWith("DELETE"))
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (action.startsWith("POST"))
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (action.startsWith("PUT") || action.startsWith("PATCH"))
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
}

function getActionDotColor(action: string): string {
  if (action.startsWith("DELETE")) return "bg-red-500";
  if (action.startsWith("POST")) return "bg-green-500";
  if (action.startsWith("PUT") || action.startsWith("PATCH"))
    return "bg-blue-500";
  return "bg-gray-400";
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
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                Teacher Activity Monitor
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Real-time log of all teacher actions — auto-refreshes every 30s
                {" · "}
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  Last updated{" "}
                  {lastRefreshed.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Send Digest Button */}
            <button
              onClick={handleSendDigest}
              disabled={sendingDigest || digestSent}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                digestSent
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              } disabled:opacity-60`}
              title="Send today's activity summary to the admin email"
            >
              {digestSent ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" /> Digest Sent!
                </>
              ) : sendingDigest ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" /> Send Digest
                </>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadActivities}
              disabled={loading}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by teacher name, action or details..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white dark:placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
        {[
          {
            label: "Total Today",
            value: activities.filter(
              (a) =>
                new Date(a.createdAt).toDateString() ===
                new Date().toDateString(),
            ).length,
            color: "text-gray-900 dark:text-white",
          },
          {
            label: "Results Entered",
            value: activities.filter((a) => a.action.includes("results"))
              .length,
            color: "text-green-600",
          },
          {
            label: "Deletions",
            value: activities.filter((a) => a.action.startsWith("DELETE"))
              .length,
            color: "text-red-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="px-4 py-3 text-center">
            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Teacher
              </th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Action
              </th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Details
              </th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center">
                  <RefreshCw className="w-6 h-6 border-blue-600 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    Loading activity log...
                  </p>
                </td>
              </tr>
            ) : filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center">
                  <Eye className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">
                    No activity found
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Teacher actions will appear here as they happen.
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
                    className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors group"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-black text-sm">
                            {activity.userName.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${dotColor} rounded-full border-2 border-white dark:border-gray-900`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                            {activity.userName}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">
                            {activity.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeStyle}`}
                      >
                        {actionLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {detailSnippet || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
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
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            Showing {filteredActivities.length} of {activities.length}{" "}
            activities
          </p>
          <p className="text-[10px] text-gray-400 italic">
            All teacher actions are emailed to folushovictoryschool@gmail.com in
            real time
          </p>
        </div>
      )}
    </div>
  );
}
