
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkColumns() {
  const cols = ['user_id', 'user_name', 'action', 'details', 'entity_type', 'entity_id', 'user_role']
  console.log('Checking for specific columns...')
  for (const col of cols) {
    const { error } = await supabase.from('activities').select(col).limit(1)
    if (error) {
      console.log(`❌ Column '${col}' is missing or error:`, error.message)
    } else {
      console.log(`✅ Column '${col}' exists.`)
    }
  }
}

checkColumns()
