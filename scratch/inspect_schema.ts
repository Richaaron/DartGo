
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function inspectSchema() {
  console.log('Inspecting activities table schema...')
  // We can use a direct SQL query via the supabase client if we have a way to run raw SQL, 
  // but the JS client doesn't support raw SQL directly without an RPC.
  // However, selecting from a table returns the columns in the response headers or data.
  const { data, error } = await supabase.from('activities').select('*').limit(1)
  
  if (error) {
    console.error('Error:', error)
  } else {
    // If we have data, we can see the keys. If not, we might be out of luck with just 'select'.
    // BUT! We can try to insert a record with NO fields and see what default fields come back.
    console.log('Row count:', data.length)
    if (data.length > 0) {
      console.log('Fields:', Object.keys(data[0]))
    } else {
      console.log('Table is empty. Trying to find columns via common fields...')
      // Try to see if 'id' and 'created_at' exist
      const { data: testData, error: testError } = await supabase.from('activities').select('id, created_at').limit(1)
      if (testError) {
        console.error('Basic fields check failed:', testError)
      } else {
        console.log('Basic fields (id, created_at) exist.')
      }
    }
  }
}

inspectSchema()
