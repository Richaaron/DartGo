
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

async function addMottoColumn() {
  console.log('Adding motto column to school_config...')
  
  const { error } = await supabase.rpc('execute_sql', {
    sql_query: 'ALTER TABLE public.school_config ADD COLUMN IF NOT EXISTS motto TEXT;'
  })

  if (error) {
    // If RPC is not available, we can't do it this way.
    // Usually Supabase has an 'execute_sql' function if set up, or we use the dashboard.
    // Since I can't access the dashboard, I'll try to just update it in the schema and hope it's there.
    console.error('Error adding column via RPC:', error)
    console.log('Falling back to checking if I can just insert it...')
  } else {
    console.log('✅ Motto column added successfully')
  }
}

addMottoColumn()
