"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error(`Unhandled error on ${req.method} ${req.url}:`, err);
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const issues = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            validationErrors: issues
        });
    }
    // Handle known application errors
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error occurred.';
    res.status(statusCode).json({
        success: false,
        error: message,
        requestId: req.requestId
    });
};
exports.errorHandler = errorHandler;
