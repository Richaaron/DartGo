import bcrypt from 'bcryptjs';
import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, requireAdmin } from '../middleware/authSupabase';

const router = express.Router();

const cleanUndefined = (value: { [key: string]: unknown }) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

const buildTeacherName = (row: any) => {
  if (row.name) {
    return row.name;
  }

  if (row.full_name) {
    return row.full_name;
  }

  const parts = [row.first_name, row.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
};

const mapTeacherFromDb = (row: any) => ({
  id: row.id,
  _id: row.id,
  name: buildTeacherName(row),
  firstName: row.first_name ?? row.firstName,
  lastName: row.last_name ?? row.lastName,
  email: row.email,
  phone: row.phone ?? row.phone_number ?? row.phoneNumber,
  qualification: row.qualification,
  department: row.department,
  employeeNumber: row.employee_number ?? row.employeeNumber,
  subjects: row.subjects,
  classes: row.classes ?? row.class_names ?? row.classNames,
  role: row.role,
  status:
    row.status ??
    (row.is_active === false ? 'inactive' : row.is_active === true ? 'active' : undefined),
  isActive: row.is_active ?? row.isActive,
  createdAt: row.created_at ?? row.createdAt,
  updatedAt: row.updated_at ?? row.updatedAt,
});

const mapTeacherToDb = async (payload: { [key: string]: any }) => {
  const data = cleanUndefined({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    role: 'Teacher',
    is_active:
      payload.isActive !== undefined
        ? payload.isActive
        : payload.status === 'inactive'
          ? false
          : payload.status === 'active'
            ? true
            : undefined,
  });

  if (payload.password) {
    data.password_hash = await bcrypt.hash(payload.password, 10);
  }

  return data;
};

const findTeacherById = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .or('role.eq.Teacher,role.eq.teacher')
    .maybeSingle();

  return { data, error };
};

router.use(authenticateToken);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or('role.eq.Teacher,role.eq.teacher')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to fetch teachers' });
    }

    return res.json((data || []).map(mapTeacherFromDb));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await findTeacherById(req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to fetch teacher' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    return res.json(mapTeacherFromDb(data));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const payload = await mapTeacherToDb(req.body || {});

    const { data, error } = await supabase.from('users').insert(payload).select('*').single();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to create teacher' });
    }

    return res.status(201).json(mapTeacherFromDb(data));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create teacher' });
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const existingTeacher = await findTeacherById(req.params.id);

    if (existingTeacher.error) {
      return res.status(500).json({ error: existingTeacher.error.message || 'Failed to update teacher' });
    }

    if (!existingTeacher.data) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const payload = await mapTeacherToDb(req.body || {});

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to update teacher' });
    }

    return res.json(mapTeacherFromDb(data));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update teacher' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const existingTeacher = await findTeacherById(req.params.id);

    if (existingTeacher.error) {
      return res.status(500).json({ error: existingTeacher.error.message || 'Failed to delete teacher' });
    }

    if (!existingTeacher.data) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const { error } = await supabase.from('users').delete().eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to delete teacher' });
    }

    return res.json({ message: 'Teacher deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

export default router;