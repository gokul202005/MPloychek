import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ClarificationRequest } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ClarificationService {
  constructor(private api: ApiService) {}

  getClarificationsForRecord(recordId: string) {
    return this.api.get<ClarificationRequest[]>(`/records/${recordId}/clarifications`);
  }

  createClarification(recordId: string, payload: { subject: string; question: string; dueDate: string }) {
    return this.api.post<ClarificationRequest>(`/records/${recordId}/clarifications`, payload);
  }

  respondClarification(id: string, response: string) {
    return this.api.post<ClarificationRequest>(`/clarifications/${id}/respond`, { response });
  }
}
