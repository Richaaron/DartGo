import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mlhoeaojalsiptkkmupi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saG9lYW9qYWxzaXB0a2ttdXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjcwMTcyOSwiZXhwIjoyMDkyMjc3NzI5fQ.A_hRQ704WZWRYdFJ26lYjundY6RabeU4457c2SK_muE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function reset() {
  console.log('Attempting to delete all subjects...')
  const { error } = await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  if (error) {
    console.error('Delete failed:', error.message)
    if (error.message.includes('foreign key constraint')) {
      console.log('Cannot delete because subjects are linked to results or students.')
    }
  } else {
    console.log('Successfully deleted all subjects.')
  }
}

reset()
