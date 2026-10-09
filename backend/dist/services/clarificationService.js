"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClarificationService = void 0;
const uuid_1 = require("uuid");
const clarificationRepository_1 = require("../repositories/xml/clarificationRepository");
const recordRepository_1 = require("../repositories/xml/recordRepository");
const timelineRepository_1 = require("../repositories/xml/timelineRepository");
const notificationRepository_1 = require("../repositories/xml/notificationRepository");
const confidenceScoreService_1 = require("./confidenceScoreService");
const evidenceRepository_1 = require("../repositories/xml/evidenceRepository");
const auditService_1 = require("./auditService");
class ClarificationService {
    clarificationRepo;
    recordRepo;
    timelineRepo;
    notificationRepo;
    evidenceRepo;
    confidenceService;
    auditService;
    constructor() {
        this.clarificationRepo = new clarificationRepository_1.ClarificationRepository();
        this.recordRepo = new recordRepository_1.RecordRepository();
        this.timelineRepo = new timelineRepository_1.TimelineRepository();
        this.notificationRepo = new notificationRepository_1.NotificationRepository();
        this.evidenceRepo = new evidenceRepository_1.EvidenceRepository();
        this.confidenceService = new confidenceScoreService_1.ConfidenceScoreService();
        this.auditService = new auditService_1.AuditService();
    }
    async getClarificationsByRecordId(recordId, currentUser) {
        const record = await this.recordRepo.getById(recordId);
        if (!record)
            throw new Error('Record not found.');
        if (record.organizationId !== currentUser.organizationId) {
            throw new Error('Access denied: Record belongs to different organization.');
        }
        return this.clarificationRepo.getByRecordId(recordId);
    }
    async createClarification(recordId, data, currentUser, reqMeta) {
        if (currentUser.role !== 'ADMIN') {
            throw new Error('Access denied: Only Administrators/Reviewers can issue clarification inquiries.');
        }
        const record = await this.recordRepo.getById(recordId);
        if (!record)
            throw new Error('Record not found.');
        const clarId = `clar-${(0, uuid_1.v4)().substring(0, 8)}`;
        const now = new Date().toISOString();
        const request = {
            id: clarId,
            recordId,
            organizationId: currentUser.organizationId,
            subject: data.subject,
            question: data.question,
            requestedBy: currentUser.id,
            requestedByName: currentUser.name,
            requestedAt: now,
            dueDate: data.dueDate,
            status: 'OPEN'
        };
        const saved = await this.clarificationRepo.create(request);
        // Update record status to ACTION_REQUIRED and recalculate score
        const allEvidence = await this.evidenceRepo.getByRecordId(recordId);
        const allClarifications = await this.clarificationRepo.getByRecordId(recordId);
        const oldScore = record.confidenceScore;
        const breakdown = this.confidenceService.calculateScore(record, allEvidence, allClarifications);
        await this.recordRepo.update(recordId, {
            verificationStatus: 'ACTION_REQUIRED',
            confidenceScore: breakdown.score,
            confidenceLevel: breakdown.level,
            confidenceBreakdownJson: JSON.stringify(breakdown)
        });
        // Timeline event
        await this.timelineRepo.create({
            id: `ev-${(0, uuid_1.v4)().substring(0, 8)}`,
            recordId,
            organizationId: currentUser.organizationId,
            eventType: 'CLARIFICATION_REQUESTED',
            title: `Clarification Requested: ${data.subject}`,
            description: `Inquiry opened by ${currentUser.name}: "${data.question}". Status shifted to ACTION_REQUIRED. Due date: ${data.dueDate}.`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            previousStatus: record.verificationStatus,
            newStatus: 'ACTION_REQUIRED',
            scoreDelta: breakdown.score - oldScore,
            timestamp: now
        });
        // Notify submitter/worker
        await this.notificationRepo.create({
            id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
            recipientId: record.createdBy,
            organizationId: currentUser.organizationId,
            title: 'Action Required: Clarification Requested',
            message: `${currentUser.name} requested clarification on ${record.employeeName}: "${data.subject}". Due by ${data.dueDate}.`,
            category: 'CLARIFICATION',
            targetType: 'RECORD',
            targetId: recordId,
            isRead: false,
            createdAt: now
        });
        // Audit log
        await this.auditService.logEvent({
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            organizationId: currentUser.organizationId,
            actionType: 'CLARIFICATION_REQUEST',
            entityType: 'CLARIFICATION',
            entityId: saved.id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent,
            metadata: { recordId, subject: data.subject }
        });
        return saved;
    }
    async respondClarification(id, response, currentUser, reqMeta) {
        const clarification = await this.clarificationRepo.getById(id);
        if (!clarification)
            throw new Error('Clarification request not found.');
        const record = await this.recordRepo.getById(clarification.recordId);
        if (!record)
            throw new Error('Associated record not found.');
        // Only record creator, assigned reviewer, or admin can respond
        if (currentUser.role !== 'ADMIN' && record.createdBy !== currentUser.id) {
            throw new Error('Access denied: You are not authorized to respond to this clarification inquiry.');
        }
        const now = new Date().toISOString();
        const updated = await this.clarificationRepo.update(id, {
            response,
            respondedBy: currentUser.id,
            respondedByName: currentUser.name,
            respondedAt: now,
            status: 'RESPONDED'
        });
        if (!updated)
            throw new Error('Failed to save response.');
        // Update record status to RESUBMITTED
        const allEvidence = await this.evidenceRepo.getByRecordId(record.id);
        const allClarifications = await this.clarificationRepo.getByRecordId(record.id);
        const oldScore = record.confidenceScore;
        const breakdown = this.confidenceService.calculateScore(record, allEvidence, allClarifications);
        await this.recordRepo.update(record.id, {
            verificationStatus: 'RESUBMITTED',
            confidenceScore: breakdown.score,
            confidenceLevel: breakdown.level,
            confidenceBreakdownJson: JSON.stringify(breakdown)
        });
        // Timeline event
        await this.timelineRepo.create({
            id: `ev-${(0, uuid_1.v4)().substring(0, 8)}`,
            recordId: record.id,
            organizationId: currentUser.organizationId,
            eventType: 'CLARIFICATION_RESPONDED',
            title: `Clarification Responded: ${clarification.subject}`,
            description: `${currentUser.name} provided response: "${response.substring(0, 80)}...". Verification transitioned to RESUBMITTED.`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            previousStatus: 'ACTION_REQUIRED',
            newStatus: 'RESUBMITTED',
            scoreDelta: breakdown.score - oldScore,
            timestamp: now
        });
        // Notify reviewer / Admins
        await this.notificationRepo.create({
            id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
            recipientId: clarification.requestedBy || 'ALL_ADMINS',
            organizationId: currentUser.organizationId,
            title: 'Clarification Response Received',
            message: `${currentUser.name} replied to clarification inquiry regarding ${record.employeeName}.`,
            category: 'CLARIFICATION',
            targetType: 'RECORD',
            targetId: record.id,
            isRead: false,
            createdAt: now
        });
        // Audit log
        await this.auditService.logEvent({
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            organizationId: currentUser.organizationId,
            actionType: 'CLARIFICATION_RESPONSE',
            entityType: 'CLARIFICATION',
            entityId: id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent
        });
        return updated;
    }
}
exports.ClarificationService = ClarificationService;
