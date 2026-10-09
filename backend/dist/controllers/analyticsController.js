"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analyticsService_1 = require("../services/analyticsService");
class AnalyticsController {
    analyticsService;
    constructor() {
        this.analyticsService = new analyticsService_1.AnalyticsService();
    }
    getDashboardMetrics = async (req, res, next) => {
        try {
            const user = req.user;
            const metrics = await this.analyticsService.getDashboardMetrics(user);
            res.json({
                success: true,
                data: metrics
            });
        }
        catch (err) {
            next(err);
        }
    };
    getOverview = async (req, res, next) => {
        try {
            const user = req.user;
            const overview = await this.analyticsService.getAnalyticsOverview(user);
            res.json({
                success: true,
                data: overview
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AnalyticsController = AnalyticsController;
