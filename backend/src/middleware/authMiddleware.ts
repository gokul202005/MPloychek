import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRepository } from '../repositories/xml/userRepository';
import { SafeUser, UserRole } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  organizationId: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing Bearer token.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    const userRepo = new UserRepository();
    const user = await userRepo.getById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. User no longer exists.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Account access has been deactivated. Contact your compliance administrator.'
      });
    }

    req.user = userRepo.toSafeUser(user);
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: err.name === 'TokenExpiredError' ? 'Authentication token expired.' : 'Invalid authentication token.'
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Administrator privileges required.'
    });
  }

  next();
};
