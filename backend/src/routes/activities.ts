import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { supabase } from '../config/supabase';
import { authenticateToken, requireTeacher } from '../middleware/authSupabase';

const router = Router();
const TABLE_NAME = 'activities';

const fallbackActivities = new Map<string, Record<string, any>>();

const getCurrentUserId = (req: Request) => {
  const authReq = req as Request & { user?: Record<string, any> };

  return authReq.user?.id || authReq.user?.userId || authReq.user?.sub || null;
};

const isTableOrStorageUnavailable = (error: any): boolean => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '');

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  );
};

const normalizeActivity = (record: Record<string, any> | null) => {
  if (!record) {
    return null;
  }

  return {
    ...record,
    id: record.id ?? record._id,
    userId: record.userId ?? record.user_id ?? null,
    createdAt: record.createdAt ?? record.created_at ?? null,
    updatedAt: record.updatedAt ?? record.updated_at ?? null,
  };
};

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { userId, type } = req.query;

  try {
    let query = supabase.from(TABLE_NAME).select('*');

    if (typeof userId === 'string' && userId) {
      query = query.eq('user_id', userId);
    }

    if (typeof type === 'string' && type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      if (isTableOrStorageUnavailable(error)) {
        const fallback = Array.from(fallbackActivities.values())
          .filter((item) => {
            if (typeof userId === 'string' && String(item.userId ?? item.user_id ?? '') !== userId) {
              return false;
            }

            if (typeof type === 'string' && String(item.type ?? '') !== type) {
              return false;
            }

            return true;
          })
          .map((item) => normalizeActivity(item));

        return res.json(fallback);
      }

      return res.status(500).json({ error: error.message || 'Failed to fetch activities' });
    }

    return res.json((data || []).map((item) => normalizeActivity(item)));
  } catch (error: any) {
    const fallback = Array.from(fallbackActivities.values())
      .filter((item) => {
        if (typeof userId === 'string' && String(item.userId ?? item.user_id ?? '') !== userId) {
          return false;
        }

        if (typeof type === 'string' && String(item.type ?? '') !== type) {
          return false;
        }

        return true;
      })
      .map((item) => normalizeActivity(item));

    return res.json(fallback);
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('id', id).maybeSingle();

    if (error) {
      const fallback = fallbackActivities.get(id);

      if (!fallback) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      return res.json(normalizeActivity(fallback));
    }

    if (!data) {
      const fallback = fallbackActivities.get(id);

      if (!fallback) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      return res.json(normalizeActivity(fallback));
    }

    return res.json(normalizeActivity(data));
  } catch (error: any) {
    const fallback = fallbackActivities.get(id);

    if (!fallback) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    return res.json(normalizeActivity(fallback));
  }
});

router.post('/', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  const now = new Date().toISOString();
  const userId = req.body?.userId ?? req.body?.user_id ?? getCurrentUserId(req);
  const payload = {
    ...req.body,
    userId,
    user_id: userId,
    created_at: req.body?.created_at ?? now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase.from(TABLE_NAME).insert(payload).select().single();

    if (error) {
      const record = {
        id: payload.id ?? uuidv4(),
        ...payload,
      };

      fallbackActivities.set(String(record.id), record);

      return res.status(201).json(normalizeActivity(record));
    }

    return res.status(201).json(normalizeActivity(data));
  } catch (error: any) {
    const record = {
      id: payload.id ?? uuidv4(),
      ...payload,
    };

    fallbackActivities.set(String(record.id), record);

    return res.status(201).json(normalizeActivity(record));
  }
});

router.put('/:id', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = {
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from(TABLE_NAME).update(payload).eq('id', id).select().maybeSingle();

    if (error) {
      const existing = fallbackActivities.get(id);

      if (!existing) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      const updated = {
        ...existing,
        ...payload,
        id,
      };

      fallbackActivities.set(id, updated);

      return res.json(normalizeActivity(updated));
    }

    if (!data) {
      const existing = fallbackActivities.get(id);

      if (!existing) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      const updated = {
        ...existing,
        ...payload,
        id,
      };

      fallbackActivities.set(id, updated);

      return res.json(normalizeActivity(updated));
    }

    return res.json(normalizeActivity(data));
  } catch (error: any) {
    const existing = fallbackActivities.get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const updated = {
      ...existing,
      ...payload,
      id,
    };

    fallbackActivities.set(id, updated);

    return res.json(normalizeActivity(updated));
  }
});

router.delete('/:id', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from(TABLE_NAME).delete().eq('id', id).select().maybeSingle();

    if (error) {
      const deleted = fallbackActivities.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      return res.json({ message: 'Activity deleted' });
    }

    if (!data) {
      const deleted = fallbackActivities.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Activity not found' });
      }
    }

    return res.json({ message: 'Activity deleted' });
  } catch (error: any) {
    const deleted = fallbackActivities.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    return res.json({ message: 'Activity deleted' });
  }
});

export default router;