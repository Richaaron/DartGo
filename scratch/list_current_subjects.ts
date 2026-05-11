import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function listSubjects() {
  const { data, error } = await supabase.from('subjects').select('name, level, code')
  if (error) {
    console.error('Error fetching subjects:', error.message)
    return
  }
  
  const levels = [...new Set(data.map(s => s.level))]
  console.log(`Total subjects in DB: ${data.length}`)
  
  levels.forEach(lvl => {
    const count = data.filter(s => s.level === lvl).length
    console.log(`- ${lvl}: ${count} subjects`)
  })

  console.log('\nSubject List:')
  data.forEach(s => {
    console.log(`[${s.level}] ${s.name} (${s.code})`)
  })
}

listSubjects()
