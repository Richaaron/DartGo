import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearDrafts() {
  console.log('Fetching all subject results...');
  const { data: results, error: fetchError } = await supabase
    .from('subject_results')
    .select('id');

  if (fetchError) {
    console.error('Error fetching results:', fetchError);
    return;
  }

  console.log(`Found ${results?.length || 0} results total.`);

  if (!results || results.length === 0) {
    console.log('No results to clear.');
    return;
  }

  console.log('Clearing all subject results table contents...');
  const { error: deleteError } = await supabase
    .from('subject_results')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('Error deleting results:', deleteError);
  } else {
    console.log('✅ Successfully cleared all subject results.');
  }
}

clearDrafts();
