import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  getAuditEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { search, actorId, actionType, entityType, outcome, startDate, endDate, page, limit } = req.query;

      const result = await this.auditService.queryAuditTrail({
        organizationId: user.organizationId,
        search: search as string,
        actorId: actorId as string,
        actionType: actionType as string,
        entityType: entityType as string,
        outcome: outcome as any,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  getAuditEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.auditService.getAuditById(req.params.id);

      if (!event) {
        return res.status(404).json({ success: false, error: 'Audit event not found' });
      }

      res.json({
        success: true,
        data: event
      });
    } catch (err) {
      next(err);
    }
  };
}
