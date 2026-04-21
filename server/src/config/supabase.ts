import { createClient } from '@supabase/supabase-js'
import { getEnvConfig } from '../utils/envConfig'

const envConfig = getEnvConfig()

const supabaseUrl = envConfig.SUPABASE_URL
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[SUPABASE] ❌ Missing Supabase credentials in environment configuration')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('[SUPABASE] ✓ Client initialized using configuration utility')
