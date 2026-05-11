import { supabase } from '../server/src/config/supabase'

async function check() {
  const { count, error } = await supabase.from('activities').select('*', { count: 'exact', head: true }).is('details', null)
  console.log('Activities with NULL details:', count)
  
  const { count: actionCount, error: actionError } = await supabase.from('activities').select('*', { count: 'exact', head: true }).is('action', null)
  console.log('Activities with NULL action:', actionCount)

  const { data: sample, error: sampleError } = await supabase.from('activities').select('*').limit(10)
  console.log('Sample details:', sample?.map(s => typeof s.details))
}
check()
