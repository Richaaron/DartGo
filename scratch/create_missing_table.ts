
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'server/.env' })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function createTable() {
  console.log('Attempting to create student_subjects table...')
  
  const sql = `
    CREATE TABLE IF NOT EXISTS public.student_subjects (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
      subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
      academic_year TEXT,
      term TEXT,
      assigned_by TEXT,
      notes TEXT,
      status TEXT DEFAULT 'Active',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(student_id, subject_id, academic_year, term)
    );

    -- Enable RLS
    ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

    -- Create policies (permissive for now as we use service role in backend)
    DROP POLICY IF EXISTS "Service role full access" ON public.student_subjects;
    CREATE POLICY "Service role full access" ON public.student_subjects FOR ALL USING (true);
  `;

  // We can't run arbitrary SQL via supabase-js unless we have a RPC function.
  // But we can try to use a "dirty trick": run it via a function if it exists, 
  // or just inform the user.
  
  console.log('Please run the following SQL in your Supabase SQL Editor:')
  console.log(sql)
}

createTable()
