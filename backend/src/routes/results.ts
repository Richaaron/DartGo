import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, requireTeacher } from '../middleware/authSupabase';

const router = express.Router();

const cleanUndefined = (value: { [key: string]: unknown }) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

const toNumber = (value: any) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const computeTotal = (payload: { [key: string]: any }) => {
  const scores = [
    toNumber(payload.ca1 ?? payload.firstCa ?? payload.first_ca),
    toNumber(payload.ca2 ?? payload.secondCa ?? payload.second_ca),
    toNumber(payload.exam ?? payload.examScore ?? payload.exam_score),
  ].filter((score) => score !== undefined) as number[];

  return scores.length ? scores.reduce((sum, score) => sum + score, 0) : undefined;
};

const mapResultToDb = (payload: { [key: string]: any }) =>
  cleanUndefined({
    student_id: payload.studentId ?? payload.student_id,
    subject_id: payload.subjectId ?? payload.subject_id,
    term: payload.term,
    academic_year: payload.academicYear ?? payload.academic_year,
    ca1: toNumber(payload.ca1 ?? payload.firstCa ?? payload.first_ca),
    ca2: toNumber(payload.ca2 ?? payload.secondCa ?? payload.second_ca),
    exam: toNumber(payload.exam ?? payload.examScore ?? payload.exam_score),
    total: toNumber(payload.total ?? payload.total_score) ?? computeTotal(payload),
    grade: payload.grade,
    remark: payload.remark ?? payload.remarks,
  });

const mapResultFromDb = (row: any) => ({
  id: row.id,
  _id: row.id,
  studentId: row.student_id ?? row.studentId,
  subjectId: row.subject_id ?? row.subjectId,
  term: row.term,
  academicYear: row.academic_year ?? row.academicYear,
  ca1: row.ca1 ?? row.first_ca ?? row.firstCa,
  ca2: row.ca2 ?? row.second_ca ?? row.secondCa,
  exam: row.exam ?? row.exam_score ?? row.examScore,
  total:
    row.total ??
    row.total_score ??
    computeTotal({
      ca1: row.ca1 ?? row.first_ca ?? row.firstCa,
      ca2: row.ca2 ?? row.second_ca ?? row.secondCa,
      exam: row.exam ?? row.exam_score ?? row.examScore,
    }),
  grade: row.grade,
  remark: row.remark ?? row.remarks,
  class: row.class_name ?? row.class,
  className: row.class_name ?? row.className,
  studentName: row.student_name ?? row.studentName,
  subjectName: row.subject_name ?? row.subjectName,
  createdAt: row.created_at ?? row.createdAt,
  updatedAt: row.updated_at ?? row.updatedAt,
});

const enrichResults = async (rows: any[]) => {
  if (!rows.length) {
    return [];
  }

  const studentIds = Array.from(
    new Set(rows.map((row) => row.student_id ?? row.studentId).filter(Boolean)),
  ) as string[];
  const subjectIds = Array.from(
    new Set(rows.map((row) => row.subject_id ?? row.subjectId).filter(Boolean)),
  ) as string[];

  const [studentsResponse, subjectsResponse] = await Promise.all([
    studentIds.length
      ? supabase.from('students').select('id, name, class_name').in('id', studentIds)
      : Promise.resolve({ data: [], error: null }),
    subjectIds.length
      ? supabase.from('subjects').select('id, name').in('id', subjectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const students = new Map(
    (studentsResponse.data || []).map((student: any) => [
      student.id,
      { name: student.name, className: student.class_name ?? student.className },
    ]),
  );
  const subjects = new Map(
    (subjectsResponse.data || []).map((subject: any) => [subject.id, { name: subject.name }]),
  );

  return rows.map((row) => {
    const mapped = mapResultFromDb(row);
    const student = students.get(mapped.studentId);
    const subject = subjects.get(mapped.subjectId);

    return {
      ...mapped,
      studentName: mapped.studentName ?? student?.name,
      subjectName: mapped.subjectName ?? subject?.name,
      class: mapped.class ?? student?.className,
      className: mapped.className ?? student?.className,
    };
  });
};

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
  try {
    let query = supabase.from('results').select('*');

    if (req.query.studentId) {
      query = query.eq('student_id', String(req.query.studentId));
    }

    if (req.query.term) {
      query = query.eq('term', String(req.query.term));
    }

    if (req.query.academicYear) {
      query = query.eq('academic_year', String(req.query.academicYear));
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to fetch results' });
    }

    const enriched = await enrichResults(data || []);
    return res.json(enriched);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch results' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('results').select('*').eq('id', req.params.id).maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to fetch result' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const enriched = await enrichResults([data]);
    return res.json(enriched[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch result' });
  }
});

router.post('/', requireTeacher, async (req: Request, res: Response) => {
  try {
    const payload = mapResultToDb(req.body || {});

    const { data, error } = await supabase.from('results').insert(payload).select('*').single();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to create result' });
    }

    const enriched = await enrichResults([data]);
    return res.status(201).json(enriched[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create result' });
  }
});

router.put('/:id', requireTeacher, async (req: Request, res: Response) => {
  try {
    const payload = mapResultToDb(req.body || {});

    const { data, error } = await supabase
      .from('results')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to update result' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const enriched = await enrichResults([data]);
    return res.json(enriched[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update result' });
  }
});

router.delete('/:id', requireTeacher, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('results')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to delete result' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Result not found' });
    }

    return res.json({ message: 'Result deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete result' });
  }
});

router.post('/bulk', requireTeacher, async (req: Request, res: Response) => {
  try {
    const { term, academicYear, results } = req.body || {};

    if (!Array.isArray(results)) {
      return res.status(400).json({ error: 'Results must be an array' });
    }

    const payload = results.map((result: any) =>
      mapResultToDb({
        ...result,
        term: result.term ?? term,
        academicYear: result.academicYear ?? academicYear,
      }),
    );

    const { data, error } = await supabase.from('results').insert(payload).select('*');

    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to save results' });
    }

    const enriched = await enrichResults(data || []);

    return res.status(201).json({
      message: 'Results saved successfully',
      count: enriched.length,
      results: enriched,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save results' });
  }
});

export default router;