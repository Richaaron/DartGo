
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function resetPassword(email: string, newPass: string) {
  console.log(`Resetting password for ${email}...`);
  
  const hashedPassword = await bcrypt.hash(newPass, 10);
  
  // Try users table
  const { data: user, error: userError } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('email', email)
    .select();

  if (user && user.length > 0) {
    console.log('✅ Updated in users table.');
    return;
  }

  // Try teachers table
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .update({ password: hashedPassword })
    .eq('email', email)
    .select();

  if (teacher && teacher.length > 0) {
    console.log('✅ Updated in teachers table.');
    return;
  }

  console.log('❌ User not found in either table.');
}

// Get arguments from command line
const email = process.argv[2];
const pass = process.argv[3];

if (!email || !pass) {
  console.log('Usage: npx tsx scripts/reset-password.ts <email> <new_password>');
  process.exit(1);
}

resetPassword(email, pass);
