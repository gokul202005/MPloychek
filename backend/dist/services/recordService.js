"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordService = void 0;
const uuid_1 = require("uuid");
const recordRepository_1 = require("../repositories/xml/recordRepository");
const evidenceRepository_1 = require("../repositories/xml/evidenceRepository");
const clarificationRepository_1 = require("../repositories/xml/clarificationRepository");
const timelineRepository_1 = require("../repositories/xml/timelineRepository");
const notificationRepository_1 = require("../repositories/xml/notificationRepository");
const deadlineRepository_1 = require("../repositories/xml/deadlineRepository");
const confidenceScoreService_1 = require("./confidenceScoreService");
const auditService_1 = require("./auditService");
class RecordService {
    recordRepo;
    evidenceRepo;
    clarificationRepo;
    timelineRepo;
    notificationRepo;
    deadlineRepo;
    confidenceService;
    auditService;
    constructor() {
        this.recordRepo = new recordRepository_1.RecordRepository();
        this.evidenceRepo = new evidenceRepository_1.EvidenceRepository();
        this.clarificationRepo = new clarificationRepository_1.ClarificationRepository();
        this.timelineRepo = new timelineRepository_1.TimelineRepository();
        this.notificationRepo = new notificationRepository_1.NotificationRepository();
        this.deadlineRepo = new deadlineRepository_1.DeadlineRepository();
        this.confidenceService = new confidenceScoreService_1.ConfidenceScoreService();
        this.auditService = new auditService_1.AuditService();
    }
    async getRecords(currentUser, params) {
        const isUser = currentUser.role === 'USER';
        const result = await this.recordRepo.query({
            ...params,
            organizationId: currentUser.organizationId,
            userRole: currentUser.role,
            userId: currentUser.id
        });
        if (isUser) {
            return {
                ...result,
                items: result.items.map(r => this.recordRepo.toSafeRecord(r))
            };
        }
        return result;
    }
    async getRecordById(id, currentUser) {
        const record = await this.recordRepo.getById(id);
        if (!record)
            return null;
        if (record.organizationId !== currentUser.organizationId) {
            throw new Error('Access denied: Record belongs to a different organization.');
        }
        if (currentUser.role === 'USER') {
            return this.recordRepo.toSafeRecord(record);
        }
        return record;
    }
    async createRecord(data, currentUser, reqMeta) {
        const recordId = `rec-${(0, uuid_1.v4)().substring(0, 8)}`;
        const now = new Date().toISOString();
        // Initial dummy record to calculate baseline score
        const tempRecord = {
            id: recordId,
            employeeId: data.employeeId,
            employeeName: data.employeeName,
            organizationId: currentUser.organizationId,
            department: data.department,
            jobTitle: data.jobTitle,
            employmentType: data.employmentType,
            startDate: data.startDate,
            endDate: data.endDate,
            verificationStatus: 'PENDING',
            backgroundCheckStatus: 'NOT_STARTED',
            assignedReviewerId: data.assignedReviewerId,
            assignedReviewerName: undefined,
            compensationGrade: currentUser.role === 'ADMIN' ? data.compensationGrade : undefined,
            internalAssessmentNotes: currentUser.role === 'ADMIN' ? data.internalAssessmentNotes : undefined,
            publicReviewerNotes: data.publicReviewerNotes,
            confidenceScore: 0,
            confidenceLevel: 'LOW',
            confidenceBreakdownJson: '{}',
            followUpDeadline: data.followUpDeadline,
            createdBy: currentUser.id,
            createdAt: now,
            updatedAt: now
        };
        const breakdown = this.confidenceService.calculateScore(tempRecord, [], []);
        tempRecord.confidenceScore = breakdown.score;
        tempRecord.confidenceLevel = breakdown.level;
        tempRecord.confidenceBreakdownJson = JSON.stringify(breakdown);
        const savedRecord = await this.recordRepo.create(tempRecord);
        // Timeline event
        await this.timelineRepo.create({
            id: `ev-${(0, uuid_1.v4)().substring(0, 8)}`,
            recordId: savedRecord.id,
            organizationId: savedRecord.organizationId,
            eventType: 'RECORD_CREATED',
            title: 'Employment Record Created',
            description: `Record initiated for ${savedRecord.employeeName} (${savedRecord.employeeId}) by ${currentUser.name}. Baseline trust confidence evaluated at ${breakdown.score}/100.`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            newStatus: 'PENDING',
            scoreDelta: breakdown.score,
            timestamp: now
        });
        // Notify admins of new pending verification
        await this.notificationRepo.create({
            id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
            recipientId: 'ALL_ADMINS',
            organizationId: currentUser.organizationId,
            title: 'New Employment Record Created',
            message: `${currentUser.name} submitted a new employment record for ${savedRecord.employeeName}.`,
            category: 'STATUS_CHANGE',
            targetType: 'RECORD',
            targetId: savedRecord.id,
            isRead: false,
            createdAt: now
        });
        // Audit log
        await this.auditService.logEvent({
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            organizationId: currentUser.organizationId,
            actionType: 'RECORD_CREATE',
            entityType: 'RECORD',
            entityId: savedRecord.id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent,
            metadata: { employeeName: savedRecord.employeeName, employeeId: savedRecord.employeeId }
        });
        return savedRecord;
    }
    async updateRecord(id, updates, currentUser, reqMeta) {
        const existing = await this.recordRepo.getById(id);
        if (!existing) {
            throw new Error('Record not found.');
        }
        if (existing.organizationId !== currentUser.organizationId) {
            throw new Error('Access denied: Record belongs to another organization.');
        }
        // Role check: Only ADMIN can edit restricted fields or other users' records
        if (currentUser.role === 'USER') {
            if (existing.createdBy !== currentUser.id) {
                throw new Error('Access denied: You cannot edit records created by other users.');
            }
            delete updates.compensationGrade;
            delete updates.internalAssessmentNotes;
            delete updates.verificationStatus;
            delete updates.backgroundCheckStatus;
        }
        const previousStatus = existing.verificationStatus;
        const oldScore = existing.confidenceScore;
        // Recalculate score with current evidence & clarifications
        const evidence = await this.evidenceRepo.getByRecordId(id);
        const clarifications = await this.clarificationRepo.getByRecordId(id);
        const merged = { ...existing, ...updates };
        const breakdown = this.confidenceService.calculateScore(merged, evidence, clarifications);
        updates.confidenceScore = breakdown.score;
        updates.confidenceLevel = breakdown.level;
        updates.confidenceBreakdownJson = JSON.stringify(breakdown);
        const updated = await this.recordRepo.update(id, updates);
        if (!updated)
            throw new Error('Failed to update record.');
        // Timeline event if status or confidence changed significantly
        if (updates.verificationStatus && updates.verificationStatus !== previousStatus) {
            await this.timelineRepo.create({
                id: `ev-${(0, uuid_1.v4)().substring(0, 8)}`,
                recordId: id,
                organizationId: updated.organizationId,
                eventType: 'STATUS_CHANGED',
                title: `Verification Status Changed to ${updates.verificationStatus}`,
                description: `Status updated by ${currentUser.name}.`,
                actorId: currentUser.id,
                actorName: currentUser.name,
                actorRole: currentUser.role,
                previousStatus,
                newStatus: updates.verificationStatus,
                scoreDelta: breakdown.score - oldScore,
                timestamp: new Date().toISOString()
            });
        }
        // Audit log
        await this.auditService.logEvent({
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            organizationId: currentUser.organizationId,
            actionType: 'RECORD_UPDATE',
            entityType: 'RECORD',
            entityId: id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent,
            metadata: { changedFields: Object.keys(updates) }
        });
        return updated;
    }
    async recordVerificationDecision(id, decision, reason, publicNotes, internalNotes, followUpDeadline, currentUser, reqMeta, backgroundCheckStatus) {
        if (currentUser.role !== 'ADMIN') {
            throw new Error('Access denied: Only Administrators can record verification decisions.');
        }
        const existing = await this.recordRepo.getById(id);
        if (!existing)
            throw new Error('Record not found.');
        const previousStatus = existing.verificationStatus;
        const oldScore = existing.confidenceScore;
        const now = new Date().toISOString();
        // Auto-resolve background screening status to PASSED when verifying unless specified otherwise
        const resolvedBgStatus = backgroundCheckStatus || (decision === 'VERIFIED' ? 'PASSED' : existing.backgroundCheckStatus);
        const updates = {
            verificationStatus: decision,
            backgroundCheckStatus: resolvedBgStatus,
            backgroundCheckDate: resolvedBgStatus === 'PASSED' ? (existing.backgroundCheckDate || now.split('T')[0]) : existing.backgroundCheckDate,
            assignedReviewerId: currentUser.id,
            assignedReviewerName: currentUser.name,
            publicReviewerNotes: publicNotes || existing.publicReviewerNotes,
            internalAssessmentNotes: internalNotes || existing.internalAssessmentNotes,
            followUpDeadline: followUpDeadline || existing.followUpDeadline
        };
        const evidence = await this.evidenceRepo.getByRecordId(id);
        const clarifications = await this.clarificationRepo.getByRecordId(id);
        const merged = { ...existing, ...updates };
        const breakdown = this.confidenceService.calculateScore(merged, evidence, clarifications);
        updates.confidenceScore = breakdown.score;
        updates.confidenceLevel = breakdown.level;
        updates.confidenceBreakdownJson = JSON.stringify(breakdown);
        const updated = await this.recordRepo.update(id, updates);
        if (!updated)
            throw new Error('Failed to update record.');
        // Timeline event
        await this.timelineRepo.create({
            id: `ev-${(0, uuid_1.v4)().substring(0, 8)}`,
            recordId: id,
            organizationId: updated.organizationId,
            eventType: 'DECISION_RECORDED',
            title: `Verification Decision: ${decision}`,
            description: `Reviewer ${currentUser.name} recorded decision: ${decision}. Reason: ${reason}`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            previousStatus,
            newStatus: decision,
            scoreDelta: breakdown.score - oldScore,
            timestamp: now
        });
        // Notify the record creator
        await this.notificationRepo.create({
            id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
            recipientId: existing.createdBy,
            organizationId: updated.organizationId,
            title: `Verification Decision: ${decision}`,
            message: `The verification status for ${existing.employeeName} has been updated to ${decision}. Notes: ${reason}`,
            category: 'STATUS_CHANGE',
            targetType: 'RECORD',
            targetId: id,
            isRead: false,
            createdAt: now
        });
        // Audit log
        await this.auditService.logEvent({
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            organizationId: currentUser.organizationId,
            actionType: 'VERIFICATION_DECISION',
            entityType: 'RECORD',
            entityId: id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent,
            reason,
            metadata: { previousStatus, newStatus: decision }
        });
        // Auto-resolve associated compliance deadlines and clarification requests upon approval
        if (decision === 'VERIFIED') {
            try {
                const allDeadlines = await this.deadlineRepo.getByOrganizationId(updated.organizationId);
                for (const dl of allDeadlines) {
                    if (dl.recordId === id && dl.status !== 'COMPLETED') {
                        await this.deadlineRepo.update(dl.id, { status: 'COMPLETED' });
                    }
                }
                const openClarifications = await this.clarificationRepo.getByRecordId(id);
                for (const clar of openClarifications) {
                    if (clar.status !== 'RESOLVED') {
                        await this.clarificationRepo.update(clar.id, {
                            status: 'RESOLVED',
                            response: clar.response || 'Verified and approved by compliance officer.'
                        });
                    }
                }
            }
            catch {
                // Non-blocking
            }
        }
        return updated;
    }
    async getTimeline(recordId, currentUser) {
        const record = await this.recordRepo.getById(recordId);
        if (!record)
            throw new Error('Record not found.');
        if (record.organizationId !== currentUser.organizationId) {
            throw new Error('Access denied: Different organization.');
        }
        return this.timelineRepo.getByRecordId(recordId);
    }
    async recalculateRecordScore(recordId) {
        const record = await this.recordRepo.getById(recordId);
        if (!record)
            return null;
        const evidence = await this.evidenceRepo.getByRecordId(recordId);
        const clarifications = await this.clarificationRepo.getByRecordId(recordId);
        const breakdown = this.confidenceService.calculateScore(record, evidence, clarifications);
        return this.recordRepo.update(recordId, {
            confidenceScore: breakdown.score,
            confidenceLevel: breakdown.level,
            confidenceBreakdownJson: JSON.stringify(breakdown)
        });
    }
}
exports.RecordService = RecordService;
