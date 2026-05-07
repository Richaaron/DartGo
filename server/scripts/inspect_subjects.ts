import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function inspectSubjects() {
  const { data, error } = await supabase.from('subjects').select('*').limit(1)
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Sample row:', data[0])
    console.log('Columns:', Object.keys(data[0] || {}))
  }
}

inspectSubjects()
