import { Request, Response, Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, requireTeacher } from '../middleware/authSupabase';

const router = Router();

type ObservationRow = Record<string, any>;

const isSchemaUnavailableError = (error: any): boolean => {
  if (!error) {
    return false;
  }

  const errorCode = error.code || error?.details?.code;
  const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();

  return (
    errorCode === '42P01' ||
    errorCode === '42703' ||
    errorCode === 'PGRST204' ||
    errorCode === 'PGRST205' ||
    message.includes('observation') &&
      (message.includes('not exist') ||
        message.includes('could not find') ||
        message.includes('schema cache') ||
        message.includes('column'))
  );
};

const mapObservationRow = (row: ObservationRow) => {
  const id = row.id ?? row._id ?? null;

  return {
    ...row,
    id,
    _id: id,
    studentId: row.student_id ?? row.studentId ?? '',
    teacherId: row.teacher_id ?? row.teacherId ?? null,
    academicYear: row.academic_year ?? row.academicYear ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
};

const mapObservationPayload = (payload: ObservationRow) => {
  const mappedPayload: ObservationRow = {
    ...payload,
    student_id: payload.studentId ?? payload.student_id,
    teacher_id: payload.teacherId ?? payload.teacher_id,
    academic_year: payload.academicYear ?? payload.academic_year,
    created_at: payload.createdAt ?? payload.created_at,
    updated_at: payload.updatedAt ?? payload.updated_at,
  };

  delete mappedPayload.id;
  delete mappedPayload._id;
  delete mappedPayload.studentId;
  delete mappedPayload.teacherId;
  delete mappedPayload.academicYear;
  delete mappedPayload.createdAt;
  delete mappedPayload.updatedAt;

  return mappedPayload;
};

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { studentId, term, academicYear } = req.query;

    let query = supabase.from('observations').select('*').order('created_at', { ascending: false });

    if (typeof studentId === 'string' && studentId.trim()) {
      query = query.eq('student_id', studentId.trim());
    }

    if (typeof term === 'string' && term.trim()) {
      query = query.eq('term', term.trim());
    }

    if (typeof academicYear === 'string' && academicYear.trim()) {
      query = query.eq('academic_year', academicYear.trim());
    }

    const { data, error } = await query;

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return res.json([]);
      }

      return res.status(500).json({ error: error.message || 'Failed to fetch observations' });
    }

    return res.json((data || []).map(mapObservationRow));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch observations' });
  }
});

router.post('/', requireTeacher, async (req: Request, res: Response) => {
  try {
    const payload = mapObservationPayload(req.body || {});

    if (!payload.student_id || typeof payload.student_id !== 'string') {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const { data, error } = await supabase.from('observations').insert(payload).select('*').single();

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return res.status(503).json({ error: 'Observations storage is not configured' });
      }

      return res.status(500).json({ error: error.message || 'Failed to save observation' });
    }

    return res.status(201).json(mapObservationRow(data));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save observation' });
  }
});

router.put('/:id', requireTeacher, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = mapObservationPayload(req.body || {});
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('observations')
      .update(payload)
      .eq('id', id)
      .select('*');

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return res.status(503).json({ error: 'Observations storage is not configured' });
      }

      return res.status(500).json({ error: error.message || 'Failed to update observation' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Observation not found' });
    }

    return res.json(mapObservationRow(data[0]));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update observation' });
  }
});

router.delete('/:id', requireTeacher, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await supabase.from('observations').select('id').eq('id', id).maybeSingle();

    if (existing.error) {
      if (isSchemaUnavailableError(existing.error)) {
        return res.status(503).json({ error: 'Observations storage is not configured' });
      }

      return res.status(500).json({ error: existing.error.message || 'Failed to delete observation' });
    }

    if (!existing.data) {
      return res.status(404).json({ error: 'Observation not found' });
    }

    const { error } = await supabase.from('observations').delete().eq('id', id);

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return res.status(503).json({ error: 'Observations storage is not configured' });
      }

      return res.status(500).json({ error: error.message || 'Failed to delete observation' });
    }

    return res.json({ message: 'Observation deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete observation' });
  }
});

export default router;