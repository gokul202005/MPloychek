"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const telemetryMiddleware_1 = require("./middleware/telemetryMiddleware");
const latencySimulator_1 = require("./middleware/latencySimulator");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = __importDefault(require("./routes"));
const telemetryController_1 = require("./controllers/telemetryController");
const app = (0, express_1.default)();
// Basic security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
// CORS configuration
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow localhost and configured client origin
        if (!origin || origin === env_1.config.clientOrigin || origin.startsWith('http://localhost:')) {
            callback(null, true);
        }
        else {
            callback(new Error('CORS policy: Not allowed origin'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));
// Payload limits
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Telemetry & Latency simulator
app.use(telemetryMiddleware_1.telemetryMiddleware);
app.use(latencySimulator_1.latencySimulator);
// Global health endpoint
const telemetryController = new telemetryController_1.TelemetryController();
app.get('/api/health', telemetryController.getHealth);
// General rate limiter on API
app.use('/api', rateLimiter_1.apiRateLimiter);
// API Routes
app.use('/api', routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
});
// Centralized error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
