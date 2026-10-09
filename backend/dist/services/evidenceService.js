"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const evidenceRepository_1 = require("../repositories/xml/evidenceRepository");
const recordRepository_1 = require("../repositories/xml/recordRepository");
const timelineRepository_1 = require("../repositories/xml/timelineRepository");
const notificationRepository_1 = require("../repositories/xml/notificationRepository");
const confidenceScoreService_1 = require("./confidenceScoreService");
const clarificationRepository_1 = require("../repositories/xml/clarificationRepository");
const auditService_1 = require("./auditService");
class EvidenceService {
    evidenceRepo;
    recordRepo;
    timelineRepo;
    clarificationRepo;
    notificationRepo;
    confidenceService;
    auditService;
    constructor() {
        this.evidenceRepo = new evidenceRepository_1.EvidenceRepository();
        this.recordRepo = new recordRepository_1.RecordRepository();
        this.timelineRepo = new timelineRepository_1.TimelineRepository();
        this.clarificationRepo = new clarificationRepository_1.ClarificationRepository();
        this.notificationRepo = new notificationRepository_1.NotificationRepository();
        this.confidenceService = new confidenceScoreService_1.ConfidenceScoreService();
        this.auditService = new auditService_1.AuditService();
        if (!fs_1.default.existsSync(env_1.config.uploadsDir)) {
            fs_1.default.mkdirSync(env_1.config.uploadsDir, { recursive: true });
        }
    }
    async getEvidenceByRecordId(recordId, currentUser) {
        const record = await this.recordRepo.getById(recordId);
        if (!record)
            throw new Error('Record not found.');
        if (record.organizationId !== currentUser.organizationId) {
            throw new Error('Access denied: Record belongs to another organization.');
        }
        return this.evidenceRepo.getByRecordId(recordId);
    }
    async getEvidenceById(id, currentUser) {
        const evidence = await this.evidenceRepo.getById(id);
        if (!evidence)
            return null;
        if (evidence.organizationId !== currentUser.organizationId) {
            throw new Error('Access denied: Unauthorized organization.');
        }
        return evidence;
    }
    async addEvidence(recordId, fileData, metadata, currentUser, reqMeta) {
        const record = await this.recordRepo.getById(recordId);
        if (!record)
            throw new Error('Associated employment record not found.');
        if (record.organizationId !== currentUser.organizationId) {
            throw new Error('Access denied: Cannot add evidence to another organization.');
        }
        const evidenceId = `evi-${(0, uuid_1.v4)().substring(0, 8)}`;
        const now = new Date().toISOString();
        const evidence = {
            id: evidenceId,
            recordId,
            organizationId: currentUser.organizationId,
            documentType: metadata.documentType,
            title: metadata.title,
            filename: fileData.filename,
            originalFilename: fileData.originalFilename,
            fileSize: fileData.fileSize,
            mimeType: fileData.mimeType,
            storagePath: fileData.storagePath,
            reviewStatus: 'PENDING',
            submittedBy: currentUser.id,
            submittedByName: currentUser.name,
            submittedAt: now,
            expirationDate: metadata.expirationDate
        };
        const saved = await this.evidenceRepo.create(evidence);
        // Recalculate record confidence score
        const allEvidence = await this.evidenceRepo.getByRecordId(recordId);
        const clarifications = await this.clarificationRepo.getByRecordId(recordId);
        const oldScore = record.confidenceScore;
        const breakdown = this.confidenceService.calculateScore(record, allEvidence, clarifications);
        await this.recordRepo.update(recordId, {
            confidenceScore: breakdown.score,
            confidenceLevel: breakdown.level,
            confidenceBreakdownJson: JSON.stringify(breakdown),
            verificationStatus: record.verificationStatus === 'DRAFT' ? 'PENDING' : record.verificationStatus
        });
        // Timeline event
        await this.timelineRepo.create({
            id: `ev-${(0, uuid_1.v4)().substring(0, 8)}`,
            recordId,
            organizationId: currentUser.organizationId,
            eventType: 'EVIDENCE_UPLOADED',
            title: `Evidence Submitted: ${metadata.title}`,
            description: `${currentUser.name} uploaded ${metadata.documentType} document (${fileData.originalFilename}). Trust score recalculated to ${breakdown.score}/100.`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            scoreDelta: breakdown.score - oldScore,
            timestamp: now
        });
        // Notification for Reviewers / Admins
        await this.notificationRepo.create({
            id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
            recipientId: record.assignedReviewerId || 'ALL_ADMINS',
            organizationId: currentUser.organizationId,
            title: 'New Evidence Submitted for Review',
            message: `${currentUser.name} uploaded '${metadata.title}' for employee ${record.employeeName}.`,
            category: 'EVIDENCE_REVIEW',
            targetType: 'EVIDENCE',
            targetId: saved.id,
            isRead: false,
            createdAt: now
        });
        // Audit log
        await this.auditService.logEvent({
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            organizationId: currentUser.organizationId,
            actionType: 'EVIDENCE_UPLOAD',
            entityType: 'EVIDENCE',
            entityId: saved.id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent,
            metadata: { documentType: metadata.documentType, filename: fileData.originalFilename }
        });
        return saved;
    }
    async reviewEvidence(id, status, comments, currentUser, reqMeta) {
        if (currentUser.role !== 'ADMIN') {
            throw new Error('Access denied: Only Administrators can review evidence.');
        }
        const evidence = await this.evidenceRepo.getById(id);
        if (!evidence)
            throw new Error('Evidence item not found.');
        const record = await this.recordRepo.getById(evidence.recordId);
        if (!record)
            throw new Error('Associated record not found.');
        const now = new Date().toISOString();
        const updated = await this.evidenceRepo.update(id, {
            reviewStatus: status,
            reviewerId: currentUser.id,
            reviewerName: currentUser.name,
            reviewerComments: comments,
            reviewedAt: now
        });
        if (!updated)
            throw new Error('Failed to update evidence review status.');
        // Recalculate record confidence score
        const allEvidence = await this.evidenceRepo.getByRecordId(record.id);
        const clarifications = await this.clarificationRepo.getByRecordId(record.id);
        const oldScore = record.confidenceScore;
        const breakdown = this.confidenceService.calculateScore(record, allEvidence, clarifications);
        await this.recordRepo.update(record.id, {
            confidenceScore: breakdown.score,
            confidenceLevel: breakdown.level,
            confidenceBreakdownJson: JSON.stringify(breakdown)
        });
        // Timeline event
        await this.timelineRepo.create({
            id: `ev-${(0, uuid_1.v4)().substring(0, 8)}`,
            recordId: record.id,
            organizationId: currentUser.organizationId,
            eventType: 'EVIDENCE_REVIEWED',
            title: `Evidence Reviewed: ${status}`,
            description: `Reviewer ${currentUser.name} marked '${evidence.title}' as ${status}. Comments: ${comments}`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            scoreDelta: breakdown.score - oldScore,
            timestamp: now
        });
        // Notify submitter
        await this.notificationRepo.create({
            id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
            recipientId: evidence.submittedBy,
            organizationId: currentUser.organizationId,
            title: `Evidence Review: ${status}`,
            message: `Your document '${evidence.title}' for ${record.employeeName} was marked as ${status}.`,
            category: 'EVIDENCE_REVIEW',
            targetType: 'EVIDENCE',
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
            actionType: 'EVIDENCE_REVIEW',
            entityType: 'EVIDENCE',
            entityId: id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent,
            metadata: { reviewStatus: status, comments }
        });
        return updated;
    }
    getFilePath(evidence) {
        const safePath = path_1.default.resolve(env_1.config.uploadsDir, evidence.filename);
        // Path traversal defense
        if (!safePath.startsWith(path_1.default.resolve(env_1.config.uploadsDir))) {
            throw new Error('SECURITY VIOLATION: Path traversal attempt detected.');
        }
        return safePath;
    }
}
exports.EvidenceService = EvidenceService;
