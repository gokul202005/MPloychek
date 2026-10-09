import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecordService } from '../../core/services/record.service';
import { EvidenceService } from '../../core/services/evidence.service';
import { ClarificationService } from '../../core/services/clarification.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import {
  EmploymentRecord,
  EvidenceItem,
  VerificationEvent,
  ClarificationRequest,
  ConfidenceBreakdown
} from '../../shared/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfidenceGaugeComponent } from '../../shared/components/confidence-gauge/confidence-gauge.component';

@Component({
  selector: 'app-record-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent, ConfidenceGaugeComponent],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto" *ngIf="record()">
      <!-- Header Breadcrumbs & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <a routerLink="/records" class="hover:text-white transition-colors">Directory</a>
            <span>/</span>
            <span class="text-slate-300 font-mono">{{ record()!.employeeId }}</span>
          </div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-black text-white tracking-tight">{{ record()!.employeeName }}</h1>
            <app-status-badge [status]="record()!.verificationStatus"></app-status-badge>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            {{ record()!.jobTitle }} • {{ record()!.department }} ({{ record()!.employmentType.replace('_', ' ') }})
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <!-- Evidence Upload Trigger -->
          <button
            (click)="openUploadModal()"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <svg class="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Deposit Evidence
          </button>

          <!-- Clarification Request Trigger (Admin) -->
          <button
            *ngIf="auth.isAdmin()"
            (click)="openClarificationModal()"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Request Clarification
          </button>

          <!-- Reviewer Decision Button (Admin) -->
          <button
            *ngIf="auth.isAdmin()"
            (click)="openDecisionModal()"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Reviewer Decision
          </button>
        </div>
      </div>

      <!-- Overview Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Core Profile & Timestamps -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Employment Details</h2>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px]">Employee ID</span>
              <span class="font-mono font-bold text-white">{{ record()!.employeeId }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Start Date</span>
              <span class="text-white">{{ record()!.startDate }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Background Screening</span>
              <span class="font-semibold text-emerald-400">{{ record()!.backgroundCheckStatus }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Follow-up Deadline</span>
              <span class="text-amber-400 font-mono">{{ record()!.followUpDeadline || 'None' }}</span>
            </div>
          </div>

          <!-- Public Reviewer Notes -->
          <div *ngIf="record()!.publicReviewerNotes" class="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <span class="text-[10px] text-brand-400 font-semibold block mb-0.5">Reviewer Instructions</span>
            <p class="text-slate-300 leading-relaxed">{{ record()!.publicReviewerNotes }}</p>
          </div>
        </div>

        <!-- Verification Trust Index Breakdown -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Trust Confidence Score</h2>
              <app-confidence-gauge [score]="record()!.confidenceScore"></app-confidence-gauge>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed italic" *ngIf="confidenceBreakdown()">
              "{{ confidenceBreakdown()!.summary }}"
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Deterministic Rules Engine</span>
            <span>5 Trust Pillars</span>
          </div>
        </div>

        <!-- Confidential Administrative Assessment (Admin Only) -->
        <div
          *ngIf="auth.isAdmin()"
          class="glass-panel p-5 rounded-2xl border border-purple-900/40 bg-purple-950/10 flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center gap-1.5 mb-3">
              <svg class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 class="text-xs font-bold text-purple-300 uppercase tracking-wider">Confidential Executive Scope</h2>
            </div>
            <div class="space-y-2 text-xs">
              <div>
                <span class="text-slate-400 block text-[10px]">Compensation Grade</span>
                <span class="font-mono font-bold text-purple-200">{{ record()!.compensationGrade || 'Unassigned' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Internal Assessment Notes</span>
                <p class="text-slate-300 italic">{{ record()!.internalAssessmentNotes || 'None logged' }}</p>
              </div>
            </div>
          </div>

          <div class="mt-4 text-[10px] text-purple-400/80 font-mono">
            Redacted for General Users
          </div>
        </div>
      </div>

      <!-- Trust Pillars Scoring Breakdown Accordion / Cards -->
      <div *ngIf="confidenceBreakdown()" class="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>Trust Score Pillar Breakdown</span>
          <span class="text-brand-400 font-mono font-semibold">({{ record()!.confidenceScore }}/100)</span>
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div
            *ngFor="let factor of confidenceBreakdown()!.factors"
            class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-white truncate" [title]="factor.factor">{{ factor.factor }}</span>
                <span class="text-xs font-mono font-bold" [ngClass]="getFactorColor(factor.status)">
                  {{ factor.score }}/{{ factor.weight }}
                </span>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed mt-2">{{ factor.explanation }}</p>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
              <span class="text-slate-500">Status</span>
              <span [ngClass]="getFactorColor(factor.status)" class="font-bold">{{ factor.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation: Evidence Vault, Confidence Timeline, Clarification Requests -->
      <div class="border-b border-slate-800 flex items-center gap-6 text-xs font-bold">
        <button
          (click)="activeTab = 'evidence'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'evidence' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Evidence Vault ({{ evidenceItems().length }})
        </button>

        <button
          (click)="activeTab = 'timeline'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'timeline' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Verification Timeline ({{ timelineEvents().length }})
        </button>

        <button
          (click)="activeTab = 'clarifications'"
          class="pb-3 border-b-2 transition-colors flex items-center gap-2"
          [ngClass]="activeTab === 'clarifications' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Clarification Requests ({{ clarifications().length }})
        </button>
      </div>

      <!-- Tab 1: Evidence Vault Subview -->
      <div *ngIf="activeTab === 'evidence'" class="space-y-4">
        <div *ngIf="evidenceItems().length === 0" class="glass-panel p-10 rounded-2xl border border-slate-800 text-center">
          <p class="text-xs text-slate-400 mb-3">No supporting credentials deposited in the vault yet.</p>
          <button
            (click)="openUploadModal()"
            class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow"
          >
            Deposit Initial Evidence Document
          </button>
        </div>

        <div *ngIf="evidenceItems().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            *ngFor="let item of evidenceItems()"
            class="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div class="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span class="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-wider block">
                    {{ item.documentType.replace('_', ' ') }}
                  </span>
                  <h3 class="text-sm font-bold text-white mt-0.5">{{ item.title }}</h3>
                </div>
                <span
                  class="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                  [ngClass]="getReviewStatusClass(item.reviewStatus)"
                >
                  {{ item.reviewStatus }}
                </span>
              </div>

              <div class="text-[11px] text-slate-400 space-y-1 mb-3">
                <div>File: <span class="font-mono text-slate-300">{{ item.originalFilename }}</span> ({{ formatFileSize(item.fileSize) }})</div>
                <div>Submitted by: <span class="text-slate-300">{{ item.submittedByName }}</span> on {{ item.submittedAt | date:'mediumDate' }}</div>
                <div *ngIf="item.reviewerComments" class="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 italic">
                  Reviewer: "{{ item.reviewerComments }}"
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-slate-800/60">
              <button
                (click)="downloadEvidence(item)"
                class="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Secure Download
              </button>

              <button
                *ngIf="auth.isAdmin()"
                (click)="openReviewEvidenceModal(item)"
                class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
              >
                Review Item
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Verification Confidence Timeline Subview -->
      <div *ngIf="activeTab === 'timeline'" class="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Auditable Verification Timeline</h2>

        <div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          <div *ngFor="let ev of timelineEvents()" class="relative">
            <!-- Event dot -->
            <span
              class="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-slate-900 shadow"
              [ngClass]="getTimelineDotClass(ev.eventType)"
            ></span>

            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <span class="text-xs font-bold text-white">{{ ev.title }}</span>
                <span class="text-[10px] text-slate-500 font-mono">{{ ev.timestamp | date:'medium' }}</span>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">{{ ev.description }}</p>

              <div class="flex items-center gap-3 mt-3 text-[10px] font-mono text-slate-400">
                <span>Actor: <strong class="text-slate-300">{{ ev.actorName }}</strong> ({{ ev.actorRole }})</span>
                <span *ngIf="ev.scoreDelta !== undefined && ev.scoreDelta !== 0" class="font-bold" [ngClass]="ev.scoreDelta > 0 ? 'text-emerald-400' : 'text-rose-400'">
                  Δ Confidence: {{ ev.scoreDelta > 0 ? '+' : '' }}{{ ev.scoreDelta }} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Clarification Requests Subview -->
      <div *ngIf="activeTab === 'clarifications'" class="space-y-4">
        <div *ngIf="clarifications().length === 0" class="glass-panel p-10 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
          No outstanding clarification inquiries recorded on this verification record.
        </div>

        <div *ngFor="let clar of clarifications()" class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-[10px] text-slate-400 font-mono">Inquiry from {{ clar.requestedByName }}</span>
              <h3 class="text-sm font-bold text-white mt-0.5">{{ clar.subject }}</h3>
            </div>
            <span
              class="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
              [ngClass]="clar.status === 'OPEN' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'"
            >
              {{ clar.status }}
            </span>
          </div>

          <p class="text-xs text-slate-300 p-3 rounded-xl bg-slate-900 border border-slate-800">
            {{ clar.question }}
          </p>

          <div *ngIf="clar.response" class="p-3 rounded-xl bg-brand-950/20 border border-brand-900/40 text-xs">
            <span class="text-[10px] text-brand-400 font-bold block mb-1">
              Response from {{ clar.respondedByName }} ({{ clar.respondedAt | date:'mediumDate' }}):
            </span>
            <p class="text-slate-200">{{ clar.response }}</p>
          </div>

          <!-- Respond Form if OPEN and Authorized -->
          <div *ngIf="clar.status === 'OPEN'" class="pt-3 border-t border-slate-800/60">
            <div *ngIf="selectedClarId !== clar.id">
              <button
                (click)="selectedClarId = clar.id"
                class="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow"
              >
                Submit Response
              </button>
            </div>

            <div *ngIf="selectedClarId === clar.id" class="space-y-3">
              <textarea
                [(ngModel)]="clarResponseText"
                rows="3"
                placeholder="Provide detailed clarification response to address reviewer's inquiry..."
                class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
              ></textarea>
              <div class="flex items-center gap-2">
                <button
                  (click)="submitClarResponse(clar.id)"
                  [disabled]="isSubmittingClar()"
                  class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {{ isSubmittingClar() ? 'Submitting...' : 'Send Clarification Response' }}
                </button>
                <button
                  (click)="selectedClarId = null"
                  class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: Deposit Evidence -->
      <div *ngIf="showUploadModal()" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full relative shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 class="text-sm font-bold text-white">Deposit Evidence Document</h2>
            <button (click)="closeUploadModal()" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <form (ngSubmit)="onUploadSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Document Title *</label>
              <input
                type="text"
                [(ngModel)]="uploadTitle"
                name="uploadTitle"
                required
                placeholder="e.g. Master Degree Transcripts"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Document Type *</label>
              <select
                [(ngModel)]="uploadDocType"
                name="uploadDocType"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="OFFER_LETTER">Signed Offer Letter</option>
                <option value="PAYSTUB">Paystub / Salary Proof</option>
                <option value="DEGREE_CERTIFICATE">Degree / Academic Certificate</option>
                <option value="TAX_FORM_W2">Tax Form W-2 / Tax Certificate</option>
                <option value="GOVT_ID">Government ID / Passport</option>
                <option value="REFERENCE_LETTER">Reference / Recommendation Letter</option>
                <option value="OTHER">Other Attested Document</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Upload File * (PDF, PNG, JPG, DOCX)</label>
              <input
                type="file"
                (change)="onFileSelected($event)"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
              />
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="closeUploadModal()"
                class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isUploading()"
                class="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white disabled:opacity-50"
              >
                {{ isUploading() ? 'Depositing...' : 'Upload & Audit' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Review Evidence Document (Admin) -->
      <div *ngIf="showReviewModal()" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full relative shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 class="text-sm font-bold text-white">Review Evidence Document</h2>
            <button (click)="closeReviewModal()" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <form (ngSubmit)="onReviewEvidenceSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Review Status</label>
              <select
                [(ngModel)]="reviewStatus"
                name="reviewStatus"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="VERIFIED">VERIFIED (Authenticated)</option>
                <option value="FLAGGED">FLAGGED (Requires Attention)</option>
                <option value="REJECTED">REJECTED (Invalid / Fraudulent)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Reviewer Comments *</label>
              <textarea
                [(ngModel)]="reviewComments"
                name="reviewComments"
                rows="3"
                required
                placeholder="Reason or notes regarding document authentication..."
                class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="closeReviewModal()"
                class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Save Decision
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Request Clarification (Admin) -->
      <div *ngIf="showClarModal()" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full relative shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 class="text-sm font-bold text-white">Issue Clarification Inquiry</h2>
            <button (click)="closeClarModal()" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <form (ngSubmit)="onClarSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Inquiry Subject *</label>
              <input
                type="text"
                [(ngModel)]="clarSubject"
                name="clarSubject"
                required
                placeholder="e.g. Mismatch on tax form employer ID"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Question / Discrepancy Details *</label>
              <textarea
                [(ngModel)]="clarQuestion"
                name="clarQuestion"
                rows="3"
                required
                placeholder="Explain the required clarification or supporting document needed..."
                class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Response Due Date *</label>
              <input
                type="date"
                [(ngModel)]="clarDueDate"
                name="clarDueDate"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="closeClarModal()"
                class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white"
              >
                Issue Inquiry
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Record Decision (Admin) -->
      <div *ngIf="showDecisionModal()" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel p-6 rounded-2xl border border-slate-700 max-w-lg w-full relative shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 class="text-sm font-bold text-white">Record Formal Verification Decision</h2>
            <button (click)="closeDecisionModal()" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <form (ngSubmit)="onDecisionSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Final Decision *</label>
              <select
                [(ngModel)]="decisionStatus"
                name="decisionStatus"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-bold"
              >
                <option value="VERIFIED">VERIFIED (Cleared & Approved)</option>
                <option value="ACTION_REQUIRED">ACTION REQUIRED (Pending Evidence)</option>
                <option value="REJECTED">REJECTED (Failed Verification)</option>
                <option value="IN_REVIEW">IN REVIEW (Under Ongoing Audit)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Justification Reason * (Audit Logged)</label>
              <textarea
                [(ngModel)]="decisionReason"
                name="decisionReason"
                rows="2"
                required
                placeholder="Explain the regulatory rationale for this decision..."
                class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Public Notes (Visible to employee/submitter)</label>
              <input
                type="text"
                [(ngModel)]="decisionPublicNotes"
                name="decisionPublicNotes"
                placeholder="e.g. Cleared for onboarding master record"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Confidential Reviewer Notes (Admin Only)</label>
              <input
                type="text"
                [(ngModel)]="decisionInternalNotes"
                name="decisionInternalNotes"
                placeholder="e.g. Audit cleared by Eleanor Vance"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="closeDecisionModal()"
                class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Persist Decision to XML
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RecordDetailComponent implements OnInit {
  auth = inject(AuthService);
  recordService = inject(RecordService);
  evidenceService = inject(EvidenceService);
  clarService = inject(ClarificationService);
  toast = inject(ToastService);
  route = inject(ActivatedRoute);

  recordId = '';
  record = signal<EmploymentRecord | null>(null);
  evidenceItems = signal<EvidenceItem[]>([]);
  timelineEvents = signal<VerificationEvent[]>([]);
  clarifications = signal<ClarificationRequest[]>([]);
  confidenceBreakdown = signal<ConfidenceBreakdown | null>(null);

  activeTab: 'evidence' | 'timeline' | 'clarifications' = 'evidence';

  // Upload modal state
  showUploadModal = signal<boolean>(false);
  uploadTitle = '';
  uploadDocType = 'OFFER_LETTER';
  selectedFile: File | null = null;
  isUploading = signal<boolean>(false);

  // Review evidence modal state
  showReviewModal = signal<boolean>(false);
  selectedEvidenceItem: EvidenceItem | null = null;
  reviewStatus: 'VERIFIED' | 'FLAGGED' | 'REJECTED' = 'VERIFIED';
  reviewComments = '';

  // Clarification modal state
  showClarModal = signal<boolean>(false);
  clarSubject = '';
  clarQuestion = '';
  clarDueDate = new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);

  // Response inline state
  selectedClarId: string | null = null;
  clarResponseText = '';
  isSubmittingClar = signal<boolean>(false);

  // Decision modal state
  showDecisionModal = signal<boolean>(false);
  decisionStatus: 'VERIFIED' | 'ACTION_REQUIRED' | 'REJECTED' | 'IN_REVIEW' = 'VERIFIED';
  decisionReason = '';
  decisionPublicNotes = '';
  decisionInternalNotes = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.recordId = params['id'];
      this.loadAll();
    });
  }

  loadAll() {
    this.recordService.getRecordById(this.recordId).subscribe({
      next: res => {
        if (res.data) {
          this.record.set(res.data);
          try {
            this.confidenceBreakdown.set(JSON.parse(res.data.confidenceBreakdownJson));
          } catch {
            this.confidenceBreakdown.set(null);
          }
        }
      },
      error: err => {
        this.toast.error(err.error?.error || 'Failed to load record details.');
      }
    });

    this.recordService.getTimeline(this.recordId).subscribe({
      next: res => {
        if (res.data) this.timelineEvents.set(res.data);
      }
    });

    this.evidenceService.getEvidenceForRecord(this.recordId).subscribe({
      next: res => {
        if (res.data) this.evidenceItems.set(res.data);
      }
    });

    this.clarService.getClarificationsForRecord(this.recordId).subscribe({
      next: res => {
        if (res.data) this.clarifications.set(res.data);
      }
    });
  }

  getFactorColor(status: string): string {
    switch (status) {
      case 'OPTIMAL':
        return 'text-emerald-400';
      case 'ACCEPTABLE':
        return 'text-sky-400';
      case 'NEEDS_ATTENTION':
        return 'text-amber-400';
      default:
        return 'text-rose-400';
    }
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

  getTimelineDotClass(eventType: string): string {
    switch (eventType) {
      case 'DECISION_RECORDED':
      case 'EVIDENCE_REVIEWED':
        return 'bg-emerald-400';
      case 'CLARIFICATION_REQUESTED':
        return 'bg-rose-400';
      case 'EVIDENCE_UPLOADED':
        return 'bg-brand-400';
      default:
        return 'bg-slate-400';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Upload actions
  openUploadModal() { this.showUploadModal.set(true); }
  closeUploadModal() { this.showUploadModal.set(false); }
  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }
  onUploadSubmit() {
    if (!this.selectedFile || !this.uploadTitle) {
      this.toast.error('File and title are required.');
      return;
    }
    this.isUploading.set(true);
    this.evidenceService.uploadEvidence(this.recordId, this.selectedFile, {
      documentType: this.uploadDocType,
      title: this.uploadTitle
    }).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.closeUploadModal();
        this.toast.success('Document deposited in evidence vault!');
        this.loadAll();
      },
      error: err => {
        this.isUploading.set(false);
        this.toast.error(err.error?.error || 'Upload failed.');
      }
    });
  }

  // Download action
  downloadEvidence(item: EvidenceItem) {
    this.evidenceService.downloadEvidence(item.id, item.originalFilename);
  }

  // Review evidence actions
  openReviewEvidenceModal(item: EvidenceItem) {
    this.selectedEvidenceItem = item;
    this.reviewStatus = (item.reviewStatus === 'PENDING' ? 'VERIFIED' : item.reviewStatus) as any;
    this.reviewComments = item.reviewerComments || '';
    this.showReviewModal.set(true);
  }
  closeReviewModal() { this.showReviewModal.set(false); }
  onReviewEvidenceSubmit() {
    if (!this.selectedEvidenceItem || !this.reviewComments) {
      this.toast.error('Review comments are mandatory.');
      return;
    }
    this.evidenceService.reviewEvidence(this.selectedEvidenceItem.id, this.reviewStatus, this.reviewComments).subscribe({
      next: () => {
        this.closeReviewModal();
        this.toast.success(`Evidence marked as ${this.reviewStatus}!`);
        this.loadAll();
      },
      error: err => {
        this.toast.error(err.error?.error || 'Review failed.');
      }
    });
  }

  // Clarification actions
  openClarificationModal() { this.showClarModal.set(true); }
  closeClarModal() { this.showClarModal.set(false); }
  onClarSubmit() {
    if (!this.clarSubject || !this.clarQuestion || !this.clarDueDate) {
      this.toast.error('All inquiry fields are required.');
      return;
    }
    this.clarService.createClarification(this.recordId, {
      subject: this.clarSubject,
      question: this.clarQuestion,
      dueDate: this.clarDueDate
    }).subscribe({
      next: () => {
        this.closeClarModal();
        this.toast.success('Clarification inquiry issued!');
        this.loadAll();
      },
      error: err => {
        this.toast.error(err.error?.error || 'Inquiry creation failed.');
      }
    });
  }
  submitClarResponse(clarId: string) {
    if (!this.clarResponseText) {
      this.toast.error('Response text is required.');
      return;
    }
    this.isSubmittingClar.set(true);
    this.clarService.respondClarification(clarId, this.clarResponseText).subscribe({
      next: () => {
        this.isSubmittingClar.set(false);
        this.selectedClarId = null;
        this.clarResponseText = '';
        this.toast.success('Clarification response submitted!');
        this.loadAll();
      },
      error: err => {
        this.isSubmittingClar.set(false);
        this.toast.error(err.error?.error || 'Response failed.');
      }
    });
  }

  // Decision actions
  openDecisionModal() { this.showDecisionModal.set(true); }
  closeDecisionModal() { this.showDecisionModal.set(false); }
  onDecisionSubmit() {
    if (!this.decisionReason) {
      this.toast.error('Audit justification reason is required.');
      return;
    }
    this.recordService.recordDecision(this.recordId, {
      decision: this.decisionStatus,
      reason: this.decisionReason,
      publicNotes: this.decisionPublicNotes,
      internalNotes: this.decisionInternalNotes
    }).subscribe({
      next: () => {
        this.closeDecisionModal();
        this.toast.success(`Verification decision ${this.decisionStatus} recorded in XML!`);
        this.loadAll();
      },
      error: err => {
        this.toast.error(err.error?.error || 'Decision recording failed.');
      }
    });
  }
}
