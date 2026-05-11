
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function inspectSchema() {
  const tables = ['students', 'subject_results', 'subjects', 'users', 'teachers']
  
  for (const table of tables) {
    console.log(`\nInspecting ${table}...`)
    
    // Check column types and constraints
    if (table === 'subjects') {
      const { data: columns, error: cError } = await supabase.rpc('execute_sql', {
        sql_query: `
          SELECT column_name, data_type, udt_name 
          FROM information_schema.columns 
          WHERE table_name = 'subjects' AND table_schema = 'public';
        `
      })
      if (!cError) console.log('Columns for subjects:', columns)
    }

    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.error(`Error inspecting ${table}:`, error)
    } else if (data && data.length > 0) {
      console.log(`Columns for ${table}:`, Object.keys(data[0]))
    } else {
      console.log(`Table ${table} is empty.`)
    }
  }
}

inspectSchema()
