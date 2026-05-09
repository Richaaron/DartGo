import { supabase } from '../server/src/config/supabase';

async function clearDrafts() {
  console.log('Fetching results...');
  const { data: results, error: fetchError } = await supabase
    .from('subject_results')
    .select('*');

  if (fetchError) {
    console.error('Error fetching results:', fetchError);
    return;
  }

  console.log(`Found ${results?.length || 0} results.`);

  if (!results || results.length === 0) {
    console.log('No results to clear.');
    return;
  }

  // Delete all results
  console.log('Clearing all results...');
  const { error: deleteError } = await supabase
    .from('subject_results')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

  if (deleteError) {
    console.error('Error deleting results:', deleteError);
  } else {
    console.log('Successfully cleared all subject results.');
  }
}

clearDrafts();
