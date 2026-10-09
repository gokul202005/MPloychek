import { Request, Response, NextFunction } from 'express';
import { DeadlineService } from '../services/deadlineService';
import { createDeadlineSchema, updateDeadlineSchema } from '../schemas';

export class ComplianceController {
  private deadlineService: DeadlineService;

  constructor() {
    this.deadlineService = new DeadlineService();
  }

  getDeadlines = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { category, status, overdueOnly } = req.query;

      const deadlines = await this.deadlineService.getDeadlines(user, {
        category: category as string,
        status: status as string,
        overdueOnly: overdueOnly === 'true'
      });

      res.json({
        success: true,
        data: deadlines
      });
    } catch (err) {
      next(err);
    }
  };

  createDeadline = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = createDeadlineSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const deadline = await this.deadlineService.createDeadline(validated, user, reqMeta);

      res.status(201).json({
        success: true,
        message: 'Compliance deadline created successfully',
        data: deadline
      });
    } catch (err) {
      next(err);
    }
  };

  updateDeadline = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = updateDeadlineSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const updated = await this.deadlineService.updateDeadline(req.params.id, validated, user, reqMeta);

      res.json({
        success: true,
        message: 'Deadline updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };
}
