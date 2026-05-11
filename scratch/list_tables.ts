
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: 'server/.env' })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function listTables() {
  const { data, error } = await supabase
    .from('pg_catalog.pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
  
  if (error) {
    // If pg_tables is restricted, try another way
    console.error('Error listing tables via pg_tables:', error)
    
    const tablesToTry = [
      'students', 'subjects', 'teachers', 'users', 'subject_results', 
      'attendance', 'notifications', 'activities', 'student_subjects',
      'schemes_of_work', 'observations', 'deadlines', 'config'
    ]
    
    console.log('Testing common table names...')
    for (const t of tablesToTry) {
      const { error: err } = await supabase.from(t).select('id').limit(1)
      if (!err || err.code !== 'PGRST116' && err.message.indexOf('does not exist') === -1) {
        console.log(`✅ ${t} exists`)
        if (t === 'student_subjects') {
          const { data: cols, error: colErr } = await supabase.from(t).select('*').limit(1)
          if (colErr) console.log(`Error fetching columns for ${t}:`, colErr.message)
          else console.log(`Columns for ${t}:`, Object.keys(cols[0] || {}))
        }
      } else {
        console.log(`❌ ${t} does not exist (${err.message})`)
      }
    }
  } else {
    console.log('Tables found:', data.map(t => t.tablename))
  }
}

listTables()
