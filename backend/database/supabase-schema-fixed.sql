-- Supabase Database Schema for Folusho Victory Schools
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Teacher', 'Student', 'Parent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('Active', 'Inactive', 'Suspended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE school_level AS ENUM ('Pre-Nursery', 'Nursery', 'Primary', 'Secondary');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender AS ENUM ('Male', 'Female');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assessment_type AS ENUM ('Test', 'Exam', 'Assignment', 'Project');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE performance_rating AS ENUM ('Excellent', 'Good', 'Average', 'Poor', 'Very Poor');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subject_category AS ENUM ('CORE', 'ELECTIVE', 'VOCATIONAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE curriculum_type AS ENUM ('NIGERIAN', 'IGCSE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Student',
    status user_status NOT NULL DEFAULT 'Active',
    last_login TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT false,
    phone TEXT,
    address TEXT,
    profile_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registration_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender NOT NULL,
    level school_level NOT NULL,
    class_name TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status user_status NOT NULL DEFAULT 'Active',
    profile_image TEXT,
    emergency_contact TEXT,
    medical_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    level school_level NOT NULL,
    credit_units INTEGER NOT NULL DEFAULT 1,
    subject_category subject_category,
    description TEXT,
    curriculum_type curriculum_type,
    prerequisite_subjects JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    assessment_type assessment_type NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    total_score DECIMAL(5,2) NOT NULL,
    term TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    recorded_by UUID REFERENCES users(id),
    notes TEXT,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS ((score / total_score) * 100) STORED,
    grade TEXT,
    grade_point DECIMAL(3,2),
    remarks performance_rating,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_registration_number ON students(registration_number);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_students_level ON students(level);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_level ON subjects(level);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_subject_id ON results(subject_id);
CREATE INDEX IF NOT EXISTS idx_results_term ON results(term);
CREATE INDEX IF NOT EXISTS idx_results_academic_year ON results(academic_year);
CREATE INDEX IF NOT EXISTS idx_results_grade ON results(grade);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Admins can do everything
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (auth.jwt() ->> 'role' = 'Admin');

-- Students can be viewed by teachers, admins, and themselves
CREATE POLICY "Students are viewable by appropriate roles" ON students
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('Admin', 'Teacher') OR
        auth.uid()::text = user_id::text
    );

-- Teachers and admins can manage students
CREATE POLICY "Teachers and admins can manage students" ON students
    FOR ALL USING (auth.jwt() ->> 'role' IN ('Admin', 'Teacher'));

-- Subjects are readable by all authenticated users
CREATE POLICY "Subjects are readable by authenticated users" ON subjects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage subjects
CREATE POLICY "Admins can manage subjects" ON subjects
    FOR ALL USING (auth.jwt() ->> 'role' = 'Admin');

-- Results policies
CREATE POLICY "Results viewable by appropriate roles" ON results
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('Admin', 'Teacher') OR
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = results.student_id AND s.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Teachers and admins can manage results" ON results
    FOR ALL USING (auth.jwt() ->> 'role' IN ('Admin', 'Teacher'));

-- Insert default subjects (with conflict handling)
INSERT INTO subjects (name, code, level, credit_units, subject_category, description) VALUES
('English Language', 'ENG', 'Primary', 3, 'CORE', 'Primary English Language'),
('Mathematics', 'MAT', 'Primary', 3, 'CORE', 'Primary Mathematics'),
('Basic Science', 'SCI', 'Primary', 2, 'CORE', 'Primary Science'),
('Social Studies', 'SST', 'Primary', 2, 'CORE', 'Primary Social Studies'),
('English Language', 'ENG_SEC', 'Secondary', 3, 'CORE', 'Secondary English Language'),
('Mathematics', 'MAT_SEC', 'Secondary', 3, 'CORE', 'Secondary Mathematics'),
('Biology', 'BIO', 'Secondary', 3, 'CORE', 'Secondary Biology'),
('Chemistry', 'CHEM', 'Secondary', 3, 'CORE', 'Secondary Chemistry'),
('Physics', 'PHY', 'Secondary', 3, 'CORE', 'Secondary Physics'),
('Dart Programming', 'DART', 'Secondary', 3, 'ELECTIVE', 'Introduction to Dart Programming Language'),
('Further Mathematics', 'FMA', 'Secondary', 3, 'ELECTIVE', 'Advanced Mathematics'),
('Computer Studies', 'COMP', 'Secondary', 2, 'CORE', 'Computer Science Fundamentals')
ON CONFLICT (code) DO NOTHING;

-- Create a function to calculate grades automatically
CREATE OR REPLACE FUNCTION calculate_grade_and_remarks()
RETURNS TRIGGER AS $$
DECLARE
    grade_val TEXT;
    grade_point_val DECIMAL(3,2);
    remarks_val performance_rating;
BEGIN
    -- Calculate percentage
    NEW.percentage := (NEW.score / NEW.total_score) * 100;
    
    -- Determine grade and grade point
    IF NEW.percentage >= 90 THEN
        grade_val := 'A';
        grade_point_val := 4.0;
        remarks_val := 'Excellent';
    ELSIF NEW.percentage >= 80 THEN
        grade_val := 'B';
        grade_point_val := 3.0;
        remarks_val := 'Good';
    ELSIF NEW.percentage >= 70 THEN
        grade_val := 'C';
        grade_point_val := 2.0;
        remarks_val := 'Average';
    ELSIF NEW.percentage >= 60 THEN
        grade_val := 'D';
        grade_point_val := 1.0;
        remarks_val := 'Poor';
    ELSE
        grade_val := 'F';
        grade_point_val := 0.0;
        remarks_val := 'Very Poor';
    END IF;
    
    NEW.grade := grade_val;
    NEW.grade_point := grade_point_val;
    NEW.remarks := remarks_val;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic grade calculation
CREATE TRIGGER calculate_grade_trigger
    BEFORE INSERT OR UPDATE ON results
    FOR EACH ROW EXECUTE FUNCTION calculate_grade_and_remarks();
