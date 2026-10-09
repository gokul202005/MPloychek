import { Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EvidenceItem } from '../../models';
import { EvidenceService } from '../../../core/services/evidence.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-pdf-viewer-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isOpen && item"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md transition-all animate-fadeIn"
      (click)="onBackdropClick($event)"
    >
      <div
        class="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[92vh]"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="truncate">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-white truncate">{{ item.title }}</h3>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono"
                  [ngClass]="getStatusBadgeClass(item.reviewStatus)"
                >
                  {{ item.reviewStatus }}
                </span>
              </div>
              <p class="text-xs text-slate-400 truncate mt-0.5">
                {{ item.originalFilename }} • {{ formatFileSize(item.fileSize) }} • {{ item.documentType.replace('_', ' ') }}
              </p>
            </div>
          </div>

          <!-- Header Toolbar Actions -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              *ngIf="rawUrl"
              (click)="openInNewTab()"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Open document in new browser tab"
            >
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>New Tab</span>
            </button>

            <button
              (click)="downloadFile()"
              class="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow flex items-center gap-1.5 transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </button>

            <button
              (click)="closeModal()"
              class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Preview (Esc)"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Body (Preview Canvas) -->
        <div class="flex-1 bg-slate-950 p-4 overflow-hidden relative flex flex-col items-center justify-center min-h-[480px]">
          <!-- Loading State -->
          <div *ngIf="isLoading" class="flex flex-col items-center justify-center gap-3 text-slate-400">
            <div class="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs">Loading secure document preview...</p>
          </div>

          <!-- Error State -->
          <div *ngIf="errorMessage && !isLoading" class="text-center p-6 space-y-3">
            <div class="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p class="text-sm font-semibold text-white">{{ errorMessage }}</p>
            <button
              (click)="downloadFile()"
              class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              Download Directly Instead
            </button>
          </div>

          <!-- Active PDF Embed -->
          <iframe
            *ngIf="safeUrl && !isLoading && !errorMessage"
            [src]="safeUrl"
            class="w-full h-full rounded-xl border border-slate-800 bg-slate-900 shadow-inner"
            style="min-height: 60vh;"
            title="PDF Document Viewer"
          ></iframe>
        </div>

        <!-- Document Security Footer -->
        <div class="px-6 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="font-medium text-slate-300">Cryptographically Audited Evidence Artifact</span>
            <span>•</span>
            <span class="font-mono text-slate-500">ID: {{ item.id }}</span>
          </div>
          <div class="text-[11px] text-slate-400">
            Uploaded by <span class="text-slate-300">{{ item.submittedByName }}</span> on {{ item.submittedAt | date:'medium' }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class PdfViewerModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() item: EvidenceItem | null = null;
  @Output() close = new EventEmitter<void>();

  private evidenceService = inject(EvidenceService);
  private sanitizer = inject(DomSanitizer);
  private toast = inject(ToastService);

  safeUrl: SafeResourceUrl | null = null;
  rawUrl: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen'] || changes['item']) && this.isOpen && this.item) {
      this.loadPreview(this.item);
    } else if (!this.isOpen) {
      this.cleanupUrl();
    }
  }

  ngOnDestroy(): void {
    this.cleanupUrl();
  }

  private loadPreview(item: EvidenceItem): void {
    this.cleanupUrl();
    this.isLoading = true;
    this.errorMessage = null;

    this.evidenceService.getFileBlob(item.id).subscribe({
      next: (blob) => {
        try {
          const isPdf = (item.originalFilename || '').toLowerCase().endsWith('.pdf');
          const safeBlob = isPdf ? new Blob([blob], { type: 'application/pdf' }) : blob;
          const url = window.URL.createObjectURL(safeBlob);
          this.rawUrl = url;
          this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          this.isLoading = false;
        } catch (err: any) {
          this.isLoading = false;
          this.errorMessage = 'Unable to render inline preview in this browser session.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load document from secure vault storage.';
      }
    });
  }

  openInNewTab(): void {
    if (this.rawUrl) {
      window.open(this.rawUrl, '_blank');
    }
  }

  downloadFile(): void {
    if (this.item) {
      this.evidenceService.downloadEvidence(this.item.id, this.item.originalFilename);
      this.toast.success(`Downloading ${this.item.originalFilename}`);
    }
  }

  closeModal(): void {
    this.cleanupUrl();
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    this.closeModal();
  }

  private cleanupUrl(): void {
    if (this.rawUrl) {
      window.URL.revokeObjectURL(this.rawUrl);
      this.rawUrl = null;
    }
    this.safeUrl = null;
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'FLAGGED':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  }
}
