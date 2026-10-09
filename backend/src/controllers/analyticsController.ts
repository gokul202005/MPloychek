import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  getDashboardMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const metrics = await this.analyticsService.getDashboardMetrics(user);

      res.json({
        success: true,
        data: metrics
      });
    } catch (err) {
      next(err);
    }
  };

  getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const overview = await this.analyticsService.getAnalyticsOverview(user);

      res.json({
        success: true,
        data: overview
      });
    } catch (err) {
      next(err);
    }
  };
}
