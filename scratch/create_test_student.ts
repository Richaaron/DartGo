
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../server/.env') })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestStudent() {
  console.log('Creating test student...')
  
  // First, get a class_id (we'll just use "Primary 1" as class_id for now if it's a string, or find one)
  const classId = 'Primary 1'

  const studentData = {
    first_name: 'Test',
    last_name: 'Student',
    registration_number: 'TS-2024-001',
    class_id: classId,
    class_name: classId,
    level: 'Primary',
    gender: 'Male',
    date_of_birth: '2015-05-08T00:00:00Z',
    parent_name: 'Test Parent',
    parent_email: 'testparent@example.com',
    parent_phone: '08012345678',
    status: 'Active',
    enrollment_date: new Date().toISOString()
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert(studentData)
    .select()
    .single()

  if (studentError) {
    console.error('Error creating student:', studentError)
    return
  }

  console.log('✅ Student created:', student.id)

  // Get some subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('level', 'Primary')
    .limit(5)

  if (!subjects || subjects.length === 0) {
    console.error('No subjects found')
    return
  }

  // Get a teacher_id
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .limit(1)
    .single()

  const teacherId = teacher?.id || '00000000-0000-0000-0000-000000000000'

  console.log(`Creating results for ${subjects.length} subjects...`)

  const results = subjects.map(s => {
    const ca1 = Math.floor(Math.random() * 10) + 10 // 10-20
    const ca2 = Math.floor(Math.random() * 10) + 10 // 10-20
    const exam = Math.floor(Math.random() * 30) + 30 // 30-60
    const totalScore = ca1 + ca2 + exam
    
    let grade = 'F'
    let remark = 'Fail'

    if (totalScore >= 70) { grade = 'A'; remark = 'Excellent' }
    else if (totalScore >= 60) { grade = 'B'; remark = 'Very Good' }
    else if (totalScore >= 50) { grade = 'C'; remark = 'Good' }
    else if (totalScore >= 45) { grade = 'D'; remark = 'Fair' }
    else if (totalScore >= 40) { grade = 'E'; remark = 'Weak Pass' }

    return {
      student_id: student.id,
      subject_id: s.id,
      class_id: classId,
      teacher_id: teacherId,
      academic_year: '2023/2024',
      term: 2, // Integer term
      ca1_score: ca1,
      ca2_score: ca2,
      exam_score: exam,
      total_score: totalScore,
      grade: grade,
      remark: remark,
      status: 'RELEASED'
    }
  })

  const { error: resultError } = await supabase
    .from('subject_results')
    .insert(results)

  if (resultError) {
    console.error('Error creating results:', resultError)
  } else {
    console.log('✅ Results created successfully')
  }

  // Create an observation
  const observation = {
    student_id: student.id,
    term: 2,
    academic_year: '2023/2024',
    recorded_by: 'Admin',
    punctuality: '5',
    neatness: '4',
    politeness: '5',
    honesty: '5',
    relationship_with_others: '5',
    leadership: '4',
    emotional_stability: '4',
    health: '5',
    self_control: '4',
    attendance: '5',
    cooperation: '5',
    reliability: '5',
    social_habits: '5',
    manual_skills: '4',
    dexterity: '4',
    fluency: '5',
    handwriting: '4',
    sports: '5',
    crafts: '3',
    hobbies: '4'
  }

  const { error: obsError } = await supabase
    .from('observations')
    .insert(observation)

  if (obsError) {
    console.error('Error creating observation:', obsError)
  } else {
    console.log('✅ Observation created successfully')
  }

  console.log('\n--- TEST DATA READY ---')
  console.log('Student ID:', student.id)
  console.log('Registration Number:', student.registration_number)
}

createTestStudent()
