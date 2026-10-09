import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from '../schemas';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { search, role, status, page, limit } = req.query;

      const result = await this.userService.getUsers(user, {
        search: search as string,
        role: role as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const targetUser = await this.userService.getUserById(req.params.id, user);

      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({
        success: true,
        data: targetUser
      });
    } catch (err) {
      next(err);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = createUserSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const newUser = await this.userService.createUser(validated, user, reqMeta);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = updateUserSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const updated = await this.userService.updateUser(req.params.id, validated, user, reqMeta);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = updateUserStatusSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const updated = await this.userService.updateUserStatus(
        req.params.id,
        validated.status,
        validated.reason,
        user,
        reqMeta
      );

      res.json({
        success: true,
        message: `User status changed to ${validated.status}`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const success = await this.userService.deleteUser(req.params.id, user, reqMeta);
      if (!success) {
        return res.status(404).json({ success: false, error: 'User not found or could not be removed' });
      }

      res.json({
        success: true,
        message: 'User account removed successfully'
      });
    } catch (err) {
      next(err);
    }
  };
}
