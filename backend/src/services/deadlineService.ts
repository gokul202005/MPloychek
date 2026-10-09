import { v4 as uuidv4 } from 'uuid';
import { DeadlineRepository } from '../repositories/xml/deadlineRepository';
import { AuditService } from './auditService';
import { ComplianceDeadline, SafeUser } from '../types';

export class DeadlineService {
  private deadlineRepo: DeadlineRepository;
  private auditService: AuditService;

  constructor() {
    this.deadlineRepo = new DeadlineRepository();
    this.auditService = new AuditService();
  }

  async getDeadlines(
    currentUser: SafeUser,
    filter?: { category?: string; status?: string; overdueOnly?: boolean }
  ) {
    let deadlines = await this.deadlineRepo.getByOrganizationId(currentUser.organizationId);
    const now = new Date().getTime();

    // Dynamically mark overdue items if active and past due
    deadlines = deadlines.map(d => {
      const dueTime = new Date(d.dueDate).getTime();
      if (d.status === 'ACTIVE' && dueTime < now) {
        return { ...d, status: 'OVERDUE' as const };
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

  async createDeadline(
    data: any,
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<ComplianceDeadline> {
    const id = `dl-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const deadline: ComplianceDeadline = {
      id,
      recordId: data.recordId,
      organizationId: currentUser.organizationId,
      title: data.title,
      category: data.category,
      dueDate: data.dueDate,
      status: 'ACTIVE',
      priority: data.priority,
      assignedReviewerId: data.assignedReviewerId || currentUser.id,
      assignedReviewerName:
        data.assignedReviewerName ||
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

  async updateDeadline(
    id: string,
    updates: Partial<ComplianceDeadline>,
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<ComplianceDeadline> {
    const existing = await this.deadlineRepo.getById(id);
    if (!existing) throw new Error('Deadline not found.');

    if (existing.organizationId !== currentUser.organizationId) {
      throw new Error('Access denied: Unauthorized organization.');
    }

    const updated = await this.deadlineRepo.update(id, updates);
    if (!updated) throw new Error('Failed to update deadline.');

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
