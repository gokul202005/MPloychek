"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const uuid_1 = require("uuid");
const auditRepository_1 = require("../repositories/xml/auditRepository");
class AuditService {
    auditRepo;
    constructor() {
        this.auditRepo = new auditRepository_1.AuditRepository();
    }
    async logEvent(params) {
        const event = {
            id: `audit-${(0, uuid_1.v4)().substring(0, 8)}`,
            timestamp: new Date().toISOString(),
            actorId: params.actorId,
            actorName: params.actorName,
            actorRole: params.actorRole,
            organizationId: params.organizationId,
            actionType: params.actionType,
            entityType: params.entityType,
            entityId: params.entityId,
            outcome: params.outcome,
            requestId: params.requestId,
            ip: params.ip || '127.0.0.1',
            userAgent: params.userAgent || 'system',
            reason: params.reason,
            metadataJson: params.metadata ? JSON.stringify(params.metadata) : undefined
        };
        return this.auditRepo.create(event);
    }
    async queryAuditTrail(params) {
        return this.auditRepo.query(params);
    }
    async getAuditById(id) {
        return this.auditRepo.getById(id);
    }
}
exports.AuditService = AuditService;
