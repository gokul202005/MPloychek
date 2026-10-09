import { Request, Response, NextFunction } from 'express';
import { TelemetryService } from '../services/telemetryService';
import { setSimulatedDelaySchema } from '../schemas';

export class TelemetryController {
  private telemetryService: TelemetryService;

  constructor() {
    this.telemetryService = TelemetryService.getInstance();
  }

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await this.telemetryService.getSummary();
      res.json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  };

  getRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const requests = this.telemetryService.getRecentRequests(limit);

      res.json({
        success: true,
        data: requests
      });
    } catch (err) {
      next(err);
    }
  };

  ping = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        success: true,
        message: 'pong',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (err) {
      next(err);
    }
  };

  setSimulatedDelay = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = setSimulatedDelaySchema.parse(req.body);
      this.telemetryService.setSimulatedDelayMs(validated.delayMs);

      res.json({
        success: true,
        message: `Development latency simulation updated to ${validated.delayMs}ms`,
        currentDelayMs: validated.delayMs
      });
    } catch (err) {
      next(err);
    }
  };

  getHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await this.telemetryService.getSummary();
      const status = summary.xmlStorageHealth.status === 'HEALTHY' ? 200 : 503;

      res.status(status).json({
        status: summary.xmlStorageHealth.status,
        timestamp: new Date().toISOString(),
        uptimeSeconds: summary.runtime.uptimeSeconds,
        xmlStorage: summary.xmlStorageHealth
      });
    } catch (err) {
      next(err);
    }
  };

  clearRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.telemetryService.clearRequests();
      res.json({
        success: true,
        message: 'Telemetry requests log cleared successfully',
        data: []
      });
    } catch (err) {
      next(err);
    }
  };
}
