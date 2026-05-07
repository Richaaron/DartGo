
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function inspectTable() {
  console.log('Inspecting activities table columns...')
  // We can use a RPC or just query a non-existent column to see the error message which sometimes lists valid columns,
  // or better, query information_schema if we have permissions.
  // Since we have service role, let's try information_schema.
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'activities' })
  
  if (error) {
    console.log('RPC failed, trying fallback inspection...')
    // Fallback: try to select one row and see what we get
    const { data: rowData, error: rowError } = await supabase.from('activities').select('*').limit(1)
    if (rowError) {
      console.error('Fallback failed:', rowError)
    } else if (rowData.length > 0) {
      console.log('Columns found in first row:', Object.keys(rowData[0]))
    } else {
      console.log('Table is empty. Cannot determine columns via select *.')
    }
  } else {
    console.log('Columns:', data)
  }
}

inspectTable()
