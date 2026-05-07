
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function updateSchema() {
  console.log('Attempting to add missing columns to activities table...')
  // We can use the 'rpc' method if 'run_sql' is enabled (often it is for service role)
  // Or we can try to use a dummy query that might trigger a schema update if it's auto-migrating (unlikely for Supabase)
  
  // Best way in Supabase without Dashboard is usually a custom RPC that runs SQL.
  // If that's not available, I'll have to tell the user.
  
  const sql = `
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_name TEXT;
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS role TEXT;
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_email TEXT;
  `
  
  const { error } = await (supabase as any).rpc('exec_sql', { sql_string: sql })
  
  if (error) {
    console.error('Failed to run SQL via RPC:', error.message)
    console.log('\nIMPORTANT: Please run the following SQL in your Supabase SQL Editor:')
    console.log(sql)
  } else {
    console.log('Successfully updated schema!')
  }
}

updateSchema()
