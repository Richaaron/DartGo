import '../src/utils/env-loader.js'
import { supabase } from '../src/config/supabase.js'

async function checkConfig() {
  const { data, error } = await supabase.from('school_config').select('*')
  if (error) console.error(error)
  else console.log('Current School Config:', data)
}

checkConfig()
