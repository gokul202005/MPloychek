import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuditEvent, PaginatedResponse } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  constructor(private api: ApiService) {}

  getAuditEvents(params?: {
    search?: string;
    actorId?: string;
    actionType?: string;
    entityType?: string;
    outcome?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return this.api.get<PaginatedResponse<AuditEvent>>('/audit-events', params);
  }

  getAuditEventById(id: string) {
    return this.api.get<AuditEvent>(`/audit-events/${id}`);
  }
}
