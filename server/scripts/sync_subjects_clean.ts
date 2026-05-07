import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mlhoeaojalsiptkkmupi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saG9lYW9qYWxzaXB0a2ttdXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjcwMTcyOSwiZXhwIjoyMDkyMjc3NzI5fQ.A_hRQ704WZWRYdFJ26lYjundY6RabeU4457c2SK_muE'

const supabase = createClient(supabaseUrl, supabaseKey)

const UNIQUE_SUBJECTS = [
  // Pre-Nursery & Nursery
  { name: 'Mathematics', code: 'MTH', level: 'Pre-Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'English', code: 'ENG', level: 'Pre-Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'Social Habits', code: 'SOH', level: 'Pre-Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'Health Habits', code: 'HHB', level: 'Pre-Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'Rhymes', code: 'RHM', level: 'Pre-Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'Primary Science', code: 'PSC', level: 'Pre-Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'Phonics', code: 'PHN', level: 'Pre-Nursery', credit_units: 1, subject_category: 'CORE' },

  { name: 'Mathematics', code: 'NUR-MTH', level: 'Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'English', code: 'NUR-ENG', level: 'Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'Social Habits', code: 'NUR-SOH', level: 'Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'Health Habits', code: 'NUR-HHB', level: 'Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'Rhymes', code: 'NUR-RHM', level: 'Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'Primary Science', code: 'NUR-PSC', level: 'Nursery', credit_units: 1, subject_category: 'CORE' },
  { name: 'Phonics', code: 'NUR-PHN', level: 'Nursery', credit_units: 1, subject_category: 'CORE' },
  
  // Primary
  { name: 'Mathematics', code: 'PRI-MTH', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'English', code: 'PRI-ENG', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Social Habits', code: 'PRI-SOH', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Health Habits', code: 'PRI-HHB', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Rhymes', code: 'PRI-RHM', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Primary Science', code: 'PRI-PSC', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Phonics', code: 'PRI-PHN', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Writing', code: 'PRI-WRT', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Creative Arts', code: 'PRI-CAR', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Verbal Reasoning', code: 'PRI-VRR', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Quantitative Reasoning', code: 'PRI-QTR', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Agricultural Science', code: 'PRI-AGS', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  
  // Secondary (JSS)
  { name: 'Mathematics', code: 'JSS-MTH', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'English Language', code: 'JSS-ENG', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'Basic Technology', code: 'JSS-BTE', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'Basic Science', code: 'JSS-BSC', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'Computer Studies', code: 'JSS-CST', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'Religious Studies', code: 'JSS-REL', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'Physical & Health Education', code: 'JSS-PHE', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'Fine Arts', code: 'JSS-FAA', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'Business Studies', code: 'JSS-BUS', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'National Values', code: 'JSS-NVL', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'Agricultural Science', code: 'JSS-AGS', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'Home Economics', code: 'JSS-HEC', level: 'Secondary', credit_units: 2, subject_category: null },
  { name: 'Hausa', code: 'JSS-HAU', level: 'Secondary', credit_units: 2, subject_category: null },

  // Secondary (SSS)
  { name: 'Mathematics', code: 'SSS-MTH', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'English Language', code: 'SSS-ENG', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Biology', code: 'SSS-BIO', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Geography', code: 'SSS-GEO', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Agricultural Science', code: 'SSS-AGS', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Civic Education', code: 'SSS-CVE', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Marketing', code: 'SSS-MKT', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
  { name: 'ICT', code: 'SSS-ICT', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Economics', code: 'SSS-ECO', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Chemistry', code: 'SSS-CHM', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Physics', code: 'SSS-PHY', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Government', code: 'SSS-GOV', level: 'Secondary', credit_units: 2, subject_category: 'ELECTIVE' },
  { name: 'Literature In English', code: 'SSS-LIT', level: 'Secondary', credit_units: 3, subject_category: 'ELECTIVE' },
  { name: 'Accounting', code: 'SSS-ACC', level: 'Secondary', credit_units: 3, subject_category: 'VOCATIONAL' },
  { name: 'Commerce', code: 'SSS-COM', level: 'Secondary', credit_units: 2, subject_category: 'VOCATIONAL' },
]

async function sync() {
  console.log('Cleaning up subjects...')
  await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  console.log('Inserting unique subjects...')
  const { error } = await supabase.from('subjects').insert(UNIQUE_SUBJECTS)
  
  if (error) {
    console.error('Insert failed:', error.message)
  } else {
    console.log('Successfully synced subjects.')
  }
}

sync()
