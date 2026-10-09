"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const telemetryController_1 = require("../controllers/telemetryController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const telemetryController = new telemetryController_1.TelemetryController();
// Public ping and health
router.post('/ping', telemetryController.ping);
// Admin-only telemetry metrics
router.get('/summary', authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, telemetryController.getSummary);
router.get('/requests', authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, telemetryController.getRequests);
router.post('/clear', authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, telemetryController.clearRequests);
router.delete('/requests', authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, telemetryController.clearRequests);
router.post('/delay', authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, telemetryController.setSimulatedDelay);
exports.default = router;
