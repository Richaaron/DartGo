import { supabase } from '../server/src/config/supabase'

async function check() {
  const { data, error } = await supabase.from('school_config').select('*')
  console.log('School Config:', data)
  console.log('Error:', error)
}
check()
