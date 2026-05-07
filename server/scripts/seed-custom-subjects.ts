import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const NEW_SUBJECTS = [
  // Pre-Nursery & Nursery (7 subjects)
  ...['Pre-Nursery', 'Nursery'].flatMap(level => [
    { name: 'Mathematics', code: `MTH-${level.toUpperCase().substring(0,3)}`, level, subject_category: 'CORE' },
    { name: 'English', code: `ENG-${level.toUpperCase().substring(0,3)}`, level, subject_category: 'CORE' },
    { name: 'Social Habits', code: `SOH-${level.toUpperCase().substring(0,3)}`, level, subject_category: 'CORE' },
    { name: 'Health Habits', code: `HHB-${level.toUpperCase().substring(0,3)}`, level, subject_category: 'CORE' },
    { name: 'Rhymes', code: `RHM-${level.toUpperCase().substring(0,3)}`, level, subject_category: 'CORE' },
    { name: 'Primary Science', code: `PSC-${level.toUpperCase().substring(0,3)}`, level, subject_category: 'CORE' },
    { name: 'Phonics', code: `PHN-${level.toUpperCase().substring(0,3)}`, level, subject_category: 'CORE' },
  ]),
  
  // Primary 1-3 (17 subjects)
  ...['Primary 1', 'Primary 2', 'Primary 3'].flatMap(p => [
    { name: 'Mathematics', code: `MTH-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'English Language', code: `ENG-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'National Values', code: `NVL-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Basic Technology', code: `BTE-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Basic Science', code: `BSC-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Physical & Health Education', code: `PHE-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Computer studies', code: `CST-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Religious studies', code: `RES-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Phonics', code: `PHN-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Home Economics', code: `HEC-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Literature', code: `LIT-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Vocational Aptitude', code: `VAP-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Writing', code: `WRT-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Creative Arts', code: `CAR-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Verbal Reasoning', code: `VRR-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Quantitative Reasoning', code: `QTR-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Agricultural Science', code: `AGS-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
  ]),

  // Primary 4-6 (16 subjects)
  ...['Primary 4', 'Primary 5', 'Primary 6'].flatMap(p => [
    { name: 'Mathematics', code: `MTH-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'English Language', code: `ENG-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'National Values', code: `NVL-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Basic Technology', code: `BTE-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Basic Science', code: `BSC-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Physical & Health Education', code: `PHE-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Computer studies', code: `CST-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Religious studies', code: `RES-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Phonics', code: `PHN-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Home Economics', code: `HEC-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Literature', code: `LIT-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Vocational Aptitude', code: `VAP-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Creative Arts', code: `CAR-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Verbal Reasoning', code: `VRR-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Quantitative Reasoning', code: `QTR-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
    { name: 'Agricultural Science', code: `AGS-${p.replace(' ','')}`, level: 'Primary', subject_category: 'CORE' },
  ]),
  
  // Junior Secondary (13 subjects)
  ...['JSS1', 'JSS2', 'JSS3'].flatMap(j => [
    { name: 'Mathematics', code: `MTH-${j}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'English Language', code: `ENG-${j}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Basic Technology', code: `BTE-${j}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Basic Science', code: `BSC-${j}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Computer Studies', code: `CST-${j}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Religious Studies', code: `REL-${j}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Physical & Health Education', code: `PHE-${j}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Fine Arts', code: `FAA-${j}`, level: 'Secondary', subject_category: 'ELECTIVE' },
    { name: 'Business Studies', code: `BUS-${j}`, level: 'Secondary', subject_category: 'ELECTIVE' },
    { name: 'National Values', code: `NVL-${j}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Agricultural science', code: `AGS-${j}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Home Economics', code: `HEC-${j}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Hausa', code: `HAU-${j}`, level: 'Secondary', subject_category: 'CORE' },
  ]),
  
  // Senior Secondary - Core/General (9 subjects)
  ...['SSS1', 'SSS2', 'SSS3'].flatMap(s => [
    { name: 'Mathematics', code: `MTH-${s}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'English Language', code: `ENG-${s}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Biology', code: `BIO-${s}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Geography', code: `GEO-${s}`, level: 'Secondary', subject_category: 'ELECTIVE' },
    { name: 'Agricultural Science', code: `AGS-${s}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Civic Education', code: `CVE-${s}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Marketing', code: `MKT-${s}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'ICT', code: `ICT-${s}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Economics', code: `ECO-${s}`, level: 'Secondary', subject_category: 'CORE' },
    
    // Arm Specific
    { name: 'Chemistry', code: `CHM-${s}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Physics', code: `PHY-${s}`, level: 'Secondary', subject_category: 'CORE' },
    { name: 'Government', code: `GOV-${s}`, level: 'Secondary', subject_category: 'ELECTIVE' },
    { name: 'Literature In English', code: `LIT-${s}`, level: 'Secondary', subject_category: 'ELECTIVE' },
    { name: 'Accounting', code: `ACC-${s}`, level: 'Secondary', subject_category: 'ELECTIVE' },
    { name: 'Commerce', code: `COM-${s}`, level: 'Secondary', subject_category: 'ELECTIVE' },
  ])
]

async function seed() {
  console.log('[SEED] Cleaning existing subjects...')
  const { error: deleteError } = await supabase.from('subjects').delete().neq('name', 'KEEP_PLACEHOLDER')
  if (deleteError) {
    console.error('❌ Failed to clean subjects:', deleteError.message)
    process.exit(1)
  }

  console.log(`[SEED] Seeding ${NEW_SUBJECTS.length} new subjects...`)
  
  const subjectsToInsert = NEW_SUBJECTS.map(s => ({
    ...s,
    credit_units: 2,
    curriculum_type: 'NIGERIAN',
    description: `${s.level} ${s.name}`
  }))

  const { error: insertError } = await supabase.from('subjects').insert(subjectsToInsert)
  
  if (insertError) {
    console.error('❌ Failed to seed subjects:', insertError.message)
    process.exit(1)
  }

  console.log('✅ Subject bank updated successfully!')
}

seed().catch(console.error)
