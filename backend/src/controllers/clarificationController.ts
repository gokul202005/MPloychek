import { Request, Response, NextFunction } from 'express';
import { ClarificationService } from '../services/clarificationService';
import { createClarificationSchema, respondClarificationSchema } from '../schemas';

export class ClarificationController {
  private clarService: ClarificationService;

  constructor() {
    this.clarService = new ClarificationService();
  }

  createClarification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = createClarificationSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const result = await this.clarService.createClarification(req.params.id, validated, user, reqMeta);

      res.status(201).json({
        success: true,
        message: 'Clarification request issued successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  respondClarification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = respondClarificationSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const result = await this.clarService.respondClarification(
        req.params.id,
        validated.response,
        user,
        reqMeta
      );

      res.json({
        success: true,
        message: 'Clarification response submitted successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };
}
