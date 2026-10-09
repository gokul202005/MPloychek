import { BaseXmlRepository } from './baseXmlRepository';
import { AuditEvent, UserRole } from '../../types';
import { PaginatedResult } from './recordRepository';

export interface AuditQueryParams {
  search?: string;
  actorId?: string;
  actionType?: string;
  entityType?: string;
  entityId?: string;
  outcome?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
}

export class AuditRepository extends BaseXmlRepository<AuditEvent> {
  async getAll(): Promise<AuditEvent[]> {
    const data = await this.getFullData();
    return data.auditEvents;
  }

  async getById(id: string): Promise<AuditEvent | null> {
    const data = await this.getFullData();
    return data.auditEvents.find(a => a.id === id) || null;
  }

  async query(params: AuditQueryParams): Promise<PaginatedResult<AuditEvent>> {
    const data = await this.getFullData();
    let events = [...data.auditEvents];

    if (params.organizationId) {
      events = events.filter(e => e.organizationId === params.organizationId);
    }

    if (params.actorId) {
      events = events.filter(e => e.actorId === params.actorId);
    }

    if (params.entityId) {
      events = events.filter(e => e.entityId === params.entityId);
    }

    if (params.actionType) {
      events = events.filter(e => e.actionType.toLowerCase() === params.actionType?.toLowerCase());
    }

    if (params.entityType) {
      events = events.filter(e => e.entityType.toLowerCase() === params.entityType?.toLowerCase());
    }

    if (params.outcome) {
      events = events.filter(e => e.outcome === params.outcome);
    }

    if (params.startDate) {
      const start = new Date(params.startDate).getTime();
      events = events.filter(e => new Date(e.timestamp).getTime() >= start);
    }

    if (params.endDate) {
      const end = new Date(params.endDate).getTime();
      events = events.filter(e => new Date(e.timestamp).getTime() <= end);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      events = events.filter(
        e =>
          e.actorName.toLowerCase().includes(q) ||
          e.actionType.toLowerCase().includes(q) ||
          e.entityId.toLowerCase().includes(q) ||
          (e.reason && e.reason.toLowerCase().includes(q))
      );
    }

    // Newest first
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = events.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 15));
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = events.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(event: AuditEvent): Promise<AuditEvent> {
    const data = await this.getFullData();
    data.auditEvents.push(event);
    await this.saveFullData(data, `Append Audit Event ${event.id} (${event.actionType})`);
    return event;
  }

  // Audit events are tamper-resistant in normal operations
  async update(id: string, updates: Partial<AuditEvent>): Promise<AuditEvent | null> {
    throw new Error('IMMUTABILITY VIOLATION: Audit events cannot be updated or altered.');
  }

  async delete(id: string): Promise<boolean> {
    throw new Error('IMMUTABILITY VIOLATION: Audit events cannot be deleted.');
  }
}
