import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

const correctSubjects = [
  // Pre-Nursery (5)
  { name: 'Numeracy', code: 'pre-num', level: 'Pre-Nursery', category: 'CORE' },
  { name: 'Early Literacy', code: 'pre-lit', level: 'Pre-Nursery', category: 'CORE' },
  { name: 'Personal Development', code: 'pre-pd', level: 'Pre-Nursery', category: 'CORE' },
  { name: 'Creative Arts', code: 'pre-ca', level: 'Pre-Nursery', category: 'CORE' },
  { name: 'Physical Development', code: 'pre-phd', level: 'Pre-Nursery', category: 'CORE' },

  // Nursery (7)
  { name: 'Numeracy', code: 'nur-num', level: 'Nursery', category: 'CORE' },
  { name: 'Literacy', code: 'nur-lit', level: 'Nursery', category: 'CORE' },
  { name: 'Phonics', code: 'nur-pho', level: 'Nursery', category: 'CORE' },
  { name: 'Environmental Studies', code: 'nur-evs', level: 'Nursery', category: 'CORE' },
  { name: 'Creative Arts', code: 'nur-ca', level: 'Nursery', category: 'CORE' },
  { name: 'Physical Education', code: 'nur-phe', level: 'Nursery', category: 'CORE' },
  { name: 'Social Studies', code: 'nur-ss', level: 'Nursery', category: 'CORE' },

  // Primary (12)
  { name: 'English Language', code: 'pri-eng', level: 'Primary', category: 'CORE' },
  { name: 'Mathematics', code: 'pri-math', level: 'Primary', category: 'CORE' },
  { name: 'Basic Science', code: 'pri-sci', level: 'Primary', category: 'CORE' },
  { name: 'Social Studies', code: 'pri-ss', level: 'Primary', category: 'CORE' },
  { name: 'Physical Education', code: 'pri-phe', level: 'Primary', category: 'CORE' },
  { name: 'Computer Studies', code: 'pri-comp', level: 'Primary', category: 'CORE' },
  { name: 'Islamic Religion Studies', code: 'pri-irs', level: 'Primary', category: 'CORE' },
  { name: 'Christian Religion Studies', code: 'pri-crs', level: 'Primary', category: 'CORE' },
  { name: 'Yoruba', code: 'pri-yor', level: 'Primary', category: 'ELECTIVE' },
  { name: 'Igbo', code: 'pri-igb', level: 'Primary', category: 'ELECTIVE' },
  { name: 'Hausa', code: 'pri-hau', level: 'Primary', category: 'ELECTIVE' },
  { name: 'Creative Arts', code: 'pri-ca', level: 'Primary', category: 'ELECTIVE' },

  // Secondary (29)
  { name: 'English Language', code: 'sec-eng', level: 'Secondary', category: 'CORE' },
  { name: 'Mathematics', code: 'sec-math', level: 'Secondary', category: 'CORE' },
  { name: 'Integrated Science', code: 'sec-isci', level: 'Secondary', category: 'CORE' },
  { name: 'Physics', code: 'sec-phy', level: 'Secondary', category: 'CORE' },
  { name: 'Chemistry', code: 'sec-che', level: 'Secondary', category: 'CORE' },
  { name: 'Biology', code: 'sec-bio', level: 'Secondary', category: 'CORE' },
  { name: 'Social Studies', code: 'sec-ss', level: 'Secondary', category: 'CORE' },
  { name: 'Physical Education', code: 'sec-phe', level: 'Secondary', category: 'CORE' },
  { name: 'Health Education', code: 'sec-he', level: 'Secondary', category: 'CORE' },
  { name: 'Literature in English', code: 'sec-lit', level: 'Secondary', category: 'CORE' },
  { name: 'Further Mathematics', code: 'sec-fmath', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'History', code: 'sec-his', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Geography', code: 'sec-geo', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Government', code: 'sec-gov', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Economics', code: 'sec-eco', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Computer Science', code: 'sec-comp', level: 'Secondary', category: 'VOCATIONAL' },
  { name: 'Business Studies', code: 'sec-bus', level: 'Secondary', category: 'VOCATIONAL' },
  { name: 'Accounting', code: 'sec-acc', level: 'Secondary', category: 'VOCATIONAL' },
  { name: 'Technical Drawing', code: 'sec-td', level: 'Secondary', category: 'VOCATIONAL' },
  { name: 'French', code: 'sec-fre', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Yoruba', code: 'sec-yor', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Igbo', code: 'sec-igb', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Hausa', code: 'sec-hau', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Arabic', code: 'sec-ara', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Islamic Religion Studies', code: 'sec-irs', level: 'Secondary', category: 'CORE' },
  { name: 'Christian Religion Studies', code: 'sec-crs', level: 'Secondary', category: 'CORE' },
  { name: 'Fine Arts', code: 'sec-fa', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Music', code: 'sec-mus', level: 'Secondary', category: 'ELECTIVE' },
  { name: 'Civic Education', code: 'sec-civic', level: 'Secondary', category: 'CORE' }
]

async function syncSubjects() {
  console.log('--- STARTING SUBJECT SYNC ---')
  
  // 1. Delete all current subjects
  console.log('Clearing subjects table...')
  const { error: delError } = await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delError) {
    console.error('Error clearing subjects:', delError.message)
    return
  }
  
  // 2. Prepare data for insert
  const dataToInsert = correctSubjects.map(s => ({
    name: s.name,
    code: s.code,
    level: s.level,
    subject_category: s.category,
    curriculum_type: 'NIGERIAN',
    description: `Official NERDC curriculum for ${s.level} ${s.name}`,
    topics: (s.level === 'Pre-Nursery' || s.level === 'Nursery') ? { assessment_type: 'TRAIT' } : { assessment_type: 'NUMERIC' }
  }))

  // 3. Insert subjects
  console.log(`Inserting ${dataToInsert.length} official subjects...`)
  const { error: insError } = await supabase.from('subjects').insert(dataToInsert)
  
  if (insError) {
    console.error('Error inserting subjects:', insError.message)
  } else {
    console.log('✅ SUBJECT SYNC COMPLETED SUCCESSFULLY!')
    console.log(`Total subjects synchronized: ${dataToInsert.length}`)
  }
}

syncSubjects()
