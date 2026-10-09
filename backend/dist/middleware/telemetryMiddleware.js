"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetryMiddleware = void 0;
const uuid_1 = require("uuid");
const telemetryService_1 = require("../services/telemetryService");
const telemetryMiddleware = (req, res, next) => {
    const telemetryService = telemetryService_1.TelemetryService.getInstance();
    const requestId = req.headers['x-request-id'] || `req-${(0, uuid_1.v4)().substring(0, 8)}`;
    req.requestId = requestId;
    req.startTime = performance.now();
    res.setHeader('X-Request-Id', requestId);
    telemetryService.recordRequestStart();
    res.on('finish', () => {
        const duration = req.startTime ? Math.round(performance.now() - req.startTime) : 0;
        const simulatedDelay = telemetryService.getSimulatedDelayMs();
        telemetryService.recordRequestEnd({
            id: `tel-${(0, uuid_1.v4)().substring(0, 8)}`,
            requestId,
            method: req.method,
            path: req.originalUrl || req.path,
            status: res.statusCode,
            durationMs: duration,
            simulatedDelayMs: simulatedDelay,
            timestamp: new Date().toISOString(),
            ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
            userAgent: (req.headers['user-agent'] || 'unknown').substring(0, 100),
            userId: req.user?.id
        });
    });
    next();
};
exports.telemetryMiddleware = telemetryMiddleware;
