import { supabase } from '../src/config/supabase.js'
import bcrypt from 'bcryptjs'

// Comprehensive Nigerian School Curriculum Subjects
const NIGERIAN_SUBJECTS = [
  // PRE-NURSERY SUBJECTS
  { name: 'Numeracy', code: 'NUM-PN', level: 'Pre-Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Basic number recognition and counting' },
  { name: 'Early Literacy', code: 'LIT-PN', level: 'Pre-Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Introduction to letters and phonics' },
  { name: 'Personal Development', code: 'PD-PN', level: 'Pre-Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Social and emotional development' },
  { name: 'Creative Arts', code: 'ART-PN', level: 'Pre-Nursery', creditUnits: 1, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Drawing, painting and crafts' },
  { name: 'Physical Development', code: 'PHY-PN', level: 'Pre-Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Motor skills and physical activities' },

  // NURSERY SUBJECTS
  { name: 'Numeracy', code: 'NUM-NS', level: 'Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Number operations and basic arithmetic' },
  { name: 'Literacy', code: 'LIT-NS', level: 'Nursery', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Reading, writing and comprehension' },
  { name: 'Phonics', code: 'PHO-NS', level: 'Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Sound recognition and blending' },
  { name: 'Environmental Studies', code: 'ENV-NS', level: 'Nursery', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Introduction to nature and environment' },
  { name: 'Creative Arts', code: 'ART-NS', level: 'Nursery', creditUnits: 1, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Art, music and creative expression' },
  { name: 'Physical Education', code: 'PE-NS', level: 'Nursery', creditUnits: 1, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Sports and physical activities' },
  { name: 'Social Studies', code: 'SS-NS', level: 'Nursery', creditUnits: 1, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Community and family awareness' },

  // PRIMARY SCHOOL SUBJECTS (Classes 1-6)
  { name: 'English Language', code: 'ENG-PR', level: 'Primary', creditUnits: 4, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Comprehensive English language skills' },
  { name: 'Mathematics', code: 'MTH-PR', level: 'Primary', creditUnits: 4, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Numeracy and mathematical concepts' },
  { name: 'Basic Science', code: 'BSC-PR', level: 'Primary', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Introduction to science concepts' },
  { name: 'Social Studies', code: 'SS-PR', level: 'Primary', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Civic education and social sciences' },
  { name: 'Creative Arts', code: 'ART-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Visual arts and music' },
  { name: 'Physical Education', code: 'PE-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Sports and health education' },
  { name: 'Computer Studies', code: 'CST-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'ICT basics and computer literacy' },
  { name: 'Islamic Religion Studies', code: 'IRS-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Islamic education and ethics' },
  { name: 'Christian Religion Studies', code: 'CRS-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Christian education and ethics' },
  { name: 'Yoruba Language', code: 'YOR-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Yoruba language and culture' },
  { name: 'Igbo Language', code: 'IGB-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Igbo language and culture' },
  { name: 'Hausa Language', code: 'HSA-PR', level: 'Primary', creditUnits: 2, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Hausa language and culture' },

  // SECONDARY SCHOOL SUBJECTS (JSS 1-3 and SSS 1-3)
  { name: 'English Language', code: 'ENG-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Advanced English language and literature' },
  { name: 'Mathematics', code: 'MTH-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Advanced mathematics' },
  { name: 'Integrated Science', code: 'ISC-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Biology, Chemistry, Physics (JSS)' },
  { name: 'Social Studies', code: 'SS-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Civic education, history, geography' },
  { name: 'Physics', code: 'PHY-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO Physics curriculum' },
  { name: 'Chemistry', code: 'CHM-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO Chemistry curriculum' },
  { name: 'Biology', code: 'BIO-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO Biology curriculum' },
  { name: 'Further Mathematics', code: 'FMT-SEC', level: 'Secondary', creditUnits: 5, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Advanced mathematics (SSS 2-3)' },
  { name: 'Literature in English', code: 'LEN-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO Literature curriculum' },
  { name: 'History', code: 'HIS-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'World and African history' },
  { name: 'Geography', code: 'GEO-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Physical and human geography' },
  { name: 'Government', code: 'GOV-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Political science and government' },
  { name: 'Economics', code: 'ECO-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Economics principles and applications' },
  { name: 'Computer Science', code: 'CSC-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO Computer Science' },
  { name: 'Information Technology', code: 'IT-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'VOCATIONAL', curriculumType: 'NIGERIAN', description: 'Practical ICT skills' },
  { name: 'Business Studies', code: 'BUS-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Commerce and business concepts' },
  { name: 'Accounting', code: 'ACC-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Bookkeeping and accounting principles' },
  { name: 'Technical Drawing', code: 'TD-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'VOCATIONAL', curriculumType: 'NIGERIAN', description: 'Engineering and technical drawing' },
  { name: 'French', code: 'FRN-SEC', level: 'Secondary', creditUnits: 4, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'WAEC/NECO French' },
  { name: 'Yoruba', code: 'YOR-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Yoruba language and culture' },
  { name: 'Igbo', code: 'IGB-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Igbo language and culture' },
  { name: 'Hausa', code: 'HSA-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Hausa language and culture' },
  { name: 'Arabic', code: 'ARB-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Arabic language and culture' },
  { name: 'Physical Education', code: 'PE-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Sports science and health education' },
  { name: 'Health Education', code: 'HED-SEC', level: 'Secondary', creditUnits: 2, subjectCategory: 'CORE', curriculumType: 'NIGERIAN', description: 'Health and wellness education' },
  { name: 'Islamic Religion Studies', code: 'IRS-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Islamic education (WAEC/NECO)' },
  { name: 'Christian Religion Studies', code: 'CRS-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Christian education (WAEC/NECO)' },
  { name: 'Fine Arts', code: 'FA-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Visual arts and design' },
  { name: 'Music', code: 'MUS-SEC', level: 'Secondary', creditUnits: 3, subjectCategory: 'ELECTIVE', curriculumType: 'NIGERIAN', description: 'Music theory and practice' },
]

async function seed() {
  console.log('[SEED] Starting Supabase seeding...')

  // 1. Create Default Admin
  const hashedPassword = await bcrypt.hash('AdminPassword123!@#', 10)
  const { data: admin, error: adminError } = await supabase
    .from('users')
    .upsert({
      email: 'admin@folusho.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'Admin'
    })
    .select()

  if (adminError) console.error('[SEED] Error creating admin:', adminError)
  else console.log('✅ Created default admin')

  // 2. Create Subjects
  const subjectsToInsert = NIGERIAN_SUBJECTS.map(s => ({
    name: s.name,
    code: s.code,
    level: s.level,
    credit_units: s.creditUnits,
    subject_category: s.subjectCategory,
    curriculum_type: s.curriculumType,
    description: s.description,
    topics: [] // Simplified for now
  }))

  const { data: insertedSubjects, error: subjectError } = await supabase
    .from('subjects')
    .upsert(subjectsToInsert, { onConflict: 'code' })
    .select()

  if (subjectError) console.error('[SEED] Error creating subjects:', subjectError)
  else console.log(`✅ Created ${insertedSubjects?.length} subjects`)

  // 3. Create Default Teacher
  const hashedTeacherPassword = await bcrypt.hash('TeacherPassword123!@#', 10)
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .upsert({
      email: 'teacher1@folusho.com',
      name: 'Mr. Adeyemi',
      teacher_id: 'T001',
      username: 'teacher1',
      password: hashedTeacherPassword,
      subject: 'Mathematics',
      level: 'Secondary',
      assigned_classes: ['SSS1A', 'SSS1B', 'SSS2A'],
      role: 'Teacher'
    })

  if (teacherError) console.error('[SEED] Error creating teacher:', teacherError)
  else console.log('✅ Created default teacher')

  console.log('[SEED] 🎓 Supabase seeding completed successfully!')
  process.exit(0)
}

seed().catch(console.error)
