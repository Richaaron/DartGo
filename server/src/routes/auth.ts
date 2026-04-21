import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase.js'
import { authLimiter } from '../middleware/security.js'
import { generateToken, hashSensitiveData } from '../middleware/enhanced-auth.js'
import {
  validateEmail,
  validatePassword,
  validateName,
  validateRequiredFields,
} from '../utils/validation.js'
import { getEnvConfig } from '../utils/envConfig.js'

const router = Router()
const envConfig = getEnvConfig()

/**
 * Login endpoint with Supabase backend
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email/Username and password are required',
        code: 'MISSING_FIELDS',
      })
    }

    const normalizedLoginId = email.toLowerCase().trim()

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
        .or(`email.eq.${normalizedLoginId},username.eq.${normalizedLoginId}`)
        .single()
      
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
        const isParentValid = await bcrypt.compare(password, studentData.parent_password)
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

    // Validate Password for User/Teacher
    if (foundUser) {
      const isMatch = await bcrypt.compare(password, foundUser.password)
      if (!isMatch) {
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

export default router
