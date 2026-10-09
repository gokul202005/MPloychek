"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.latencySimulator = void 0;
const telemetryService_1 = require("../services/telemetryService");
const env_1 = require("../config/env");
const latencySimulator = async (req, res, next) => {
    if (!env_1.config.enableDevLatencySimulation) {
        return next();
    }
    const delayMs = telemetryService_1.TelemetryService.getInstance().getSimulatedDelayMs();
    if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    next();
};
exports.latencySimulator = latencySimulator;
