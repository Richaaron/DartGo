
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function testInsert() {
  console.log('Testing activity insert...')
  const { data, error } = await supabase.from('activities').insert({
    user_id: 'test-user-id',
    user_name: 'Test User',
    role: 'Admin',
    action: 'POST /api/test',
    entity_type: 'test',
    entity_id: 'none',
    details: '{"test": true}'
  }).select()
  
  if (error) {
    console.error('Error inserting activity:', error)
  } else {
    console.log('Successfully inserted activity:', data)
  }
}

testInsert()
