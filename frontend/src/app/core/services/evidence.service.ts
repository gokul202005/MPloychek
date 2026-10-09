import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { EvidenceItem } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class EvidenceService {
  constructor(private api: ApiService) {}

  getEvidenceForRecord(recordId: string) {
    return this.api.get<EvidenceItem[]>(`/records/${recordId}/evidence`);
  }

  getEvidenceById(id: string) {
    return this.api.get<EvidenceItem>(`/evidence/${id}`);
  }

  uploadEvidence(
    recordId: string,
    file: File,
    metadata: { documentType: string; title: string; expirationDate?: string }
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', metadata.documentType);
    formData.append('title', metadata.title);
    if (metadata.expirationDate) {
      formData.append('expirationDate', metadata.expirationDate);
    }

    return this.api.upload<EvidenceItem>(`/records/${recordId}/evidence`, formData);
  }

  reviewEvidence(id: string, reviewStatus: 'VERIFIED' | 'FLAGGED' | 'REJECTED', reviewerComments: string) {
    return this.api.patch<EvidenceItem>(`/evidence/${id}/review`, {
      reviewStatus,
      reviewerComments
    });
  }

  getFileBlob(id: string) {
    return this.api.getBlob(`/evidence/${id}/download`);
  }

  downloadEvidence(id: string, fileName: string) {
    return this.api.getBlob(`/evidence/${id}/download`).subscribe({
      next: (blob) => {
        const isPdf = (fileName || '').toLowerCase().endsWith('.pdf');
        const safeBlob = isPdf ? new Blob([blob], { type: 'application/pdf' }) : blob;
        const url = window.URL.createObjectURL(safeBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: (err) => {
        console.error('Failed to download evidence document', err);
      }
    });
  }
}
