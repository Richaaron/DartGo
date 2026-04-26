import { Response, NextFunction } from "express";
import { supabase } from "../config/supabase";

export const activityLogger = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  if (req.user && req.method !== "GET") {
    try {
      const action = `${req.method} ${req.originalUrl}`;
      const rawDetails = JSON.stringify(req.body);

      // Strip sensitive fields before storing
      const HIDDEN_KEYS = [
        "password",
        "image",
        "token",
        "Authorization",
        "confirmPassword",
      ];
      let cleanDetails = rawDetails;
      try {
        const parsed = JSON.parse(rawDetails);
        HIDDEN_KEYS.forEach((k) => {
          delete parsed[k];
        });
        cleanDetails = JSON.stringify(parsed);
      } catch {
        /* leave as-is */
      }

      const details =
        cleanDetails.length > 500
          ? cleanDetails.substring(0, 500) + "..."
          : cleanDetails;

      // Infer entity type and id from URL
      const urlParts = req.originalUrl.split("/");
      const entityType = urlParts[2] || "unknown";
      const entityId = urlParts[3] || "none";

      // Save to Supabase activities table
      await supabase.from("activities").insert({
        user_id: req.user.id || req.user.email,
        user_name: req.user.name || req.user.email,
        role: req.user.role,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      });

      // Send real-time email alert to admin for any Teacher action
      if (req.user.role === "Teacher") {
        // Fire-and-forget — does not block the request
        setImmediate(async () => {
          try {
            const { sendTeacherActivityAlertEmail } =
              await import("../utils/email");
            await sendTeacherActivityAlertEmail(
              req.user.name || req.user.email,
              req.user.email,
              action,
              details,
              new Date().toISOString(),
            );
          } catch (emailErr) {
            console.error("[ACTIVITY] Failed to send alert email:", emailErr);
          }
        });
      }
    } catch (error) {
      console.error("[ACTIVITY] Error logging activity:", error);
    }
  }
  next();
};
