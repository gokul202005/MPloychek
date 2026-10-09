import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { EmploymentRecord, PaginatedResponse, VerificationEvent } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class RecordService {
  constructor(private api: ApiService) {}

  getRecords(params?: {
    search?: string;
    status?: string;
    department?: string;
    employmentType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    return this.api.get<PaginatedResponse<EmploymentRecord>>('/records', params);
  }

  getRecordById(id: string) {
    return this.api.get<EmploymentRecord>(`/records/${id}`);
  }

  createRecord(data: Partial<EmploymentRecord>) {
    return this.api.post<EmploymentRecord>('/records', data);
  }

  updateRecord(id: string, updates: Partial<EmploymentRecord>) {
    return this.api.patch<EmploymentRecord>(`/records/${id}`, updates);
  }

  recordDecision(id: string, payload: {
    decision: 'VERIFIED' | 'ACTION_REQUIRED' | 'REJECTED' | 'IN_REVIEW';
    reason: string;
    publicNotes?: string;
    internalNotes?: string;
    followUpDeadline?: string;
  }) {
    return this.api.post<EmploymentRecord>(`/records/${id}/decision`, payload);
  }

  getTimeline(id: string) {
    return this.api.get<VerificationEvent[]>(`/records/${id}/timeline`);
  }
}
