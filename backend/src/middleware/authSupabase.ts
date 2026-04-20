import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/UserSupabase';

export interface AuthRequest extends Request {
  user?: User;
}

export const generateToken = (user: User): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET is required');
  return jwt.sign(payload, secret as string, {
    expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
  } as any);
};

export const verifyToken = (token: string): any => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET is required');
  return jwt.verify(token, secret);
};

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    if (user.status !== 'Active') {
      res.status(401).json({ error: 'Account is not active' });
      return;
    }

    req.user = new User(user);
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Role-based middleware helpers
export const requireAdmin = authorizeRoles(UserRole.ADMIN);
export const requireTeacher = authorizeRoles(UserRole.ADMIN, UserRole.TEACHER);
export const requireStudent = authorizeRoles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT);
export const requireParent = authorizeRoles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT);

// Resource ownership middleware
export const requireOwnership = (resourceField: string = 'userId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Admin can access everything
      if (req.user.role === UserRole.ADMIN) {
        next();
        return;
      }

      // Check if user owns the resource
      const resourceId = req.params['id'] || req.body[resourceField];
      
      if (req.user.id !== resourceId) {
        res.status(403).json({ error: 'Access denied: You can only access your own resources' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      
      if (user && user.status === 'Active') {
        req.user = new User(user);
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting for auth endpoints
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
