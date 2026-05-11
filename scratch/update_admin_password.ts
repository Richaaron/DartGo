import { supabase } from '../server/src/config/supabase'
import bcrypt from 'bcryptjs'

async function checkAdmin() {
  const email = 'admin@folusho.com'
  const newPassword = 'FolushoVIC1@@'
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  console.log('--- Admin Maintenance ---')
  
  // 1. Check in 'users' table
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (fetchError && fetchError.code === 'PGRST116') {
    console.log('Admin user not found. Creating...')
    const { error: insertError } = await supabase.from('users').insert({
      email,
      name: 'Folusho Admin',
      password: hashedPassword,
      role: 'Admin'
    })
    if (insertError) console.error('Error creating admin:', insertError)
    else console.log('Admin created successfully.')
  } else if (user) {
    console.log('Admin user found. Updating password to FolushoVIC1@@...')
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, name: 'Folusho Admin' })
      .eq('email', email)
    
    if (updateError) console.error('Error updating admin:', updateError)
    else console.log('Admin password updated successfully.')
  } else {
    console.error('Error fetching admin:', fetchError)
  }

  // 2. Also check 'teachers' table just in case they are logging in as a teacher with that email
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .eq('email', email)
    .single()

  if (teacher) {
    console.log('Teacher found with same email. Updating password to FolushoVIC1@@...')
    const { error: tUpdateError } = await supabase
      .from('teachers')
      .update({ password: hashedPassword })
      .eq('email', email)
    if (tUpdateError) console.error('Error updating teacher:', tUpdateError)
    else console.log('Teacher password updated successfully.')
  }
}

checkAdmin()
