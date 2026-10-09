"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceController = void 0;
const deadlineService_1 = require("../services/deadlineService");
const schemas_1 = require("../schemas");
class ComplianceController {
    deadlineService;
    constructor() {
        this.deadlineService = new deadlineService_1.DeadlineService();
    }
    getDeadlines = async (req, res, next) => {
        try {
            const user = req.user;
            const { category, status, overdueOnly } = req.query;
            const deadlines = await this.deadlineService.getDeadlines(user, {
                category: category,
                status: status,
                overdueOnly: overdueOnly === 'true'
            });
            res.json({
                success: true,
                data: deadlines
            });
        }
        catch (err) {
            next(err);
        }
    };
    createDeadline = async (req, res, next) => {
        try {
            const user = req.user;
            const validated = schemas_1.createDeadlineSchema.parse(req.body);
            const reqMeta = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'browser',
                requestId: req.requestId || 'unknown'
            };
            const deadline = await this.deadlineService.createDeadline(validated, user, reqMeta);
            res.status(201).json({
                success: true,
                message: 'Compliance deadline created successfully',
                data: deadline
            });
        }
        catch (err) {
            next(err);
        }
    };
    updateDeadline = async (req, res, next) => {
        try {
            const user = req.user;
            const validated = schemas_1.updateDeadlineSchema.parse(req.body);
            const reqMeta = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'browser',
                requestId: req.requestId || 'unknown'
            };
            const updated = await this.deadlineService.updateDeadline(req.params.id, validated, user, reqMeta);
            res.json({
                success: true,
                message: 'Deadline updated successfully',
                data: updated
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.ComplianceController = ComplianceController;
