
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function addArmColumn() {
  console.log('Attempting to add arm column to students table...')
  
  const sql = `
    ALTER TABLE students ADD COLUMN IF NOT EXISTS arm TEXT;
  `
  
  const { error } = await (supabase as any).rpc('exec_sql', { sql_string: sql })
  
  if (error) {
    console.error('Failed to run SQL via RPC:', error.message)
    console.log('\nIMPORTANT: Please run the following SQL in your Supabase SQL Editor:')
    console.log(sql)
  } else {
    console.log('Successfully added arm column to students table!')
  }
}

addArmColumn()
