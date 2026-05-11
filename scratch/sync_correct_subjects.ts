import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

const subjects = [
  // Pre-Nursery & Nursery (Trait-based)
  { name: 'Numeracy', code: 'nur-num', level: 'Nursery', category: 'CORE' },
  { name: 'Literacy', code: 'nur-lit', level: 'Nursery', category: 'CORE' },
  { name: 'Phonics', code: 'nur-pho', level: 'Nursery', category: 'CORE' },
  { name: 'Creative Arts', code: 'nur-ca', level: 'Nursery', category: 'CORE' },
  { name: 'Social Studies', code: 'nur-ss', level: 'Nursery', category: 'CORE' },
  { name: 'Physical Development', code: 'nur-phd', level: 'Nursery', category: 'CORE' },
  { name: 'Personal Development', code: 'nur-pd', level: 'Nursery', category: 'CORE' },
  
  { name: 'Numeracy', code: 'pre-num', level: 'Pre-Nursery', category: 'CORE' },
  { name: 'Literacy', code: 'pre-lit', level: 'Pre-Nursery', category: 'CORE' },
  { name: 'Phonics', code: 'pre-pho', level: 'Pre-Nursery', category: 'CORE' },
  { name: 'Creative Arts', code: 'pre-ca', level: 'Pre-Nursery', category: 'CORE' },
  { name: 'Social Studies', code: 'pre-ss', level: 'Pre-Nursery', category: 'CORE' },
  { name: 'Physical Development', code: 'pre-phd', level: 'Pre-Nursery', category: 'CORE' },
  { name: 'Personal Development', code: 'pre-pd', level: 'Pre-Nursery', category: 'CORE' },

  // Primary (P1–P6)
  { name: 'Mathematics', code: 'pri-math', level: 'Primary', category: 'CORE' },
  { name: 'English Language', code: 'pri-eng', level: 'Primary', category: 'CORE' },
  { name: 'Basic Science', code: 'pri-bsci', level: 'Primary', category: 'CORE' },
  { name: 'Basic Technology', code: 'pri-btech', level: 'Primary', category: 'CORE' },
  { name: 'National Values', code: 'pri-nv', level: 'Primary', category: 'CORE' },
  { name: 'Agriculture Science', code: 'pri-agric', level: 'Primary', category: 'CORE' },
  { name: 'Phonics', code: 'pri-pho', level: 'Primary', category: 'CORE' },
  { name: 'Physical & Health Education', code: 'pri-phe', level: 'Primary', category: 'CORE' },
  { name: 'Vocational Aptitude', code: 'pri-voc', level: 'Primary', category: 'VOCATIONAL' },
  { name: 'Quantitative Reasoning', code: 'pri-qr', level: 'Primary', category: 'CORE' },
  { name: 'Verbal Reasoning', code: 'pri-vr', level: 'Primary', category: 'CORE' },
  { name: 'Literature', code: 'pri-lit', level: 'Primary', category: 'CORE' },
  { name: 'Creative Arts', code: 'pri-ca', level: 'Primary', category: 'ELECTIVE' },
  { name: 'Writing', code: 'pri-write', level: 'Primary', category: 'CORE' },
  { name: 'Home Economics', code: 'pri-he', level: 'Primary', category: 'VOCATIONAL' },
  { name: 'Computer Studies', code: 'pri-comp', level: 'Primary', category: 'CORE' },
  { name: 'Religious Studies', code: 'pri-rs', level: 'Primary', category: 'CORE' },

  // Junior Secondary (JSS1–JSS3)
  { name: 'Mathematics', code: 'sec-jss-math', level: 'Secondary', category: 'CORE' },
  { name: 'English Language', code: 'sec-jss-eng', level: 'Secondary', category: 'CORE' },
  { name: 'Basic Science', code: 'sec-jss-bsci', level: 'Secondary', category: 'CORE' },
  { name: 'Basic Technology', code: 'sec-jss-btech', level: 'Secondary', category: 'CORE' },
  { name: 'National Values', code: 'sec-jss-nv', level: 'Secondary', category: 'CORE' },
  { name: 'Agriculture Science', code: 'sec-jss-agric', level: 'Secondary', category: 'CORE' },
  { name: 'Business Studies', code: 'sec-jss-bus', level: 'Secondary', category: 'VOCATIONAL' },
  { name: 'Physical & Health Education', code: 'sec-jss-phe', level: 'Secondary', category: 'CORE' },
  { name: 'Hausa', code: 'sec-jss-hau', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Fine Arts', code: 'sec-jss-fa', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Home Economics', code: 'sec-jss-he', level: 'Secondary', category: 'VOCATIONAL' },
  { name: 'Computer Studies', code: 'sec-jss-comp', level: 'Secondary', category: 'CORE' },
  { name: 'Religious Studies', code: 'sec-jss-rs', level: 'Secondary', category: 'CORE' },

  // Senior Secondary (General)
  { name: 'Mathematics', code: 'sec-sss-math', level: 'Secondary', category: 'CORE' },
  { name: 'English Language', code: 'sec-sss-eng', level: 'Secondary', category: 'CORE' },
  { name: 'Biology', code: 'sec-sss-bio', level: 'Secondary', category: 'CORE' },
  { name: 'Marketing', code: 'sec-sss-mkt', level: 'Secondary', category: 'CORE' },
  { name: 'Civic Education', code: 'sec-sss-civ', level: 'Secondary', category: 'CORE' },
  { name: 'Geography', code: 'sec-sss-geo', level: 'Secondary', category: 'CORE' },
  { name: 'Agriculture Science', code: 'sec-sss-agric', level: 'Secondary', category: 'CORE' },

  // Senior Secondary (Track specific)
  { name: 'Chemistry', code: 'sec-sss-che', level: 'Secondary', category: 'CORE' },
  { name: 'Physics', code: 'sec-sss-phy', level: 'Secondary', category: 'CORE' },
  { name: 'Government', code: 'sec-sss-gov', level: 'Secondary', category: 'CORE' },
  { name: 'Literature in English', code: 'sec-sss-lit', level: 'Secondary', category: 'CORE' },
  { name: 'Accounting', code: 'sec-sss-acc', level: 'Secondary', category: 'CORE' },
  { name: 'Commerce', code: 'sec-sss-comm', level: 'Secondary', category: 'CORE' }
]

async function syncSubjects() {
  console.log('--- STARTING SUBJECT SYNC (USER DEFINED LIST) ---')
  
  // 1. Delete all current subjects
  console.log('Clearing subjects table...')
  const { error: delError } = await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delError) {
    console.error('Error clearing subjects:', delError.message)
    return
  }
  
  // 2. Prepare data for insert
  const dataToInsert = subjects.map(s => ({
    name: s.name,
    code: s.code,
    level: s.level,
    subject_category: s.category,
    curriculum_type: 'NIGERIAN',
    description: `${s.level} ${s.name} - Folusho Victory Schools Official Curriculum`,
    topics: (s.level === 'Pre-Nursery' || s.level === 'Nursery') ? { assessment_type: 'TRAIT' } : { assessment_type: 'NUMERIC' }
  }))

  // 3. Insert subjects
  console.log(`Inserting ${dataToInsert.length} user-defined subjects...`)
  const { error: insError } = await supabase.from('subjects').insert(dataToInsert)
  
  if (insError) {
    console.error('Error inserting subjects:', insError.message)
  } else {
    console.log('✅ SUBJECT SYNC COMPLETED SUCCESSFULLY!')
    console.log(`Total subjects synchronized: ${dataToInsert.length}`)
  }
}

syncSubjects()
