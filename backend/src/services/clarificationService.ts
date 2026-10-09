import { v4 as uuidv4 } from 'uuid';
import { ClarificationRepository } from '../repositories/xml/clarificationRepository';
import { RecordRepository } from '../repositories/xml/recordRepository';
import { TimelineRepository } from '../repositories/xml/timelineRepository';
import { NotificationRepository } from '../repositories/xml/notificationRepository';
import { ConfidenceScoreService } from './confidenceScoreService';
import { EvidenceRepository } from '../repositories/xml/evidenceRepository';
import { AuditService } from './auditService';
import { ClarificationRequest, SafeUser } from '../types';

export class ClarificationService {
  private clarificationRepo: ClarificationRepository;
  private recordRepo: RecordRepository;
  private timelineRepo: TimelineRepository;
  private notificationRepo: NotificationRepository;
  private evidenceRepo: EvidenceRepository;
  private confidenceService: ConfidenceScoreService;
  private auditService: AuditService;

  constructor() {
    this.clarificationRepo = new ClarificationRepository();
    this.recordRepo = new RecordRepository();
    this.timelineRepo = new TimelineRepository();
    this.notificationRepo = new NotificationRepository();
    this.evidenceRepo = new EvidenceRepository();
    this.confidenceService = new ConfidenceScoreService();
    this.auditService = new AuditService();
  }

  async getClarificationsByRecordId(recordId: string, currentUser: SafeUser): Promise<ClarificationRequest[]> {
    const record = await this.recordRepo.getById(recordId);
    if (!record) throw new Error('Record not found.');
    if (record.organizationId !== currentUser.organizationId) {
      throw new Error('Access denied: Record belongs to different organization.');
    }
    return this.clarificationRepo.getByRecordId(recordId);
  }

  async createClarification(
    recordId: string,
    data: { subject: string; question: string; dueDate: string },
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<ClarificationRequest> {
    if (currentUser.role !== 'ADMIN') {
      throw new Error('Access denied: Only Administrators/Reviewers can issue clarification inquiries.');
    }

    const record = await this.recordRepo.getById(recordId);
    if (!record) throw new Error('Record not found.');

    const clarId = `clar-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const request: ClarificationRequest = {
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
      id: `ev-${uuidv4().substring(0, 8)}`,
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
      id: `notif-${uuidv4().substring(0, 8)}`,
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

  async respondClarification(
    id: string,
    response: string,
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<ClarificationRequest> {
    const clarification = await this.clarificationRepo.getById(id);
    if (!clarification) throw new Error('Clarification request not found.');

    const record = await this.recordRepo.getById(clarification.recordId);
    if (!record) throw new Error('Associated record not found.');

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

    if (!updated) throw new Error('Failed to save response.');

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
      id: `ev-${uuidv4().substring(0, 8)}`,
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
      id: `notif-${uuidv4().substring(0, 8)}`,
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
