import { Request, Response, Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, requireTeacher } from '../middleware/authSupabase';

const router = Router();

type AttendanceRow = Record<string, any>;

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
    message.includes('attendance') &&
      (message.includes('not exist') ||
        message.includes('could not find') ||
        message.includes('schema cache') ||
        message.includes('column'))
  );
};

const mapAttendanceRow = (row: AttendanceRow) => {
  const id = row.id ?? row._id ?? null;

  return {
    ...row,
    id,
    _id: id,
    studentId: row.student_id ?? row.studentId ?? '',
    date: row.date ?? '',
    status: row.status ?? '',
    remarks: row.remarks ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
};

const mapAttendancePayload = (record: AttendanceRow, defaultDate?: string) => {
  const payload: AttendanceRow = {
    ...record,
    student_id: record.studentId ?? record.student_id,
    date: record.date ?? defaultDate,
    status: record.status,
    remarks: record.remarks ?? null,
  };

  delete payload.id;
  delete payload._id;
  delete payload.studentId;
  delete payload.createdAt;
  delete payload.updatedAt;

  return payload;
};

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { studentId, date, startDate, endDate } = req.query;

    let query = supabase.from('attendance').select('*').order('date', { ascending: false });

    if (typeof studentId === 'string' && studentId.trim()) {
      query = query.eq('student_id', studentId.trim());
    }

    if (typeof date === 'string' && date.trim()) {
      query = query.eq('date', date.trim());
    }

    if (typeof startDate === 'string' && startDate.trim()) {
      query = query.gte('date', startDate.trim());
    }

    if (typeof endDate === 'string' && endDate.trim()) {
      query = query.lte('date', endDate.trim());
    }

    const { data, error } = await query;

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return res.json([]);
      }

      return res.status(500).json({ error: error.message || 'Failed to fetch attendance records' });
    }

    return res.json((data || []).map(mapAttendanceRow));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

router.post('/bulk', requireTeacher, async (req: Request, res: Response) => {
  try {
    const { date, records } = req.body || {};

    if (typeof date !== 'string' || !date.trim()) {
      return res.status(400).json({ error: 'date is required' });
    }

    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'records must be an array' });
    }

    const normalizedRecords = records
      .map((record: AttendanceRow) => mapAttendancePayload(record, date.trim()))
      .filter((record: AttendanceRow) => typeof record.student_id === 'string' && record.student_id.trim());

    if (normalizedRecords.length === 0) {
      return res.status(400).json({ error: 'At least one valid attendance record is required' });
    }

    const studentIds = normalizedRecords.map((record: AttendanceRow) => record.student_id);

    const deleteResponse = await supabase
      .from('attendance')
      .delete()
      .eq('date', date.trim())
      .in('student_id', studentIds);

    if (deleteResponse.error && !isSchemaUnavailableError(deleteResponse.error)) {
      return res.status(500).json({
        error: deleteResponse.error.message || 'Failed to prepare attendance records for saving',
      });
    }

    if (deleteResponse.error && isSchemaUnavailableError(deleteResponse.error)) {
      return res.status(503).json({ error: 'Attendance storage is not configured' });
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert(normalizedRecords)
      .select('*');

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return res.status(503).json({ error: 'Attendance storage is not configured' });
      }

      return res.status(500).json({ error: error.message || 'Failed to save attendance records' });
    }

    return res.json((data || []).map(mapAttendanceRow));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save attendance records' });
  }
});

export default router;