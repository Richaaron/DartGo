
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function test() {
  console.log('Testing activities table...')
  const { data, error } = await supabase.from('activities').select('*').limit(1)
  if (error) {
    console.error('Error fetching from activities table:', error)
  } else {
    console.log('Successfully fetched from activities table. Row count:', data.length)
    if (data.length > 0) {
      console.log('First row keys:', Object.keys(data[0]))
    }
  }
}

test()
