import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { EvidenceService } from '../services/evidenceService';
import { createEvidenceSchema, reviewEvidenceSchema } from '../schemas';

export class EvidenceController {
  private evidenceService: EvidenceService;

  constructor() {
    this.evidenceService = new EvidenceService();
  }

  uploadEvidence = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: 'File upload is required.' });
      }

      const validated = createEvidenceSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const fileData = {
        originalFilename: file.originalname,
        filename: file.filename,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath: file.path
      };

      const evidence = await this.evidenceService.addEvidence(
        req.params.id,
        fileData,
        validated,
        user,
        reqMeta
      );

      res.status(201).json({
        success: true,
        message: 'Evidence document securely deposited in vault',
        data: evidence
      });
    } catch (err) {
      next(err);
    }
  };

  getEvidenceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const evidence = await this.evidenceService.getEvidenceById(req.params.id, user);

      if (!evidence) {
        return res.status(404).json({ success: false, error: 'Evidence item not found' });
      }

      res.json({
        success: true,
        data: evidence
      });
    } catch (err) {
      next(err);
    }
  };

  reviewEvidence = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const validated = reviewEvidenceSchema.parse(req.body);
      const reqMeta = {
        ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'browser',
        requestId: req.requestId || 'unknown'
      };

      const evidence = await this.evidenceService.reviewEvidence(
        req.params.id,
        validated.reviewStatus,
        validated.reviewerComments,
        user,
        reqMeta
      );

      res.json({
        success: true,
        message: `Evidence marked as ${validated.reviewStatus}`,
        data: evidence
      });
    } catch (err) {
      next(err);
    }
  };

  downloadEvidence = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const evidence = await this.evidenceService.getEvidenceById(req.params.id, user);

      if (!evidence) {
        return res.status(404).json({ success: false, error: 'Evidence item not found' });
      }

      const filePath = this.evidenceService.getFilePath(evidence);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'Physical evidence file missing on server' });
      }

      res.setHeader('Content-Type', evidence.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(evidence.originalFilename)}"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      next(err);
    }
  };
}
