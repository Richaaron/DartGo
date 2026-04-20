import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User, UserRole } from '../models/UserSimple';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/authSupabase';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(Object.values(UserRole)).withMessage('Invalid role'),
];

const loginValidation = [
  body('email').notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register user
router.post('/register', registerValidation, async (req: any, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      status: 'Active' as any,
      emailVerified: false,
    });

    // Generate token
    const userInstance = new User(user);
    const token = generateToken(userInstance);

    return res.status(201).json({
      success: true,
      data: {
        user: userInstance.toJSON(),
        token,
      },
    });
  } catch (error: any) {
    return next(error);
  }
});

// Login user
router.post('/login', loginValidation, async (req: any, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password
    const userInstance = new User(user);
    const isPasswordValid = await userInstance.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token
    const token = generateToken(userInstance);

    return res.json({
      success: true,
      data: {
        user: userInstance.toJSON(),
        token,
      },
    });
  } catch (error: any) {
    return next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return res.json({
      success: true,
      data: {
        user: req.user!.toJSON(),
      },
    });
  } catch (error: any) {
    return next(error);
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.user!;

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.update(user.id, { password: hashedNewPassword });

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    return next(error);
  }
});

// Update profile
router.put('/profile', authenticateToken, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { name, phone, address } = req.body;
    const user = req.user!;

    // Update user profile
    const updatedUser = await User.update(user.id, {
      name: name || user.name,
      phone: phone || user.phone,
      address: address || user.address,
    });

    const userInstance = new User(updatedUser);
    return res.json({
      success: true,
      data: {
        user: userInstance.toJSON(),
      },
    });
  } catch (error: any) {
    return next(error);
  }
});

export default router;
