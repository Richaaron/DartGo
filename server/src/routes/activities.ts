import express, { Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { supabase } from "../config/supabase";

const router = express.Router();

// Get all activities — admin only
router.get(
  "/",
  authenticate,
  authorize(["Admin"]),
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const teacherId = req.query.teacher as string | undefined;

      let query = supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (teacherId) {
        query = query.eq("user_id", teacherId);
      }

      const { data, error } = await query;
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activities", error });
    }
  },
);

// Get activities for a specific teacher — admin only
router.get(
  "/teacher/:teacherId",
  authenticate,
  authorize(["Admin"]),
  async (req: Request, res: Response) => {
    try {
      const { teacherId } = req.params;
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", teacherId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activities", error });
    }
  },
);

// Send a digest of today's activities to admin — admin only
router.post(
  "/send-digest",
  authenticate,
  authorize(["Admin"]),
  async (req: Request, res: Response) => {
    try {
      const ADMIN_EMAIL = "folushovictoryschool@gmail.com";

      // Fetch today's activities
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const activities = data || [];

      if (activities.length === 0) {
        return res.json({ message: "No activities today to send in digest." });
      }

      // Group by teacher
      const byTeacher: Record<
        string,
        { name: string; email: string; actions: any[] }
      > = {};
      activities.forEach((a: any) => {
        const id = a.user_id || a.user_name;
        if (!byTeacher[id]) {
          byTeacher[id] = {
            name: a.user_name || "Unknown",
            email: a.user_email || "",
            actions: [],
          };
        }
        byTeacher[id].actions.push(a);
      });

      const teacherSections = Object.values(byTeacher)
        .map(({ name, actions }) => {
          const rows = actions
            .slice(0, 15)
            .map((a: any) => {
              const method = (a.action || "").split(" ")[0];
              const color =
                method === "DELETE"
                  ? "#dc2626"
                  : method === "POST"
                    ? "#16a34a"
                    : "#2563eb";
              const time = new Date(a.created_at).toLocaleTimeString("en-NG", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b;">${time}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">
                <span style="background:${color};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">${method}</span>
              </td>
              <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#1e293b;">${a.entity_type || ""}</td>
            </tr>`;
            })
            .join("");

          return `
          <div style="margin-bottom:24px;">
            <h3 style="margin:0 0 10px;font-size:14px;color:#1e3a8a;border-bottom:2px solid #dbeafe;padding-bottom:6px;">
              👤 ${name} — ${actions.length} action${actions.length !== 1 ? "s" : ""} today
            </h3>
            <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:6px;overflow:hidden;font-size:13px;">
              <thead>
                <tr style="background:#eff6ff;">
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:700;">TIME</th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:700;">TYPE</th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:700;">RESOURCE</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;
        })
        .join("");

      const dateStr = new Date().toLocaleDateString("en-NG", {
        timeZone: "Africa/Lagos",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const html = `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:24px 28px;">
          <h2 style="margin:0;color:white;font-size:20px;">📋 Daily Activity Digest</h2>
          <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">${dateStr} — Folusho Victory Schools</p>
        </div>
        <div style="padding:24px 28px;background:#ffffff;">
          <p style="margin:0 0 20px;color:#475569;font-size:14px;">
            Here is a summary of all teacher activity recorded today. A total of <strong>${activities.length} action${activities.length !== 1 ? "s" : ""}</strong> across <strong>${Object.keys(byTeacher).length} teacher${Object.keys(byTeacher).length !== 1 ? "s" : ""}</strong>.
          </p>
          ${teacherSections}
        </div>
        <div style="background:#1e293b;padding:14px 28px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">Folusho Victory Schools — Activity Digest</p>
        </div>
      </div>
    `;

      const { sendEmail } = await import("../utils/email");
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Daily Activity Digest — ${dateStr}`,
        text: `Daily Activity Digest for ${dateStr}. Total: ${activities.length} actions from ${Object.keys(byTeacher).length} teachers.`,
        html,
      });

      res.json({
        message: `Digest sent successfully to ${ADMIN_EMAIL}`,
        total: activities.length,
      });
    } catch (error) {
      console.error("[DIGEST] Error sending digest:", error);
      res.status(500).json({ message: "Error sending digest email", error });
    }
  },
);

export default router;
