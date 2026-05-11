
import axios from 'axios'

const API_URL = 'http://127.0.0.1:3001/api'

async function testFullFlow() {
  console.log('--- STARTING FULL FLOW TEST ---')

  try {
    // 1. Login
    console.log('1. Attempting login...')
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@folusho.com',
      password: 'Folusho@2024'
    })
    const token = loginRes.data.token
    console.log('✅ Login successful')

    const headers = { Authorization: `Bearer ${token}` }

    // 2. Create Student
    console.log('2. Creating test student...')
    const studentRes = await axios.post(`${API_URL}/students`, {
      firstName: 'Test',
      lastName: 'Student',
      registrationNumber: 'SEC/2024/0003',
      status: 'Active',
      level: 'Secondary',
      class: 'SSS 1',
      arm: 'Science',
      gender: 'Male',
      dateOfBirth: '2010-01-01',
      parentName: 'Test Parent',
      parentPhone: '08012345678',
      parentEmail: 'folushovictoryschool@gmail.com', // Use verified email
      parentPassword: 'password123'
    }, { headers })
    const student = studentRes.data
    console.log(`✅ Student created: ${student.firstName} ${student.lastName} (ID: ${student.id})`)

    // 3. Assign Subject
    console.log('3. Fetching subjects...')
    const subjectsRes = await axios.get(`${API_URL}/subjects`, { headers })
    const math = subjectsRes.data.find(s => s.name.includes('Mathematics'))
    
    if (math) {
      console.log(`Assigning ${math.name} to student...`)
      await axios.post(`${API_URL}/student-subjects`, {
        studentId: student.id,
        subjectId: math.id,
        academicYear: '2024/2025',
        term: '1st Term'
      }, { headers })
      console.log('✅ Subject assigned')
    }

    console.log('--- TEST COMPLETED SUCCESSFULLY ---')
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message)
  }
}

testFullFlow()
