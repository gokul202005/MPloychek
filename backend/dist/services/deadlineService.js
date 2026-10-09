"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadlineService = void 0;
const uuid_1 = require("uuid");
const deadlineRepository_1 = require("../repositories/xml/deadlineRepository");
const recordRepository_1 = require("../repositories/xml/recordRepository");
const auditService_1 = require("./auditService");
class DeadlineService {
    deadlineRepo;
    recordRepo;
    auditService;
    constructor() {
        this.deadlineRepo = new deadlineRepository_1.DeadlineRepository();
        this.recordRepo = new recordRepository_1.RecordRepository();
        this.auditService = new auditService_1.AuditService();
    }
    async getDeadlines(currentUser, filter) {
        let deadlines = await this.deadlineRepo.getByOrganizationId(currentUser.organizationId);
        const now = new Date().getTime();
        // Dynamically mark overdue items if active and past due
        deadlines = deadlines.map(d => {
            const dueTime = new Date(d.dueDate).getTime();
            if (d.status === 'ACTIVE' && dueTime < now) {
                return { ...d, status: 'OVERDUE' };
            }
            return d;
        });
        if (filter?.category) {
            deadlines = deadlines.filter(d => d.category === filter.category);
        }
        if (filter?.status) {
            deadlines = deadlines.filter(d => d.status === filter.status);
        }
        if (filter?.overdueOnly) {
            deadlines = deadlines.filter(d => d.status === 'OVERDUE');
        }
        // Sort by dueDate ascending (earliest deadline first)
        deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        return deadlines;
    }
    async createDeadline(data, currentUser, reqMeta) {
        const targetRecord = await this.recordRepo.getById(data.recordId);
        if (!targetRecord || targetRecord.organizationId !== currentUser.organizationId) {
            throw new Error(`Target record ID '${data.recordId}' does not exist in your organization.`);
        }
        const id = `dl-${(0, uuid_1.v4)().substring(0, 8)}`;
        const now = new Date().toISOString();
        const deadline = {
            id,
            recordId: data.recordId,
            organizationId: currentUser.organizationId,
            title: data.title,
            category: data.category,
            dueDate: data.dueDate,
            status: 'ACTIVE',
            priority: data.priority,
            assignedReviewerId: data.assignedReviewerId || currentUser.id,
            assignedReviewerName: data.assignedReviewerName ||
                (data.assignedReviewerId === 'usr-admin-01' ? 'Eleanor Vance' : currentUser.name),
            reminderDaysBefore: data.reminderDaysBefore || 7,
            createdAt: now,
            updatedAt: now
        };
        const saved = await this.deadlineRepo.create(deadline);
        await this.auditService.logEvent({
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            organizationId: currentUser.organizationId,
            actionType: 'COMPLIANCE_DEADLINE_CREATE',
            entityType: 'DEADLINE',
            entityId: saved.id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent,
            metadata: { title: saved.title, dueDate: saved.dueDate }
        });
        return saved;
    }
    async updateDeadline(id, updates, currentUser, reqMeta) {
        const existing = await this.deadlineRepo.getById(id);
        if (!existing)
            throw new Error('Deadline not found.');
        if (existing.organizationId !== currentUser.organizationId) {
            throw new Error('Access denied: Unauthorized organization.');
        }
        const updated = await this.deadlineRepo.update(id, updates);
        if (!updated)
            throw new Error('Failed to update deadline.');
        await this.auditService.logEvent({
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            organizationId: currentUser.organizationId,
            actionType: 'COMPLIANCE_DEADLINE_UPDATE',
            entityType: 'DEADLINE',
            entityId: id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent,
            metadata: { updates }
        });
        return updated;
    }
}
exports.DeadlineService = DeadlineService;
