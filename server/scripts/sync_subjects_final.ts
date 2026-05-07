import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mlhoeaojalsiptkkmupi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saG9lYW9qYWxzaXB0a2ttdXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjcwMTcyOSwiZXhwIjoyMDkyMjc3NzI5fQ.A_hRQ704WZWRYdFJ26lYjundY6RabeU4457c2SK_muE'

const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_SUBJECTS = [
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
  
  // Primary 1-6
  ...[1, 2, 3, 4, 5, 6].flatMap(p => {
    const prefix = `P${p}`;
    return [
      { name: 'Mathematics', code: `${prefix}-MTH`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
      { name: 'English', code: `${prefix}-ENG`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
      { name: 'Social Habits', code: `${prefix}-SOH`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
      { name: 'Health Habits', code: `${prefix}-HHB`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
      { name: 'Rhymes', code: `${prefix}-RHM`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
      { name: 'Primary Science', code: `${prefix}-PSC`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
      { name: 'Phonics', code: `${prefix}-PHN`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
      ...(p <= 3 ? [{ name: 'Writing', code: `${prefix}-WRT`, level: 'Primary', credit_units: 2, subject_category: 'CORE' }] : []),
      { name: 'Creative Arts', code: `${prefix}-CAR`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
      { name: 'Verbal Reasoning', code: `${prefix}-VRR`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
      { name: 'Quantitative Reasoning', code: `${prefix}-QTR`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
      { name: 'Agricultural Science', code: `${prefix}-AGS`, level: 'Primary', credit_units: 2, subject_category: 'CORE' },
    ]
  }),
  
  // Secondary
  ...['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'].flatMap(level => {
    const prefix = level;
    const isSSS = level.startsWith('SSS');
    const subjects = [
      { name: 'Mathematics', code: `${prefix}-MTH`, level: 'Secondary', credit_units: isSSS ? 3 : 2, subject_category: 'CORE' },
      { name: 'English Language', code: `${prefix}-ENG`, level: 'Secondary', credit_units: isSSS ? 3 : 2, subject_category: 'CORE' },
      { name: 'Agricultural Science', code: `${prefix}-AGS`, level: 'Secondary', credit_units: isSSS ? 3 : 2, subject_category: 'CORE' },
    ];

    if (!isSSS) {
      subjects.push(
        { name: 'Basic Technology', code: 'BTE', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'Basic Science', code: 'BSC', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'Computer Studies', code: 'CST', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'Religious Studies', code: 'REL', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'Physical & Health Education', code: 'PHE', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'Fine Arts', code: 'FAA', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'Business Studies', code: 'BUS', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'National Values', code: 'NVL', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'Home Economics', code: 'HEC', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'Hausa', code: 'HAU', level: 'Secondary', credit_units: 2, subject_category: 'CORE' }
      );
    } else {
      subjects.push(
        { name: 'Biology', code: 'BIO', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
        { name: 'Geography', code: 'GEO', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
        { name: 'Civic Education', code: 'CVE', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'Marketing', code: 'MKT', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'ICT', code: 'ICT', level: 'Secondary', credit_units: 2, subject_category: 'CORE' },
        { name: 'Economics', code: 'ECO', level: 'Secondary', credit_units: 3, subject_category: 'CORE' },
        { name: 'Chemistry', code: 'CHM', level: 'Secondary', credit_units: 3, subject_category: 'Science' },
        { name: 'Physics', code: 'PHY', level: 'Secondary', credit_units: 3, subject_category: 'Science' },
        { name: 'Government', code: 'GOV', level: 'Secondary', credit_units: 2, subject_category: 'Art' },
        { name: 'Literature In English', code: 'LIT', level: 'Secondary', credit_units: 3, subject_category: 'Art' },
        { name: 'Accounting', code: 'ACC', level: 'Secondary', credit_units: 3, subject_category: 'Commercial' },
        { name: 'Commerce', code: 'COM', level: 'Secondary', credit_units: 2, subject_category: 'Commercial' }
      );
    }
    return subjects;
  }),
]

async function sync() {
  console.log('Starting sync...')

  // Step 1: Fix constraint by dropping it if possible (via RPC if available)
  // But wait, if I can't run SQL, I should at least try to update by ID.
  
  const { data: existing } = await supabase.from('subjects').select('*')
  console.log(`Found ${existing?.length} existing subjects.`)

  for (const subject of DEFAULT_SUBJECTS) {
    // Check for exact match by name and level
    const match = existing?.find(s => s.name === subject.name && s.level === subject.level)
    
    if (match) {
      // Update by ID (bypass code constraint check on update if possible, but code might still conflict)
      const { error } = await supabase
        .from('subjects')
        .update({
          code: subject.code, // Might fail if code is already used by another ID
          subject_category: subject.subject_category,
          credit_units: subject.credit_units
        })
        .eq('id', match.id)
      
      if (error) {
        console.error(`Error updating ${subject.name} (${subject.level}): ${error.message}`)
      } else {
        console.log(`Updated ${subject.name} (${subject.level})`)
      }
    } else {
      // Insert
      // To avoid code constraint, let's append level if it fails?
      const { error } = await supabase.from('subjects').insert([subject])
      if (error) {
        console.error(`Error inserting ${subject.name} (${subject.level}): ${error.message}`)
        if (error.message.includes('unique constraint')) {
          // Try with unique code
          const uniqueCode = `${subject.code}-${subject.level.substring(0, 1)}`
          const { error: retryError } = await supabase.from('subjects').insert([{ ...subject, code: uniqueCode }])
          if (retryError) console.error(`Retry failed for ${subject.name}: ${retryError.message}`)
          else console.log(`Inserted ${subject.name} with unique code ${uniqueCode}`)
        }
      } else {
        console.log(`Inserted ${subject.name} (${subject.level})`)
      }
    }
  }
  
  console.log('Done.')
}

sync()
