import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { supabase } from '../config/supabase';
import { authenticateToken, requireAdmin, requireTeacher } from '../middleware/authSupabase';

const router = Router();
const TABLE_NAME = 'curriculum';

const fallbackCurriculum = new Map<string, Record<string, any>>();

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

const normalizeCurriculum = (record: Record<string, any> | null) => {
  if (!record) {
    return null;
  }

  return {
    ...record,
    id: record.id ?? record._id,
  };
};

const getFallbackList = (level?: string, status?: string) => {
  return Array.from(fallbackCurriculum.values())
    .filter((item) => {
      if (level && item.level !== level) {
        return false;
      }

      if (status && item.status !== status) {
        return false;
      }

      return true;
    })
    .map((item) => normalizeCurriculum(item));
};

const createFallbackRecord = (payload: Record<string, any>) => {
  const now = new Date().toISOString();
  const record = {
    id: payload.id ?? uuidv4(),
    status: payload.status ?? 'active',
    ...payload,
    created_at: payload.created_at ?? now,
    updated_at: now,
  };

  fallbackCurriculum.set(String(record.id), record);

  return normalizeCurriculum(record);
};

const updateFallbackRecord = (id: string, payload: Record<string, any>) => {
  const existing = fallbackCurriculum.get(id);

  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...payload,
    id,
    updated_at: new Date().toISOString(),
  };

  fallbackCurriculum.set(id, updated);

  return normalizeCurriculum(updated);
};

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { level, status } = req.query;

  try {
    let query = supabase.from(TABLE_NAME).select('*');

    if (typeof level === 'string' && level) {
      query = query.eq('level', level);
    }

    if (typeof status === 'string' && status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      if (isTableOrStorageUnavailable(error)) {
        return res.json(getFallbackList(typeof level === 'string' ? level : undefined, typeof status === 'string' ? status : undefined));
      }

      return res.status(500).json({ error: error.message || 'Failed to fetch curriculum' });
    }

    return res.json((data || []).map((item) => normalizeCurriculum(item)));
  } catch (error: any) {
    return res.json(getFallbackList(typeof level === 'string' ? level : undefined, typeof status === 'string' ? status : undefined));
  }
});

router.get('/level/:level', authenticateToken, async (req: Request, res: Response) => {
  const { level } = req.params;

  try {
    const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('level', level);

    if (error) {
      if (isTableOrStorageUnavailable(error)) {
        return res.json(getFallbackList(level));
      }

      return res.status(500).json({ error: error.message || 'Failed to fetch curriculum' });
    }

    return res.json((data || []).map((item) => normalizeCurriculum(item)));
  } catch (error: any) {
    return res.json(getFallbackList(level));
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('id', id).maybeSingle();

    if (error) {
      if (isTableOrStorageUnavailable(error)) {
        const fallbackRecord = fallbackCurriculum.get(id);

        if (!fallbackRecord) {
          return res.status(404).json({ error: 'Curriculum not found' });
        }

        return res.json(normalizeCurriculum(fallbackRecord));
      }

      return res.status(500).json({ error: error.message || 'Failed to fetch curriculum' });
    }

    if (!data) {
      const fallbackRecord = fallbackCurriculum.get(id);

      if (!fallbackRecord) {
        return res.status(404).json({ error: 'Curriculum not found' });
      }

      return res.json(normalizeCurriculum(fallbackRecord));
    }

    return res.json(normalizeCurriculum(data));
  } catch (error: any) {
    const fallbackRecord = fallbackCurriculum.get(id);

    if (!fallbackRecord) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    return res.json(normalizeCurriculum(fallbackRecord));
  }
});

router.post('/', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    status: req.body?.status ?? 'active',
  };

  try {
    const { data, error } = await supabase.from(TABLE_NAME).insert(payload).select().single();

    if (error) {
      const created = createFallbackRecord(payload);

      return res.status(201).json(created);
    }

    return res.status(201).json(normalizeCurriculum(data));
  } catch (error: any) {
    const created = createFallbackRecord(payload);

    return res.status(201).json(created);
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
      const updated = updateFallbackRecord(id, payload);

      if (!updated) {
        return res.status(404).json({ error: 'Curriculum not found' });
      }

      return res.json(updated);
    }

    if (!data) {
      const updated = updateFallbackRecord(id, payload);

      if (!updated) {
        return res.status(404).json({ error: 'Curriculum not found' });
      }

      return res.json(updated);
    }

    return res.json(normalizeCurriculum(data));
  } catch (error: any) {
    const updated = updateFallbackRecord(id, payload);

    if (!updated) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    return res.json(updated);
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from(TABLE_NAME).delete().eq('id', id).select().maybeSingle();

    if (error) {
      const existed = fallbackCurriculum.delete(id);

      if (!existed) {
        return res.status(404).json({ error: 'Curriculum not found' });
      }

      return res.json({ message: 'Curriculum deleted' });
    }

    if (!data) {
      const existed = fallbackCurriculum.delete(id);

      if (!existed) {
        return res.status(404).json({ error: 'Curriculum not found' });
      }
    }

    return res.json({ message: 'Curriculum deleted' });
  } catch (error: any) {
    const existed = fallbackCurriculum.delete(id);

    if (!existed) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    return res.json({ message: 'Curriculum deleted' });
  }
});

export default router;