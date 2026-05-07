import '../src/utils/env-loader.js'
import { supabase } from '../src/config/supabase.js'

async function updateAcademicSession() {
  console.log('[UPDATE] Setting academic year to 2025/2026 - 3rd Term...')
  
  const { error } = await supabase
    .from('school_config')
    .update({ 
      current_academic_year: '2025/2026',
      current_term: '3rd Term'
    })
    .match({ school_name: 'FOLUSHO VICTORY SCHOOLS' })

  if (error) {
    console.error('[UPDATE] ❌ Error:', error.message)
  } else {
    console.log('✅ Academic Year  → 2025/2026')
    console.log('✅ Current Term   → 3rd Term')
    console.log('✅ School config updated successfully!')
  }
}

updateAcademicSession()
