import { Request, Response, Router } from 'express';

import { supabase } from '../config/supabase';
import { authenticateToken } from '../middleware/authSupabase';

const router = Router();

const countTable = async (table: string, filter?: (query: any) => any) => {
  try {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });

    if (filter) {
      query = filter(query);
    }

    const { count, error } = await query;

    if (error) {
      return 0;
    }

    return count || 0;
  } catch (error: any) {
    return 0;
  }
};

const getClassDistribution = async () => {
  try {
    const { data, error } = await supabase.from('students').select('class_name');

    if (error || !data) {
      return [];
    }

    const distribution = new Map<string, number>();

    data.forEach((item: Record<string, any>) => {
      const className = String(item.class_name || 'Unassigned');

      distribution.set(className, (distribution.get(className) || 0) + 1);
    });

    return Array.from(distribution.entries()).map(([className, count]) => ({
      className,
      count,
    }));
  } catch (error: any) {
    return [];
  }
};

const buildOverview = async () => {
  const [students, subjects, results, teachers, admins, classDistribution] = await Promise.all([
    countTable('students'),
    countTable('subjects'),
    countTable('results'),
    countTable('users', (query) => query.eq('role', 'Teacher')),
    countTable('users', (query) => query.eq('role', 'Admin')),
    getClassDistribution(),
  ]);

  return {
    students,
    subjects,
    results,
    teachers,
    admins,
    attendanceRecords: 0,
    observations: 0,
    classDistribution,
    generatedAt: new Date().toISOString(),
  };
};

const sendOverview = async (res: Response) => {
  const overview = await buildOverview();

  return res.json(overview);
};

router.get('/', authenticateToken, async (_req: Request, res: Response) => {
  return sendOverview(res);
});

router.get('/dashboard', authenticateToken, async (_req: Request, res: Response) => {
  return sendOverview(res);
});

router.get('/summary', authenticateToken, async (_req: Request, res: Response) => {
  return sendOverview(res);
});

router.get('/overview', authenticateToken, async (_req: Request, res: Response) => {
  return sendOverview(res);
});

export default router;