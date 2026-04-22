-- Supabase (PostgreSQL) Schema for Folusho Reporting Sheet

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Teacher', 'Student', 'Parent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    teacher_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    subject TEXT,
    level TEXT NOT NULL CHECK (level IN ('Pre-Nursery', 'Nursery', 'Primary', 'Secondary')),
    assigned_classes TEXT[] DEFAULT '{}',
    image TEXT,
    role TEXT DEFAULT 'Teacher',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    level TEXT NOT NULL,
    credit_units INTEGER DEFAULT 0,
    subject_category TEXT NOT NULL,
    curriculum_type TEXT NOT NULL,
    description TEXT,
    topics JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Curriculums table
CREATE TABLE IF NOT EXISTS public.curriculums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    level TEXT NOT NULL,
    years_of_study INTEGER NOT NULL,
    subjects TEXT[] DEFAULT '{}',
    implementation_date TEXT,
    description TEXT,
    curriculum_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schemes of Work table
CREATE TABLE IF NOT EXISTS public.schemes_of_work (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    term INTEGER NOT NULL,
    curriculum_id TEXT NOT NULL,
    topics JSONB DEFAULT '[]',
    uploaded_by TEXT,
    status TEXT DEFAULT 'PENDING',
    approved_by TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    class_id TEXT NOT NULL,
    gender TEXT,
    date_of_birth TIMESTAMP WITH TIME ZONE,
    parent_name TEXT,
    parent_email TEXT,
    parent_phone TEXT,
    parent_username TEXT UNIQUE,
    parent_password TEXT,
    address TEXT,
    image TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subject Results table
CREATE TABLE IF NOT EXISTS public.subject_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    term INTEGER NOT NULL,
    ca1_score NUMERIC DEFAULT 0,
    ca2_score NUMERIC DEFAULT 0,
    exam_score NUMERIC DEFAULT 0,
    total_score NUMERIC DEFAULT 0,
    grade TEXT,
    remark TEXT,
    status TEXT DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    recorded_by TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    recipient_id TEXT, -- Optional, for linked users
    student_id TEXT,   -- Optional, for linked students
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'SENT', -- SENT, FAILED, READ, UNREAD
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_name TEXT,
    role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT, -- Optional, for filtering
    entity_id TEXT,   -- Optional, for filtering
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- School Config table
CREATE TABLE IF NOT EXISTS public.school_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_term TEXT DEFAULT '1st Term',
    current_academic_year TEXT DEFAULT '2023/2024',
    available_classes TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Observations table
CREATE TABLE IF NOT EXISTS public.observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    term INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    recorded_by TEXT,
    punctuality TEXT,
    neatness TEXT,
    politeness TEXT,
    honesty TEXT,
    relationship_with_others TEXT,
    leadership TEXT,
    emotional_stability TEXT,
    health TEXT,
    self_control TEXT,
    attendance TEXT,
    cooperation TEXT,
    reliability TEXT,
    social_habits TEXT,
    manual_skills TEXT,
    dexterity TEXT,
    fluency TEXT,
    handwriting TEXT,
    sports TEXT,
    crafts TEXT,
    hobbies TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, term, academic_year)
);

-- Enable Row Level Security (RLS) - for now, we'll keep it simple
-- You can add policies later in the Supabase dashboard
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes_of_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_config ENABLE ROW LEVEL SECURITY;

-- Simple policies to allow authenticated service role access (backend)
-- These are usually default for service_role key
