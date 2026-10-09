import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ComplianceDeadline } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  constructor(private api: ApiService) {}

  getDeadlines(filter?: { category?: string; status?: string; overdueOnly?: boolean }) {
    return this.api.get<ComplianceDeadline[]>('/compliance/deadlines', filter);
  }

  createDeadline(payload: Partial<ComplianceDeadline>) {
    return this.api.post<ComplianceDeadline>('/compliance/deadlines', payload);
  }

  updateDeadline(id: string, updates: Partial<ComplianceDeadline>) {
    return this.api.patch<ComplianceDeadline>(`/compliance/deadlines/${id}`, updates);
  }
}
