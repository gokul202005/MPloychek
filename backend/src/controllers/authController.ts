import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { loginSchema, registerSchema } from '../schemas';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = loginSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const result = await this.authService.login(validated.email, validated.password, reqMeta);
      res.json({
        success: true,
        message: 'Authentication successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = registerSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const result = await this.authService.register(validated, reqMeta);
      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        success: true,
        message: 'Signed out successfully'
      });
    } catch (err) {
      next(err);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const user = await this.authService.getMe(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  };
}
