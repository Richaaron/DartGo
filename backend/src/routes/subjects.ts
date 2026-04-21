import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, requireAdmin } from '../middleware/authSupabase';

const router = express.Router();

const cleanUndefined = (value: { [key: string]: unknown }) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

const mapSubjectFromDb = (row: any) => ({
  id: row.id,
  _id: row.id,
  name: row.name,
  code: row.code,
  description: row.description,
  class: row.class_name ?? row.class,
  className: row.class_name ?? row.className,
  teacherId: row.teacher_id ?? row.teacherId,
  status:
    row.status ??
    (row.is_active === false ? 'inactive' : row.is_active === true ? 'active' : undefined),
  isActive: row.is_active ?? row.isActive,
  createdAt: row.created_at ?? row.createdAt,
  updatedAt: row.updated_at ?? row.updatedAt,
});

const mapSubjectToDb = (payload: { [key: string]: any }) =>
  cleanUndefined({
    name: payload.name,
    code: payload.code,
    description: payload.description,
    class_name: payload.class ?? payload.className ?? payload.class_name,
    teacher_id: payload.teacherId ?? payload.teacher_id,
    status: payload.status,
    is_active:
      payload.isActive !== undefined
        ? payload.isActive
        : payload.status === 'inactive'
          ? false
          : payload.status === 'active'
            ? true
            : undefined,
  });

const isActiveSubject = (row: any) => {
  if (row.status !== undefined && row.status !== null) {
    return String(row.status).toLowerCase() === 'active';
  }

  if (row.is_active !== undefined && row.is_active !== null) {
    return Boolean(row.is_active);
  }

  return true;
};

router.use(authenticateToken);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('subjects').select('*').order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to fetch subjects' });
    }

    return res.json((data || []).filter(isActiveSubject).map(mapSubjectFromDb));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('subjects').select('*').eq('id', req.params.id).maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to fetch subject' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    return res.json(mapSubjectFromDb(data));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = mapSubjectToDb(req.body || {});

    const { data, error } = await supabase.from('subjects').insert(payload).select('*').single();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to create subject' });
    }

    return res.status(201).json(mapSubjectFromDb(data));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create subject' });
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = mapSubjectToDb(req.body || {});

    const { data, error } = await supabase
      .from('subjects')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to update subject' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    return res.json(mapSubjectFromDb(data));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update subject' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to delete subject' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    return res.json({ message: 'Subject deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete subject' });
  }
});

export default router;