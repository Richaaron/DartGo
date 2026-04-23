import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase'
import { authLimiter } from '../middleware/security'
import { authenticate, AuthRequest } from '../middleware/auth'
import { generateToken, hashSensitiveData } from '../middleware/enhanced-auth'
import {
  validateEmail,
  validatePassword,
  validateName,
  validateRequiredFields,
} from '../utils/validation'
import { getEnvConfig } from '../utils/envConfig'

const router = Router()
const envConfig = getEnvConfig()

/**
 * Health check endpoint to verify Supabase connectivity
 */
router.get('/health', async (req, res) => {
  try {
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true }).limit(1)
    res.json({
      status: 'ok',
      database: error ? 'error' : 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ status: 'error' })
  }
})

/**
 * Login endpoint with Supabase backend
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body
    console.log(`[AUTH] Login attempt for: ${email}`)

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email/Username and password are required',
        code: 'MISSING_FIELDS',
      })
    }

    const normalizedLoginId = email.toLowerCase().trim()

    // 0. Robust Auto-seed/Reset admin (ensures user always has access)
    if (normalizedLoginId === 'admin@folusho.com' || normalizedLoginId === 'teacher@folusho.com') {
      try {
        const isTeacher = normalizedLoginId === 'teacher@folusho.com'
        const table = isTeacher ? 'teachers' : 'users'
        const email = isTeacher ? 'teacher@folusho.com' : 'admin@folusho.com'
        const defaultPassword = isTeacher ? 'TeacherPassword123!' : 'AdminPassword123!@#'
        
        const { data: existingUser, error: checkError } = await supabase
          .from(table)
          .select('id')
          .eq('email', email)
          .single()
        
        if (checkError && checkError.code === 'PGRST116') {
          console.log(`[AUTH] 🚀 ${isTeacher ? 'Teacher' : 'Admin'} user missing. Seeding now...`)
          const hashedPassword = await bcrypt.hash(defaultPassword, 10)
          
          if (isTeacher) {
            await supabase.from('teachers').insert({
              email: email,
              name: 'Default Teacher',
              username: 'teacher',
              teacher_id: 'TCH-001',
              password: hashedPassword,
              subject: 'General',
              level: 'Primary',
              role: 'Teacher',
              assigned_classes: ['Primary 1', 'Primary 2', 'Primary 3', 'JSS 1', 'JSS 2', 'JSS 3']
            })
          } else {
            await supabase.from('users').insert({
              email: email,
              name: 'Admin User',
              password: hashedPassword,
              role: 'Admin'
            })
          }
          console.log(`[AUTH] ✅ ${isTeacher ? 'Teacher' : 'Admin'} seeded successfully.`)
        }
      } catch (err) {
        console.error('[AUTH] Critical error during auto-seed maintenance:', err)
      }
    }

    // 1. Try to find user in 'users' table (Admin/etc)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedLoginId)
      .single()

    let foundUser = userData
    let role = userData?.role

    // 2. If not found, try 'teachers' table
    if (!foundUser) {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .or(`email.eq.${normalizedLoginId},username.eq.${normalizedLoginId},teacher_id.eq.${normalizedLoginId}`)
        .single()
      
      if (teacherError && !teacherError.message.includes('JSON object')) {
        console.log(`[AUTH] Teacher table search error: ${teacherError.message}`)
      }
      
      if (teacherData) {
        foundUser = teacherData
        role = 'Teacher'
      }
    }

    // 3. If not found, try 'students' table (Parent login)
    if (!foundUser) {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .or(`parent_username.eq.${normalizedLoginId},parent_email.eq.${normalizedLoginId}`)
        .single()

      if (studentData) {
        let isParentValid = false
        try {
          isParentValid = await bcrypt.compare(password, studentData.parent_password)
        } catch (e) {
          // Fallback for legacy plain-text passwords
          isParentValid = password === studentData.parent_password
        }

        // Second fallback: if bcrypt returns false but password is not a hash format
        if (!isParentValid && studentData.parent_password && !studentData.parent_password.startsWith('$2')) {
          isParentValid = password === studentData.parent_password
        }

        if (isParentValid) {
          const token = generateToken({
            id: studentData.id,
            role: 'Parent',
            email: normalizedLoginId,
          })

          return res.json({
            token,
            user: {
              role: 'Parent',
              email: studentData.parent_email,
              name: `${studentData.parent_name} (Parent of ${studentData.first_name})`,
              studentId: studentData.id,
              childName: studentData.first_name,
            },
          })
        }
      }
    }

    if (foundUser) {
      const isMatch = await bcrypt.compare(password, foundUser.password)
      
      if (!isMatch) {
        console.log(`[AUTH] Password mismatch for: ${email}`)
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        })
      }

      const token = generateToken({
        id: foundUser.id,
        role: role,
        email: foundUser.email,
      })

      console.log(`[AUTH] Login successful: ${hashSensitiveData(normalizedLoginId)} (${role})`)

      return res.json({
        token,
        user: {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          role: role,
          subject: foundUser.subject,
          level: foundUser.level,
          assignedClasses: foundUser.assigned_classes,
        },
      })
    }

    return res.status(401).json({
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS',
    })

  } catch (error) {
    console.error('[AUTH] Login error:', error)
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR',
    })
  }
})

/**
 * Register endpoint with Supabase
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name, role } = req.body

    const requiredFields = validateRequiredFields(req.body, ['email', 'password', 'name', 'role'])
    if (!requiredFields.isValid) {
      return res.status(400).json({ error: requiredFields.errors[0] })
    }

    const emailVal = validateEmail(email)
    const passVal = validatePassword(password)
    if (!emailVal.isValid || !passVal.isValid) {
      return res.status(400).json({ error: 'Invalid email or weak password' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: emailVal.value,
        password: hashedPassword,
        name: name,
        role: role
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email already exists' })
      throw error
    }

    res.status(201).json({ message: 'User registered successfully', user: { id: data.id, email: data.email } })

  } catch (error) {
    console.error('[AUTH] Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

/**
 * Change Password endpoint
 */
router.post('/change-password', authenticate, authLimiter, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = req.user

    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    // 1. Find user in the appropriate table
    let table = 'users'
    if (user.role === 'Teacher') table = 'teachers'
    else if (user.role === 'Parent') table = 'students'

    const { data: dbUser, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError || !dbUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // 2. Verify current password
    const passwordField = user.role === 'Parent' ? 'parent_password' : 'password'
    const isMatch = await bcrypt.compare(currentPassword, dbUser[passwordField])
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' })
    }

    // 3. Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const { error: updateError } = await supabase
      .from(table)
      .update({ [passwordField]: hashedPassword })
      .eq('id', user.id)

    if (updateError) throw updateError

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('[AUTH] Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
})

export default router
