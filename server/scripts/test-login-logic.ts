
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testLogin(email: string, pass: string) {
  console.log(`Testing login for ${email}...`);
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('User not found in Supabase:', error.message);
    return;
  }

  console.log('User found. Verifying password...');
  const isMatch = await bcrypt.compare(pass, user.password);
  
  if (isMatch) {
    console.log('✅ Login successful! Password matches.');
  } else {
    console.log('❌ Login failed! Password does not match.');
    console.log('Stored hash:', user.password);
  }
}

const email = process.argv[2] || 'admin@folusho.com';
const pass = process.argv[3] || 'admin12345';

testLogin(email, pass);
