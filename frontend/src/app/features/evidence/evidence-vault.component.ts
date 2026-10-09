import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RecordService } from '../../core/services/record.service';
import { EvidenceService } from '../../core/services/evidence.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { EvidenceItem } from '../../shared/models';

@Component({
  selector: 'app-evidence-vault',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 class="text-2xl font-black text-white tracking-tight">Enterprise Evidence Vault</h1>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Cryptographically separated repository of verified worker credentials and supporting audit files
        </p>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="glass-panel p-4 rounded-xl border border-slate-800">
          <span class="text-[11px] text-slate-400 font-medium">Total Credentials</span>
          <div class="text-2xl font-bold font-mono text-white mt-1">{{ evidenceList().length }}</div>
        </div>
        <div class="glass-panel p-4 rounded-xl border border-slate-800">
          <span class="text-[11px] text-slate-400 font-medium">Verified Cleared</span>
          <div class="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {{ countByStatus('VERIFIED') }}
          </div>
        </div>
        <div class="glass-panel p-4 rounded-xl border border-slate-800">
          <span class="text-[11px] text-slate-400 font-medium">Pending Review</span>
          <div class="text-2xl font-bold font-mono text-amber-400 mt-1">
            {{ countByStatus('PENDING') }}
          </div>
        </div>
        <div class="glass-panel p-4 rounded-xl border border-slate-800">
          <span class="text-[11px] text-slate-400 font-medium">Flagged / Anomaly</span>
          <div class="text-2xl font-bold font-mono text-rose-400 mt-1">
            {{ countByStatus('FLAGGED') }}
          </div>
        </div>
      </div>

      <!-- Evidence Documents Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          *ngFor="let item of evidenceList()"
          class="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
        >
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <span class="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-wider">
                {{ item.documentType.replace('_', ' ') }}
              </span>
              <span
                class="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                [ngClass]="getReviewStatusClass(item.reviewStatus)"
              >
                {{ item.reviewStatus }}
              </span>
            </div>

            <h3 class="text-sm font-bold text-white mb-2 leading-snug">{{ item.title }}</h3>

            <div class="text-[11px] text-slate-400 space-y-1 mb-4">
              <div>File: <span class="font-mono text-slate-300">{{ item.originalFilename }}</span></div>
              <div>Submitted by: <span class="text-slate-300">{{ item.submittedByName }}</span></div>
              <div>Date: <span class="text-slate-300">{{ item.submittedAt | date:'mediumDate' }}</span></div>
              <div *ngIf="item.reviewerComments" class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 italic text-[11px] mt-2">
                "{{ item.reviewerComments }}"
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <a
              [routerLink]="['/records', item.recordId]"
              class="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              View Record Vault &rarr;
            </a>

            <button
              (click)="evidenceService.downloadEvidence(item.id, item.originalFilename)"
              class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EvidenceVaultComponent implements OnInit {
  auth = inject(AuthService);
  recordService = inject(RecordService);
  evidenceService = inject(EvidenceService);
  toast = inject(ToastService);

  evidenceList = signal<EvidenceItem[]>([]);

  ngOnInit() {
    this.recordService.getRecords({ limit: 100 }).subscribe({
      next: res => {
        if (res.data) {
          const records = res.data.items;
          const allEvPromises = records.map(r => this.evidenceService.getEvidenceForRecord(r.id));
          allEvPromises.forEach(obs => {
            obs.subscribe({
              next: evRes => {
                if (evRes.data) {
                  this.evidenceList.update(list => [...list, ...evRes.data]);
                }
              }
            });
          });
        }
      }
    });
  }

  countByStatus(status: string): number {
    return this.evidenceList().filter(e => e.reviewStatus === status).length;
  }

  getReviewStatusClass(status: string): string {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30';
      case 'FLAGGED':
        return 'bg-amber-500/10 text-amber-300 border border-amber-500/30';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-300 border border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  }
}
