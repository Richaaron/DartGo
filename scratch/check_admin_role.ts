import { supabase } from '../server/src/config/supabase'

async function check() {
  const { data: user, error: userError } = await supabase.from('users').select('*').eq('email', 'admin@folusho.com').single()
  console.log('User:', user)
  
  const { data: activities, error: activityError } = await supabase.from('activities').select('*').limit(5)
  console.log('Recent Activities:', activities)
  
  const { count, error: countError } = await supabase.from('activities').select('*', { count: 'exact', head: true }).is('action', null)
  console.log('Activities with NULL action:', count)
}
check()
