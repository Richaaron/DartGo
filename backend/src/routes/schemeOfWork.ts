import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { supabase } from '../config/supabase';
import { authenticateToken, requireAdmin, requireTeacher } from '../middleware/authSupabase';

const router = Router();
const TABLE_NAME = 'scheme_of_work';

const fallbackSchemes = new Map<string, Record<string, any>>();

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

const getCurrentUserId = (req: Request) => {
  const authReq = req as Request & { user?: Record<string, any> };

  return authReq.user?.id || authReq.user?.userId || authReq.user?.sub || null;
};

const normalizeScheme = (record: Record<string, any> | null) => {
  if (!record) {
    return null;
  }

  return {
    ...record,
    id: record.id ?? record._id,
    teacherId: record.teacherId ?? record.teacher_id ?? record.created_by ?? null,
    approvedBy: record.approvedBy ?? record.approved_by ?? null,
    submittedAt: record.submittedAt ?? record.submitted_at ?? null,
    approvedAt: record.approvedAt ?? record.approved_at ?? null,
  };
};

const getFallbackTopics = (scheme: Record<string, any>) => {
  if (Array.isArray(scheme.topics)) {
    return scheme.topics;
  }

  if (Array.isArray(scheme.weeklyTopics)) {
    return scheme.weeklyTopics;
  }

  if (Array.isArray(scheme.weeks)) {
    return scheme.weeks;
  }

  return [];
};

const setFallbackTopics = (scheme: Record<string, any>, topics: any[]) => {
  if (Array.isArray(scheme.topics)) {
    return { ...scheme, topics };
  }

  if (Array.isArray(scheme.weeklyTopics)) {
    return { ...scheme, weeklyTopics: topics };
  }

  if (Array.isArray(scheme.weeks)) {
    return { ...scheme, weeks: topics };
  }

  return { ...scheme, topics };
};

const getFallbackByTeacher = (teacherId: string) => {
  return Array.from(fallbackSchemes.values())
    .filter((item) => {
      return String(item.teacherId ?? item.teacher_id ?? item.created_by ?? '') === String(teacherId);
    })
    .map((item) => normalizeScheme(item));
};

const createFallbackScheme = (payload: Record<string, any>) => {
  const now = new Date().toISOString();
  const record = {
    id: payload.id ?? uuidv4(),
    status: payload.status ?? 'draft',
    ...payload,
    created_at: payload.created_at ?? now,
    updated_at: now,
  };

  fallbackSchemes.set(String(record.id), record);

  return normalizeScheme(record);
};

const updateFallbackScheme = (id: string, payload: Record<string, any>) => {
  const existing = fallbackSchemes.get(id);

  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...payload,
    id,
    updated_at: new Date().toISOString(),
  };

  fallbackSchemes.set(id, updated);

  return normalizeScheme(updated);
};

router.get('/teacher/:teacherId', authenticateToken, async (req: Request, res: Response) => {
  const { teacherId } = req.params;

  try {
    let { data, error } = await supabase.from(TABLE_NAME).select('*').eq('teacher_id', teacherId);

    if (error && !isTableOrStorageUnavailable(error)) {
      const fallbackData = getFallbackByTeacher(teacherId);

      return res.json(fallbackData);
    }

    if (error) {
      return res.json(getFallbackByTeacher(teacherId));
    }

    if ((!data || data.length === 0) && fallbackSchemes.size > 0) {
      return res.json(getFallbackByTeacher(teacherId));
    }

    return res.json((data || []).map((item) => normalizeScheme(item)));
  } catch (error: any) {
    return res.json(getFallbackByTeacher(teacherId));
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('id', id).maybeSingle();

    if (error) {
      const fallbackRecord = fallbackSchemes.get(id);

      if (!fallbackRecord) {
        return res.status(404).json({ error: 'Scheme of work not found' });
      }

      return res.json(normalizeScheme(fallbackRecord));
    }

    if (!data) {
      const fallbackRecord = fallbackSchemes.get(id);

      if (!fallbackRecord) {
        return res.status(404).json({ error: 'Scheme of work not found' });
      }

      return res.json(normalizeScheme(fallbackRecord));
    }

    return res.json(normalizeScheme(data));
  } catch (error: any) {
    const fallbackRecord = fallbackSchemes.get(id);

    if (!fallbackRecord) {
      return res.status(404).json({ error: 'Scheme of work not found' });
    }

    return res.json(normalizeScheme(fallbackRecord));
  }
});

router.post('/', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  const teacherId = req.body?.teacherId ?? req.body?.teacher_id ?? getCurrentUserId(req);
  const payload = {
    ...req.body,
    teacherId,
    teacher_id: teacherId,
    status: req.body?.status ?? 'draft',
  };

  try {
    const { data, error } = await supabase.from(TABLE_NAME).insert(payload).select().single();

    if (error) {
      const created = createFallbackScheme(payload);

      return res.status(201).json(created);
    }

    return res.status(201).json(normalizeScheme(data));
  } catch (error: any) {
    const created = createFallbackScheme(payload);

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
      const updated = updateFallbackScheme(id, payload);

      if (!updated) {
        return res.status(404).json({ error: 'Scheme of work not found' });
      }

      return res.json(updated);
    }

    if (!data) {
      const updated = updateFallbackScheme(id, payload);

      if (!updated) {
        return res.status(404).json({ error: 'Scheme of work not found' });
      }

      return res.json(updated);
    }

    return res.json(normalizeScheme(data));
  } catch (error: any) {
    const updated = updateFallbackScheme(id, payload);

    if (!updated) {
      return res.status(404).json({ error: 'Scheme of work not found' });
    }

    return res.json(updated);
  }
});

router.put('/:id/submit', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = {
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from(TABLE_NAME).update(payload).eq('id', id).select().maybeSingle();

    if (error) {
      const updated = updateFallbackScheme(id, payload);

      if (!updated) {
        return res.status(404).json({ error: 'Scheme of work not found' });
      }

      return res.json(updated);
    }

    if (!data) {
      const updated = updateFallbackScheme(id, payload);

      if (!updated) {
        return res.status(404).json({ error: 'Scheme of work not found' });
      }

      return res.json(updated);
    }

    return res.json(normalizeScheme(data));
  } catch (error: any) {
    const updated = updateFallbackScheme(id, payload);

    if (!updated) {
      return res.status(404).json({ error: 'Scheme of work not found' });
    }

    return res.json(updated);
  }
});

router.put('/:id/approve', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const approverId = req.body?.approvedBy ?? req.body?.approved_by ?? getCurrentUserId(req);
  const approvedAt = new Date().toISOString();
  const payload = {
    status: 'approved',
    approvedBy: approverId,
    approved_by: approverId,
    approvedAt,
    approved_at: approvedAt,
  };

  try {
    const { data, error } = await supabase.from(TABLE_NAME).update(payload).eq('id', id).select().maybeSingle();

    if (error) {
      const updated = updateFallbackScheme(id, payload);

      if (!updated) {
        return res.status(404).json({ error: 'Scheme of work not found' });
      }

      return res.json(updated);
    }

    if (!data) {
      const updated = updateFallbackScheme(id, payload);

      if (!updated) {
        return res.status(404).json({ error: 'Scheme of work not found' });
      }

      return res.json(updated);
    }

    return res.json(normalizeScheme(data));
  } catch (error: any) {
    const updated = updateFallbackScheme(id, payload);

    if (!updated) {
      return res.status(404).json({ error: 'Scheme of work not found' });
    }

    return res.json(updated);
  }
});

router.put('/:schemeId/topic/:weekNumber', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  const { schemeId, weekNumber } = req.params;
  const weekNumberValue = Number(weekNumber);

  try {
    const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('id', schemeId).maybeSingle();

    if (!error && data) {
      const topics = getFallbackTopics(data);
      const index = topics.findIndex((item: any) => Number(item?.weekNumber ?? item?.week ?? item?.week_number) === weekNumberValue);
      const nextTopic = {
        ...(index >= 0 ? topics[index] : {}),
        ...req.body,
        weekNumber: req.body?.weekNumber ?? weekNumberValue,
      };
      const nextTopics = index >= 0 ? [...topics.slice(0, index), nextTopic, ...topics.slice(index + 1)] : [...topics, nextTopic];
      const updatePayload = {
        topics: nextTopics,
        weeklyTopics: nextTopics,
        updated_at: new Date().toISOString(),
      };
      const updateResponse = await supabase.from(TABLE_NAME).update(updatePayload).eq('id', schemeId).select().maybeSingle();

      if (!updateResponse.error && updateResponse.data) {
        return res.json(normalizeScheme(updateResponse.data));
      }
    }

    const fallbackRecord = fallbackSchemes.get(schemeId);

    if (!fallbackRecord) {
      return res.status(404).json({ error: 'Scheme of work not found' });
    }

    const topics = getFallbackTopics(fallbackRecord);
    const index = topics.findIndex((item: any) => Number(item?.weekNumber ?? item?.week ?? item?.week_number) === weekNumberValue);
    const nextTopic = {
      ...(index >= 0 ? topics[index] : {}),
      ...req.body,
      weekNumber: req.body?.weekNumber ?? weekNumberValue,
    };
    const nextTopics = index >= 0 ? [...topics.slice(0, index), nextTopic, ...topics.slice(index + 1)] : [...topics, nextTopic];
    const updated = setFallbackTopics(fallbackRecord, nextTopics);

    fallbackSchemes.set(schemeId, {
      ...updated,
      id: schemeId,
      updated_at: new Date().toISOString(),
    });

    return res.json(normalizeScheme(fallbackSchemes.get(schemeId) || updated));
  } catch (error: any) {
    const fallbackRecord = fallbackSchemes.get(schemeId);

    if (!fallbackRecord) {
      return res.status(404).json({ error: 'Scheme of work not found' });
    }

    const topics = getFallbackTopics(fallbackRecord);
    const index = topics.findIndex((item: any) => Number(item?.weekNumber ?? item?.week ?? item?.week_number) === weekNumberValue);
    const nextTopic = {
      ...(index >= 0 ? topics[index] : {}),
      ...req.body,
      weekNumber: req.body?.weekNumber ?? weekNumberValue,
    };
    const nextTopics = index >= 0 ? [...topics.slice(0, index), nextTopic, ...topics.slice(index + 1)] : [...topics, nextTopic];
    const updated = setFallbackTopics(fallbackRecord, nextTopics);

    fallbackSchemes.set(schemeId, {
      ...updated,
      id: schemeId,
      updated_at: new Date().toISOString(),
    });

    return res.json(normalizeScheme(fallbackSchemes.get(schemeId) || updated));
  }
});

router.delete('/:id', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from(TABLE_NAME).delete().eq('id', id).select().maybeSingle();

    if (error) {
      const existed = fallbackSchemes.delete(id);

      if (!existed) {
        return res.status(404).json({ error: 'Scheme of work not found' });
      }

      return res.json({ message: 'Scheme of work deleted' });
    }

    if (!data) {
      const existed = fallbackSchemes.delete(id);

      if (!existed) {
        return res.status(404).json({ error: 'Scheme of work not found' });
      }
    }

    return res.json({ message: 'Scheme of work deleted' });
  } catch (error: any) {
    const existed = fallbackSchemes.delete(id);

    if (!existed) {
      return res.status(404).json({ error: 'Scheme of work not found' });
    }

    return res.json({ message: 'Scheme of work deleted' });
  }
});

export default router;