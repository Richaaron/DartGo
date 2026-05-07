import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_SUBJECTS = [
  // Pre-Nursery & Nursery (7 subjects)
  ...['Pre-Nursery', 'Nursery'].flatMap(level => [
    { name: 'Mathematics', code: 'MTH', level, credit_units: 1, subject_category: 'CORE' },
    { name: 'English', code: 'ENG', level, credit_units: 1, subject_category: 'CORE' },
    { name: 'Social Habits', code: 'SOH', level, credit_units: 1, subject_category: 'CORE' },
    { name: 'Health Habits', code: 'HHB', level, credit_units: 1, subject_category: 'CORE' },
    { name: 'Rhymes', code: 'RHM', level, credit_units: 1, subject_category: 'CORE' },
    { name: 'Primary Science', code: 'PSC', level, credit_units: 1, subject_category: 'CORE' },
    { name: 'Phonics', code: 'PHN', level, credit_units: 1, subject_category: 'CORE' },
  ]),
  
  // Primary 1-3 (12 subjects)
  ...[1, 2, 3].flatMap(p => [
    { name: 'Mathematics', code: 'MTH', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'English', code: 'ENG', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Social Habits', code: 'SOH', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Health Habits', code: 'HHB', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Rhymes', code: 'RHM', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Primary Science', code: 'PSC', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Phonics', code: 'PHN', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Writing', code: 'WRT', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Creative Arts', code: 'CAR', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Verbal Reasoning', code: 'VRR', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Quantitative Reasoning', code: 'QTR', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Agricultural Science', code: 'AGS', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  ]),

  // Primary 4-6 (11 subjects)
  ...[4, 5, 6].flatMap(p => [
    { name: 'Mathematics', code: 'MTH', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'English', code: 'ENG', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Social Habits', code: 'SOH', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Health Habits', code: 'HHB', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Rhymes', code: 'RHM', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Primary Science', code: 'PSC', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Phonics', code: 'PHN', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Creative Arts', code: 'CAR', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Verbal Reasoning', code: 'VRR', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Quantitative Reasoning', code: 'QTR', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Agricultural Science', code: 'AGS', level: 'Primary', credit_units: 2, subject_category: 'CORE' },
  ]),
  
  // Junior Secondary (13 subjects)
  ...['JSS1', 'JSS2', 'JSS3'].flatMap(level => [
    { name: 'Mathematics', code: 'MTH', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'English Language', code: 'ENG', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Basic Technology', code: 'BTE', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Basic Science', code: 'BSC', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Computer Studies', code: 'CST', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Religious Studies', code: 'REL', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Physical & Health Education', code: 'PHE', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Fine Arts', code: 'FAA', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Business Studies', code: 'BUS', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'National Values', code: 'NVL', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Agricultural Science', code: 'AGS', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Home Economics', code: 'HEC', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
    { name: 'Hausa', code: 'HAU', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
  ]),
  
  // Senior Secondary
  { name: 'Mathematics', code: 'MTH', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'English Language', code: 'ENG', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Biology', code: 'BIO', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Geography', code: 'GEO', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Agricultural Science', code: 'AGS', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Civic Education', code: 'CVE', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Marketing', code: 'MKT', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
  { name: 'ICT', code: 'ICT', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
  { name: 'Economics', code: 'ECO', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Chemistry', code: 'CHM', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Physics', code: 'PHY', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
  { name: 'Government', code: 'GOV', level: 'Secondary', credit_units: 2, subject_category: 'ELECTIVE' },
  { name: 'Literature In English', code: 'LIT', level: 'Secondary', credit_units: 3, subject_category: 'ELECTIVE' },
  { name: 'Accounting', code: 'ACC', level: 'Secondary', credit_units: 3, subject_category: 'VOCATIONAL' },
  { name: 'Commerce', code: 'COM', level: 'Secondary', credit_units: 2, subject_category: 'VOCATIONAL' },
]

async function syncSubjects() {
  console.log('Syncing subjects...')

  // Get existing subjects
  const { data: existingSubjects, error: fetchError } = await supabase.from('subjects').select('*')
  if (fetchError) {
    console.error('Error fetching subjects:', fetchError.message)
    return
  }
  
  for (const subject of DEFAULT_SUBJECTS) {
    const existing = existingSubjects?.find(s => s.name === subject.name && s.level === subject.level)
    
    if (existing) {
      // Update
      const { error } = await supabase
        .from('subjects')
        .update(subject)
        .eq('id', existing.id)
      
      if (error) console.error(`Error updating ${subject.name}:`, error.message)
      else console.log(`Updated ${subject.name} (${subject.level})`)
    } else {
      // Insert
      const { error } = await supabase
        .from('subjects')
        .insert([subject])
      
      if (error) console.error(`Error inserting ${subject.name}:`, error.message)
      else console.log(`Inserted ${subject.name} (${subject.level})`)
    }
  }

  console.log('Sync complete!')
}

syncSubjects()
