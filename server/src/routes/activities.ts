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
    return res.json({ message: "Activity digest emails have been disabled." });
  },
);

// Clear all activities — admin only
router.delete(
  "/",
  authenticate,
  authorize(["Admin"]),
  async (req: Request, res: Response) => {
    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Hack to delete all since .delete() requires a filter

      if (error) throw error;
      res.json({ message: "Activity log cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error clearing activities", error });
    }
  },
);

export default router;
