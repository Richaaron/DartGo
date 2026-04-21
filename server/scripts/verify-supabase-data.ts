
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyDatabase() {
  console.log('--- Supabase Database Verification ---');
  console.log(`URL: ${SUPABASE_URL}`);
  
  const tables = ['users', 'teachers', 'students', 'subjects', 'curriculums', 'schemes_of_work'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Table '${table}': ${error.message}`);
    } else {
      console.log(`✅ Table '${table}': ${count} records found.`);
      
      if (table === 'users' && count === 0) {
        console.warn('   ⚠️ WARNING: No users found! Login will fail.');
      }
      if (table === 'teachers' && count === 0) {
        console.warn('   ⚠️ WARNING: No teachers found!');
      }
    }
  }

  // Check for a specific user as a test
  const { data: sampleUser } = await supabase.from('users').select('email').limit(1).single();
  if (sampleUser) {
    console.log(`\nSample User found: ${sampleUser.email}`);
  }

  console.log('\nIf counts are 0, you need to run the migration script:');
  console.log('npx tsx scripts/migrate-mongo-to-supabase.ts');
}

verifyDatabase();
