import { v4 as uuidv4 } from 'uuid';
import { AuditRepository, AuditQueryParams } from '../repositories/xml/auditRepository';
import { AuditEvent, UserRole } from '../types';

export class AuditService {
  private auditRepo: AuditRepository;

  constructor() {
    this.auditRepo = new AuditRepository();
  }

  async logEvent(params: {
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    organizationId: string;
    actionType: string;
    entityType: 'USER' | 'RECORD' | 'EVIDENCE' | 'DEADLINE' | 'AUTH' | 'CLARIFICATION';
    entityId: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
    requestId: string;
    ip?: string;
    userAgent?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: `audit-${uuidv4().substring(0, 8)}`,
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

  async queryAuditTrail(params: AuditQueryParams) {
    return this.auditRepo.query(params);
  }

  async getAuditById(id: string) {
    return this.auditRepo.getById(id);
  }
}
