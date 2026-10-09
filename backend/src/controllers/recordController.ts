import { Request, Response, NextFunction } from 'express';
import { RecordService } from '../services/recordService';
import { EvidenceService } from '../services/evidenceService';
import { ClarificationService } from '../services/clarificationService';
import { createRecordSchema, updateRecordSchema, reviewRecordSchema } from '../schemas';

export class RecordController {
  private recordService: RecordService;
  private evidenceService: EvidenceService;
  private clarService: ClarificationService;

  constructor() {
    this.recordService = new RecordService();
    this.evidenceService = new EvidenceService();
    this.clarService = new ClarificationService();
  }

  getRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { search, status, department, employmentType, sortBy, sortOrder, page, limit, onlyMine } = req.query;

      const result = await this.recordService.getRecords(user, {
        search: search as string,
        status: status as any,
        department: department as string,
        employmentType: employmentType as any,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        onlyMine: onlyMine === 'true'
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  getRecordById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const record = await this.recordService.getRecordById(req.params.id, user);

      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }

      res.json({
        success: true,
        data: record
      });
    } catch (err) {
      next(err);
    }
  };

  createRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = createRecordSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const record = await this.recordService.createRecord(validated, user, reqMeta);

      res.status(201).json({
        success: true,
        message: 'Employment record successfully created',
        data: record
      });
    } catch (err) {
      next(err);
    }
  };

  updateRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = updateRecordSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const record = await this.recordService.updateRecord(req.params.id, validated, user, reqMeta);

      res.json({
        success: true,
        message: 'Employment record updated successfully',
        data: record
      });
    } catch (err) {
      next(err);
    }
  };

  recordDecision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = reviewRecordSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const record = await this.recordService.recordVerificationDecision(
        req.params.id,
        validated.decision,
        validated.reason,
        validated.publicNotes,
        validated.internalNotes,
        validated.followUpDeadline,
        user,
        reqMeta,
        validated.backgroundCheckStatus
      );

      res.json({
        success: true,
        message: `Verification decision recorded: ${validated.decision}`,
        data: record
      });
    } catch (err) {
      next(err);
    }
  };

  getTimeline = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const timeline = await this.recordService.getTimeline(req.params.id, user);

      res.json({
        success: true,
        data: timeline
      });
    } catch (err) {
      next(err);
    }
  };

  getEvidence = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const items = await this.evidenceService.getEvidenceByRecordId(req.params.id, user);

      res.json({
        success: true,
        data: items
      });
    } catch (err) {
      next(err);
    }
  };

  getClarifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const items = await this.clarService.getClarificationsByRecordId(req.params.id, user);

      res.json({
        success: true,
        data: items
      });
    } catch (err) {
      next(err);
    }
  };
}
