import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TelemetryService } from '../services/telemetryService';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export const telemetryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const telemetryService = TelemetryService.getInstance();
  const requestId = (req.headers['x-request-id'] as string) || `req-${uuidv4().substring(0, 8)}`;
  req.requestId = requestId;
  req.startTime = performance.now();

  res.setHeader('X-Request-Id', requestId);
  telemetryService.recordRequestStart();

  res.on('finish', () => {
    // Do not record the clear endpoint itself so metrics stay reset
    if (req.path && req.path.includes('/telemetry/clear')) {
      return;
    }

    const duration = req.startTime ? Math.round(performance.now() - req.startTime) : 0;
    const simulatedDelay = telemetryService.getSimulatedDelayMs();

    telemetryService.recordRequestEnd({
      id: `tel-${uuidv4().substring(0, 8)}`,
      requestId,
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      durationMs: duration,
      simulatedDelayMs: simulatedDelay,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
      userAgent: (req.headers['user-agent'] || 'unknown').substring(0, 100),
      userId: (req as any).user?.id
    });
  });

  next();
};
