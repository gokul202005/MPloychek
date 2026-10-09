import { Request, Response, NextFunction } from 'express';
import { TelemetryService } from '../services/telemetryService';
import { config } from '../config/env';

export const latencySimulator = async (req: Request, res: Response, next: NextFunction) => {
  if (!config.enableDevLatencySimulation) {
    return next();
  }

  const delayMs = TelemetryService.getInstance().getSimulatedDelayMs();
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  next();
};
