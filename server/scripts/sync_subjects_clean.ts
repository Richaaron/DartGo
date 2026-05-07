import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mlhoeaojalsiptkkmupi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saG9lYW9qYWxzaXB0a2ttdXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjcwMTcyOSwiZXhwIjoyMDkyMjc3NzI5fQ.A_hRQ704WZWRYdFJ26lYjundY6RabeU4457c2SK_muE'

const supabase = createClient(supabaseUrl, supabaseKey)

const UNIQUE_SUBJECTS = [
  // Pre-Nursery & Nursery
  ...['Pre-Nursery', 'Nursery'].flatMap(level => {
    const prefix = level === 'Pre-Nursery' ? 'PN' : 'NUR';
    return [
      { name: 'Mathematics', code: `${prefix}-MTH`, level, credit_units: 1, subject_category: 'CORE' },
      { name: 'English', code: `${prefix}-ENG`, level, credit_units: 1, subject_category: 'CORE' },
      { name: 'Social Habits', code: `${prefix}-SOH`, level, credit_units: 1, subject_category: 'CORE' },
      { name: 'Health Habits', code: `${prefix}-HHB`, level, credit_units: 1, subject_category: 'CORE' },
      { name: 'Rhymes', code: `${prefix}-RHM`, level, credit_units: 1, subject_category: 'CORE' },
      { name: 'Primary Science', code: `${prefix}-PSC`, level, credit_units: 1, subject_category: 'CORE' },
      { name: 'Phonics', code: `${prefix}-PHN`, level, credit_units: 1, subject_category: 'CORE' },
    ]
  }),
  
  // Primary
  ...['Primary'].flatMap(level => {
    const prefix = 'PRI';
    return [
      { name: 'Mathematics', code: `${prefix}-MTH`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'English Language', code: `${prefix}-ENG`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'National Values', code: `${prefix}-NVL`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Basic Technology', code: `${prefix}-BTE`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Basic Science', code: `${prefix}-BSC`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Physical & Health Education', code: `${prefix}-PHE`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Computer studies', code: `${prefix}-CST`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Religious studies', code: `${prefix}-REL`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Phonics', code: `${prefix}-PHN`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Home Economics', code: `${prefix}-HEC`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Literature', code: `${prefix}-LIT`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Vocational Aptitude', code: `${prefix}-VAP`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Writing', code: `${prefix}-WRT`, level, credit_units: 2, subject_category: 'CORE' }, // UI filters this for P4-6
      { name: 'Creative Arts', code: `${prefix}-CAR`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Verbal Reasoning', code: `${prefix}-VRR`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Quantitative Reasoning', code: `${prefix}-QTR`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Agricultural Science', code: `${prefix}-AGS`, level, credit_units: 2, subject_category: 'CORE' },
    ]
  }),
  
  // Secondary (JSS)
  ...['Secondary'].flatMap(level => {
    const prefix = 'JSS';
    return [
      { name: 'Mathematics', code: `${prefix}-MTH`, level, credit_units: 2, subject_category: null },
      { name: 'English Language', code: `${prefix}-ENG`, level, credit_units: 2, subject_category: null },
      { name: 'Basic Technology', code: `${prefix}-BTE`, level, credit_units: 2, subject_category: null },
      { name: 'Basic Science', code: `${prefix}-BSC`, level, credit_units: 2, subject_category: null },
      { name: 'Computer Studies', code: `${prefix}-CST`, level, credit_units: 2, subject_category: null },
      { name: 'Religious Studies', code: `${prefix}-REL`, level, credit_units: 2, subject_category: null },
      { name: 'Physical & Health Education', code: `${prefix}-PHE`, level, credit_units: 2, subject_category: null },
      { name: 'Fine Arts', code: `${prefix}-FAA`, level, credit_units: 2, subject_category: null },
      { name: 'Business Studies', code: `${prefix}-BUS`, level, credit_units: 2, subject_category: null },
      { name: 'National Values', code: `${prefix}-NVL`, level, credit_units: 2, subject_category: null },
      { name: 'Agricultural science', code: `${prefix}-AGS`, level, credit_units: 2, subject_category: null },
      { name: 'Home Economics', code: `${prefix}-HEC`, level, credit_units: 2, subject_category: null },
      { name: 'Hausa', code: `${prefix}-HAU`, level, credit_units: 2, subject_category: null },
    ]
  }),

  // Secondary (SSS)
  ...['Secondary'].flatMap(level => {
    const prefix = 'SSS';
    return [
      // General
      { name: 'Mathematics', code: `${prefix}-MTH`, level, credit_units: 3, subject_category: 'CORE' },
      { name: 'English Language', code: `${prefix}-ENG`, level, credit_units: 3, subject_category: 'CORE' },
      { name: 'Biology', code: `${prefix}-BIO`, level, credit_units: 3, subject_category: 'CORE' },
      { name: 'Geography', code: `${prefix}-GEO`, level, credit_units: 3, subject_category: 'CORE' },
      { name: 'Agricultural Science', code: `${prefix}-AGS`, level, credit_units: 3, subject_category: 'CORE' },
      { name: 'Civic Education', code: `${prefix}-CVE`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Marketing', code: `${prefix}-MKT`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'ICT', code: `${prefix}-ICT`, level, credit_units: 2, subject_category: 'CORE' },
      { name: 'Economics', code: `${prefix}-ECO`, level, credit_units: 3, subject_category: 'CORE' },
      // Science
      { name: 'Chemistry', code: `${prefix}-CHM`, level, credit_units: 3, subject_category: 'CORE' },
      { name: 'Physics', code: `${prefix}-PHY`, level, credit_units: 3, subject_category: 'CORE' },
      // Art
      { name: 'Government', code: `${prefix}-GOV`, level, credit_units: 2, subject_category: 'ELECTIVE' },
      { name: 'Literature In English', code: `${prefix}-LIT`, level, credit_units: 3, subject_category: 'ELECTIVE' },
      // Commerce
      { name: 'Accounting', code: `${prefix}-ACC`, level, credit_units: 3, subject_category: 'VOCATIONAL' },
      { name: 'Commerce', code: `${prefix}-COM`, level, credit_units: 2, subject_category: 'VOCATIONAL' },
    ]
  }),
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
