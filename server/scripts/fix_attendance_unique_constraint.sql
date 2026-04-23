-- Fix attendance uniqueness so one student has at most one record per date.
-- Run this in Supabase SQL Editor when convenient.

-- Remove duplicate rows first, keeping the most recently created record.
DELETE FROM public.attendance a
USING public.attendance b
WHERE a.student_id = b.student_id
  AND a.date = b.date
  AND a.created_at < b.created_at;

-- Add the unique constraint required by ON CONFLICT (student_id, date).
ALTER TABLE public.attendance
DROP CONSTRAINT IF EXISTS attendance_student_id_date_key;

ALTER TABLE public.attendance
ADD CONSTRAINT attendance_student_id_date_key UNIQUE (student_id, date);
