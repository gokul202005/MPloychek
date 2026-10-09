"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const auditService_1 = require("../services/auditService");
class AuditController {
    auditService;
    constructor() {
        this.auditService = new auditService_1.AuditService();
    }
    getAuditEvents = async (req, res, next) => {
        try {
            const user = req.user;
            const { search, actorId, actionType, entityType, outcome, startDate, endDate, page, limit } = req.query;
            const result = await this.auditService.queryAuditTrail({
                organizationId: user.organizationId,
                search: search,
                actorId: actorId,
                actionType: actionType,
                entityType: entityType,
                outcome: outcome,
                startDate: startDate,
                endDate: endDate,
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 15
            });
            res.json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    };
    getAuditEventById = async (req, res, next) => {
        try {
            const event = await this.auditService.getAuditById(req.params.id);
            if (!event) {
                return res.status(404).json({ success: false, error: 'Audit event not found' });
            }
            res.json({
                success: true,
                data: event
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AuditController = AuditController;
