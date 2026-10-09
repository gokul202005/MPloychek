"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryController = void 0;
const telemetryService_1 = require("../services/telemetryService");
const schemas_1 = require("../schemas");
class TelemetryController {
    telemetryService;
    constructor() {
        this.telemetryService = telemetryService_1.TelemetryService.getInstance();
    }
    getSummary = async (req, res, next) => {
        try {
            const summary = await this.telemetryService.getSummary();
            res.json({
                success: true,
                data: summary
            });
        }
        catch (err) {
            next(err);
        }
    };
    getRequests = async (req, res, next) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 30;
            const requests = this.telemetryService.getRecentRequests(limit);
            res.json({
                success: true,
                data: requests
            });
        }
        catch (err) {
            next(err);
        }
    };
    ping = async (req, res, next) => {
        try {
            res.json({
                success: true,
                message: 'pong',
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        }
        catch (err) {
            next(err);
        }
    };
    setSimulatedDelay = async (req, res, next) => {
        try {
            const validated = schemas_1.setSimulatedDelaySchema.parse(req.body);
            this.telemetryService.setSimulatedDelayMs(validated.delayMs);
            res.json({
                success: true,
                message: `Development latency simulation updated to ${validated.delayMs}ms`,
                currentDelayMs: validated.delayMs
            });
        }
        catch (err) {
            next(err);
        }
    };
    getHealth = async (req, res, next) => {
        try {
            const summary = await this.telemetryService.getSummary();
            const status = summary.xmlStorageHealth.status === 'HEALTHY' ? 200 : 503;
            res.status(status).json({
                status: summary.xmlStorageHealth.status,
                timestamp: new Date().toISOString(),
                uptimeSeconds: summary.runtime.uptimeSeconds,
                xmlStorage: summary.xmlStorageHealth
            });
        }
        catch (err) {
            next(err);
        }
    };
    clearRequests = async (req, res, next) => {
        try {
            this.telemetryService.clearRequests();
            res.json({
                success: true,
                message: 'Telemetry requests log cleared successfully',
                data: []
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.TelemetryController = TelemetryController;
