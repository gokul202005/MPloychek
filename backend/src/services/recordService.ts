import { v4 as uuidv4 } from 'uuid';
import { RecordRepository, RecordQueryParams, PaginatedResult } from '../repositories/xml/recordRepository';
import { EvidenceRepository } from '../repositories/xml/evidenceRepository';
import { ClarificationRepository } from '../repositories/xml/clarificationRepository';
import { TimelineRepository } from '../repositories/xml/timelineRepository';
import { NotificationRepository } from '../repositories/xml/notificationRepository';
import { ConfidenceScoreService } from './confidenceScoreService';
import { AuditService } from './auditService';
import { EmploymentRecord, SafeEmploymentRecord, SafeUser, VerificationStatus } from '../types';

export class RecordService {
  private recordRepo: RecordRepository;
  private evidenceRepo: EvidenceRepository;
  private clarificationRepo: ClarificationRepository;
  private timelineRepo: TimelineRepository;
  private notificationRepo: NotificationRepository;
  private confidenceService: ConfidenceScoreService;
  private auditService: AuditService;

  constructor() {
    this.recordRepo = new RecordRepository();
    this.evidenceRepo = new EvidenceRepository();
    this.clarificationRepo = new ClarificationRepository();
    this.timelineRepo = new TimelineRepository();
    this.notificationRepo = new NotificationRepository();
    this.confidenceService = new ConfidenceScoreService();
    this.auditService = new AuditService();
  }

  async getRecords(
    currentUser: SafeUser,
    params: Omit<RecordQueryParams, 'userRole' | 'userId'>
  ): Promise<PaginatedResult<SafeEmploymentRecord | EmploymentRecord>> {
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

  async getRecordById(
    id: string,
    currentUser: SafeUser
  ): Promise<SafeEmploymentRecord | EmploymentRecord | null> {
    const record = await this.recordRepo.getById(id);
    if (!record) return null;

    if (record.organizationId !== currentUser.organizationId) {
      throw new Error('Access denied: Record belongs to a different organization.');
    }

    if (currentUser.role === 'USER' && record.createdBy !== currentUser.id && record.assignedReviewerId !== currentUser.id) {
      throw new Error('Access denied: You are not authorized to view this record.');
    }

    if (currentUser.role === 'USER') {
      return this.recordRepo.toSafeRecord(record);
    }

    return record;
  }

  async createRecord(
    data: any,
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<EmploymentRecord> {
    const recordId = `rec-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    // Initial dummy record to calculate baseline score
    const tempRecord: EmploymentRecord = {
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
      id: `ev-${uuidv4().substring(0, 8)}`,
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
      id: `notif-${uuidv4().substring(0, 8)}`,
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

  async updateRecord(
    id: string,
    updates: any,
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<EmploymentRecord> {
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
    if (!updated) throw new Error('Failed to update record.');

    // Timeline event if status or confidence changed significantly
    if (updates.verificationStatus && updates.verificationStatus !== previousStatus) {
      await this.timelineRepo.create({
        id: `ev-${uuidv4().substring(0, 8)}`,
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

  async recordVerificationDecision(
    id: string,
    decision: 'VERIFIED' | 'ACTION_REQUIRED' | 'REJECTED' | 'IN_REVIEW',
    reason: string,
    publicNotes: string | undefined,
    internalNotes: string | undefined,
    followUpDeadline: string | undefined,
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<EmploymentRecord> {
    if (currentUser.role !== 'ADMIN') {
      throw new Error('Access denied: Only Administrators can record verification decisions.');
    }

    const existing = await this.recordRepo.getById(id);
    if (!existing) throw new Error('Record not found.');

    const previousStatus = existing.verificationStatus;
    const oldScore = existing.confidenceScore;
    const now = new Date().toISOString();

    const updates: Partial<EmploymentRecord> = {
      verificationStatus: decision,
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
    if (!updated) throw new Error('Failed to update record.');

    // Timeline event
    await this.timelineRepo.create({
      id: `ev-${uuidv4().substring(0, 8)}`,
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
      id: `notif-${uuidv4().substring(0, 8)}`,
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

    return updated;
  }

  async getTimeline(recordId: string, currentUser: SafeUser) {
    const record = await this.recordRepo.getById(recordId);
    if (!record) throw new Error('Record not found.');
    if (record.organizationId !== currentUser.organizationId) {
      throw new Error('Access denied: Different organization.');
    }
    return this.timelineRepo.getByRecordId(recordId);
  }

  async recalculateRecordScore(recordId: string): Promise<EmploymentRecord | null> {
    const record = await this.recordRepo.getById(recordId);
    if (!record) return null;

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
