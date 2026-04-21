import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { Teacher } from '../models/Teacher.js'
import { Student } from '../models/Student.js'
import { authLimiter } from '../middleware/security.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'
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
 * Login endpoint with security enhancements:
 * - Rate limiting
 * - Input validation
 * - Generic error messages to prevent user enumeration
 * - Bcrypt for password comparison
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

    // Try to find user in User collection
    let user: any = await User.findOne({ email: normalizedLoginId })
    let isValidUser = false

    if (user) {
      isValidUser = await user.comparePassword(password)
      if (!isValidUser) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        })
      }
    }

    // If not found in User, try Teacher
    if (!user) {
      user = await Teacher.findOne({
        $or: [{ email: normalizedLoginId }, { username: normalizedLoginId }],
      })
      if (user) {
        isValidUser = await user.comparePassword(password)
        if (!isValidUser) {
          return res.status(401).json({
            error: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          })
        }
      }
    }

    // If not found in Teacher, try Student (parent login)
    if (!user) {
      const student = await Student.findOne({ 
        $or: [
          { parentUsername: normalizedLoginId },
          { email: normalizedLoginId }
        ]
      })
      if (student) {
        isValidUser = await student.compareParentPassword(password)
        if (isValidUser) {
          const token = generateToken({
            id: student._id.toString(),
            role: 'Parent',
            email: normalizedLoginId,
          })

          console.log(`[AUTH] Parent login successful: ${hashSensitiveData(normalizedLoginId)}`)

          return res.json({
            token,
            user: {
              role: 'Parent',
              email: student.email,
              name: `${student.parentName} (Parent of ${student.firstName})`,
              studentId: student._id,
              childName: student.firstName,
            },
          })
        }
      }
      
      // If still not found or invalid
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      })
    }

    // Generate token using enhanced method
    const token = generateToken({
      id: user._id.toString(),
      role: user.role || 'Teacher',
      email: user.email,
    })

    // Log successful login (non-PII)
    console.log(`[AUTH] Login successful: ${hashSensitiveData(normalizedLoginId)} (${user.role || 'Teacher'})`)

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role || 'Teacher',
        subject: user.subject,
        level: user.level,
        assignedClasses: user.assignedClasses,
      },
    })
  } catch (error) {
    console.error('[AUTH] Login error:', error instanceof Error ? error.message : error)
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR',
    })
  }
})

/**
 * Register endpoint with enhanced validation
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name, role } = req.body

    // Validate all inputs
    const requiredFields = validateRequiredFields(req.body, [
      'email',
      'password',
      'name',
      'role',
    ])
    if (!requiredFields.isValid) {
      return res.status(400).json({
        error: requiredFields.errors[0],
        code: 'MISSING_FIELDS',
      })
    }

    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return res.status(400).json({
        error: emailValidation.errors[0],
        code: 'INVALID_EMAIL',
      })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: passwordValidation.errors,
        code: 'WEAK_PASSWORD',
      })
    }

    const nameValidation = validateName(name)
    if (!nameValidation.isValid) {
      return res.status(400).json({
        error: nameValidation.errors[0],
        code: 'INVALID_NAME',
      })
    }

    // Check if user already exists
    const existing = await User.findOne({ email: emailValidation.value })
    if (existing) {
      return res.status(409).json({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS',
      })
    }

    // Create new user
    const user = new User({
      email: emailValidation.value,
      password,
      name: nameValidation.value,
      role,
    })
    await user.save()

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    })

    console.log(
      `[AUTH] User registered: ${hashSensitiveData(emailValidation.value)} (${role})`
    )

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('[AUTH] Registration error:', error instanceof Error ? error.message : error)
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR',
    })
  }
})

/**
 * Change password endpoint with enhanced security:
 * - Requires authentication
 * - Rate limited
 * - Validates current password
 * - Validates new password strength
 * - Password updated with automatic bcrypt hashing
 */
router.post('/change-password', authLimiter, authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    const { currentPassword, newPassword } = req.body

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
        code: 'MISSING_FIELDS',
      })
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: passwordValidation.errors,
        code: 'WEAK_PASSWORD',
      })
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      })
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword)
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD',
      })
    }

    // Ensure new password is different from current
    const isSamePassword = await user.comparePassword(newPassword)
    if (isSamePassword) {
      return res.status(400).json({
        error: 'New password must be different from current password',
        code: 'SAME_PASSWORD',
      })
    }

    // Update password (will be automatically hashed by pre-save hook)
    user.password = newPassword
    await user.save()

    console.log(`[AUTH] Password changed for user: ${hashSensitiveData(user.email)}`)

    res.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    console.error('[AUTH] Change password error:', error instanceof Error ? error.message : error)
    res.status(500).json({
      error: 'Failed to change password',
      code: 'CHANGE_PASSWORD_ERROR',
    })
  }
})

/**
 * Verify token endpoint
 */
router.post('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ valid: false })
    }

    jwt.verify(token, envConfig.JWT_SECRET)
    res.json({ valid: true })
  } catch (error) {
    res.status(401).json({ valid: false })
  }
})

export default router
