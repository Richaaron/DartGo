
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function inspectStudents() {
  console.log('Inspecting students table columns...')
  const { data: rowData, error: rowError } = await supabase.from('students').select('*').limit(1)
  if (rowError) {
    console.error('Failed to query students table:', rowError.message)
  } else if (rowData && rowData.length > 0) {
    console.log('Columns found:', Object.keys(rowData[0]))
  } else {
    const { error: colError } = await supabase.from('students').select('arm').limit(1)
    if (colError) {
      console.log('Arm column does NOT exist or error:', colError.message)
    } else {
      console.log('Arm column exists.')
    }
  }
}

inspectStudents()
