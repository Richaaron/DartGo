import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User, UserRole } from '../models/User';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';

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
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role,
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error: any) {
    next(error);
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
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user!.toJSON(),
      },
    });
  } catch (error: any) {
    next(error);
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

    // Update password
    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
