-- Database Constraints for Data Integrity
-- Run this script in your Supabase SQL Editor

-- Students Table Constraints
ALTER TABLE public.students 
ADD CONSTRAINT students_date_of_birth_not_future 
CHECK (date_of_birth < NOW());

ALTER TABLE public.students 
ADD CONSTRAINT students_enrollment_date_not_future 
CHECK (enrollment_date <= NOW());

ALTER TABLE public.students 
ADD CONSTRAINT students_gender_valid 
CHECK (gender IN ('Male', 'Female'));

ALTER TABLE public.students 
ADD CONSTRAINT students_status_valid 
CHECK (status IN ('Active', 'Inactive', 'Suspended'));

ALTER TABLE public.students 
ADD CONSTRAINT students_level_valid 
CHECK (level IN ('Pre-Nursery', 'Nursery', 'Primary', 'Secondary'));

-- Subject Results Table Constraints
ALTER TABLE public.subject_results 
ADD CONSTRAINT results_ca1_valid 
CHECK (ca1_score >= 0 AND ca1_score <= 40);

ALTER TABLE public.subject_results 
ADD CONSTRAINT results_ca2_valid 
CHECK (ca2_score >= 0 AND ca2_score <= 40);

ALTER TABLE public.subject_results 
ADD CONSTRAINT results_exam_valid 
CHECK (exam_score >= 0 AND exam_score <= 100);

ALTER TABLE public.subject_results 
ADD CONSTRAINT results_term_valid 
CHECK (term >= 1 AND term <= 3);

ALTER TABLE public.subject_results 
ADD CONSTRAINT results_total_score_valid 
CHECK (total_score >= 0 AND total_score <= 100);

-- Attendance Table Constraints
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_status_valid 
CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'));

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_date_not_future 
CHECK (date <= CURRENT_DATE);

-- Teachers Table Constraints
ALTER TABLE public.teachers 
ADD CONSTRAINT teachers_level_valid 
CHECK (level IN ('Pre-Nursery', 'Nursery', 'Primary', 'Secondary'));

-- Users Table Constraints
ALTER TABLE public.users 
ADD CONSTRAINT users_role_valid 
CHECK (role IN ('Admin', 'Teacher', 'Student', 'Parent'));

-- Subjects Table Constraints
ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_category_valid 
CHECK (subject_category IN ('CORE', 'ELECTIVE', 'VOCATIONAL'));

-- Create Indexes for Better Performance
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON public.students(parent_email);
CREATE INDEX IF NOT EXISTS idx_students_parent_username ON public.students(parent_username);
CREATE INDEX IF NOT EXISTS idx_students_registration_number ON public.students(registration_number);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON public.subject_results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_subject_id ON public.subject_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);

-- Function to prevent hard deletes (soft delete pattern)
CREATE OR REPLACE FUNCTION soft_delete_student()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.students 
  SET status = 'Inactive', 
      updated_at = NOW() 
  WHERE id = OLD.id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to soft delete instead of hard delete
-- DROP TRIGGER IF EXISTS trigger_soft_delete_student ON public.students;
-- CREATE TRIGGER trigger_soft_delete_student
-- BEFORE DELETE ON public.students
-- FOR EACH ROW EXECUTE FUNCTION soft_delete_student();

COMMENT ON CONSTRAINT students_date_of_birth_not_future ON public.students IS 'Date of birth cannot be in the future';
COMMENT ON CONSTRAINT students_enrollment_date_not_future ON public.students IS 'Enrollment date cannot be in the future';
COMMENT ON CONSTRAINT results_ca1_valid ON public.subject_results IS 'First CA score must be between 0 and 40';
COMMENT ON CONSTRAINT results_ca2_valid ON public.subject_results IS 'Second CA score must be between 0 and 40';
COMMENT ON CONSTRAINT results_exam_valid ON public.subject_results IS 'Exam score must be between 0 and 100';
COMMENT ON CONSTRAINT results_term_valid ON public.subject_results IS 'Term must be between 1 and 3';
COMMENT ON CONSTRAINT attendance_status_valid ON public.attendance IS 'Attendance status must be PRESENT, ABSENT, LATE, or EXCUSED';
COMMENT ON CONSTRAINT attendance_date_not_future ON public.attendance IS 'Attendance date cannot be in the future';