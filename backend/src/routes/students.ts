import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, requireAdmin } from '../middleware/authSupabase';

const router = express.Router();

const cleanUndefined = (value: { [key: string]: unknown }) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

const mapStudentFromDb = (row: any) => ({
  id: row.id,
  _id: row.id,
  name: row.name,
  admissionNumber: row.admission_number ?? row.admissionNumber,
  class: row.class_name ?? row.class,
  className: row.class_name ?? row.className,
  gender: row.gender,
  dateOfBirth: row.date_of_birth ?? row.dateOfBirth,
  parentName: row.parent_name ?? row.parentName,
  parentPhone: row.parent_phone ?? row.parentPhone,
  email: row.parent_email ?? row.email,
  parentEmail: row.parent_email ?? row.parentEmail,
  address: row.address,
  image: row.profile_image ?? row.image,
  profileImage: row.profile_image ?? row.profileImage,
  status: row.status,
  createdAt: row.created_at ?? row.createdAt,
  updatedAt: row.updated_at ?? row.updatedAt,
});

const mapStudentToDb = (payload: { [key: string]: any }) =>
  cleanUndefined({
    name: payload.name,
    admission_number: payload.admissionNumber ?? payload.admission_number,
    class_name: payload.class ?? payload.className ?? payload.class_name,
    gender: payload.gender,
    date_of_birth: payload.dateOfBirth ?? payload.date_of_birth,
    parent_name: payload.parentName ?? payload.parent_name,
    parent_phone: payload.parentPhone ?? payload.parent_phone,
    parent_email: payload.email ?? payload.parentEmail ?? payload.parent_email,
    address: payload.address,
    profile_image: payload.image ?? payload.profileImage ?? payload.profile_image,
    status: payload.status,
  });

router.use(authenticateToken);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('students').select('*').order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to fetch students' });
    }

    return res.json((data || []).map(mapStudentFromDb));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('students').select('*').eq('id', req.params.id).maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to fetch student' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.json(mapStudentFromDb(data));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch student' });
  }
});

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = mapStudentToDb(req.body || {});

    const { data, error } = await supabase.from('students').insert(payload).select('*').single();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to create student' });
    }

    return res.status(201).json(mapStudentFromDb(data));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create student' });
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = mapStudentToDb(req.body || {});

    const { data, error } = await supabase
      .from('students')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to update student' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.json(mapStudentFromDb(data));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update student' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to delete student' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.json({ message: 'Student deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete student' });
  }
});

export default router;