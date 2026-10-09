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
import { PdfViewerModalComponent } from '../../shared/components/pdf-viewer-modal/pdf-viewer-modal.component';

@Component({
  selector: 'app-record-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent, ConfidenceGaugeComponent, PdfViewerModalComponent],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto" *ngIf="record()">
      <!-- Header Breadcrumbs & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 text-xs text-slate-400 mb-2">
            <a
              routerLink="/records"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold border border-slate-700 transition-colors shadow-sm"
              title="Return to Verification Directory"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Directory</span>
            </a>
            <span>•</span>
            <span class="text-slate-400 font-mono">{{ record()!.employeeId }}</span>
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
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h2 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" />
              </svg>
              Employment Profile
            </h2>
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700/60">
              {{ record()!.employeeId }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <span class="text-slate-400 block text-[10px] font-medium">Department</span>
              <span class="text-white font-semibold text-xs truncate block mt-0.5">{{ record()!.department }}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <span class="text-slate-400 block text-[10px] font-medium">Start Date</span>
              <span class="text-white font-semibold text-xs block mt-0.5">{{ record()!.startDate }}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 flex flex-col justify-between">
              <span class="text-slate-400 block text-[10px] font-medium mb-1">Background Screening</span>
              <!-- Only allow changing if NOT verified -->
              <div *ngIf="auth.isAdmin() && record()!.verificationStatus !== 'VERIFIED'" class="relative">
                <select
                  [value]="record()!.backgroundCheckStatus"
                  (change)="onBackgroundStatusChange($event)"
                  class="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-brand-500 cursor-pointer transition-colors"
                  [ngClass]="record()!.backgroundCheckStatus === 'PASSED' ? 'text-emerald-400' : record()!.backgroundCheckStatus === 'FLAGGED' ? 'text-rose-400' : 'text-amber-400'"
                >
                  <option value="NOT_STARTED" class="bg-slate-900 text-slate-300">NOT STARTED</option>
                  <option value="IN_PROGRESS" class="bg-slate-900 text-amber-400">IN PROGRESS</option>
                  <option value="PASSED" class="bg-slate-900 text-emerald-400">PASSED</option>
                  <option value="FLAGGED" class="bg-slate-900 text-rose-400">FLAGGED</option>
                </select>
              </div>
              <!-- Locked state when VERIFIED or for non-admin -->
              <div
                *ngIf="!auth.isAdmin() || record()!.verificationStatus === 'VERIFIED'"
                class="flex items-center gap-1.5 mt-0.5"
              >
                <span
                  class="font-semibold text-xs"
                  [ngClass]="record()!.backgroundCheckStatus === 'PASSED' ? 'text-emerald-400' : record()!.backgroundCheckStatus === 'FLAGGED' ? 'text-rose-400' : 'text-amber-400'"
                >
                  {{ record()!.backgroundCheckStatus }}
                </span>
                <span *ngIf="record()!.verificationStatus === 'VERIFIED'" class="text-[10px] text-slate-500 font-mono" title="Verified - locked">
                  🔒
                </span>
              </div>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <span class="text-slate-400 block text-[10px] font-medium">Audit Cycle / Follow-up</span>
              <span class="text-amber-300 font-medium text-xs block mt-0.5">{{ record()!.followUpDeadline || 'None Required' }}</span>
            </div>
          </div>

          <!-- Public Reviewer Notes -->
          <div *ngIf="record()!.publicReviewerNotes" class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span class="text-[10px] text-brand-400 font-bold block mb-1">Reviewer Instructions</span>
            <p class="text-slate-300 text-xs leading-relaxed">{{ record()!.publicReviewerNotes }}</p>
          </div>
        </div>

        <!-- Verification Trust Index Breakdown -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
              <h2 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Trust Confidence Score
              </h2>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono"
                [ngClass]="record()!.confidenceScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : record()!.confidenceScore >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
              >
                {{ record()!.confidenceLevel }} TRUST
              </span>
            </div>

            <!-- Balanced Gauge & Score Bar -->
            <div class="flex items-center gap-4 my-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <app-confidence-gauge [score]="record()!.confidenceScore" [showLabel]="false"></app-confidence-gauge>
              <div class="flex-1">
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span class="text-white font-bold text-sm">{{ record()!.confidenceScore }}% Confidence</span>
                  <span class="text-[10px] text-slate-400 font-mono">5 Pillars Evaluated</span>
                </div>
                <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700 ease-out"
                    [ngClass]="record()!.confidenceScore >= 80 ? 'bg-emerald-500' : record()!.confidenceScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'"
                    [style.width.%]="record()!.confidenceScore"
                  ></div>
                </div>
              </div>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed italic mt-2.5" *ngIf="confidenceBreakdown()">
              "{{ confidenceBreakdown()!.summary }}"
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span class="text-slate-400 font-medium">Deterministic Rules Engine</span>
            <span class="text-emerald-400 font-semibold font-mono">100% Auditable</span>
          </div>
        </div>

        <!-- Confidential Administrative Assessment (Admin Only) -->
        <div
          *ngIf="auth.isAdmin()"
          class="glass-panel p-5 rounded-2xl border border-purple-900/40 bg-purple-950/10 flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between pb-2 border-b border-purple-900/40 mb-3">
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 class="text-xs font-bold text-purple-300 uppercase tracking-wider">Executive Scope</h2>
              </div>
              <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">
                ADMIN RESTRICTED
              </span>
            </div>

            <div class="space-y-3 text-xs">
              <div class="p-2.5 rounded-xl bg-purple-900/20 border border-purple-800/30">
                <span class="text-purple-300/70 block text-[10px] font-medium">Compensation Grade</span>
                <span class="font-semibold text-purple-100 text-xs block mt-0.5">{{ record()!.compensationGrade || 'Unassigned' }}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-purple-900/20 border border-purple-800/30">
                <span class="text-purple-300/70 block text-[10px] font-medium">Internal Assessment Notes</span>
                <p class="text-slate-200 text-xs italic mt-0.5">{{ record()!.internalAssessmentNotes || 'None logged' }}</p>
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
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Trust Score Pillar Breakdown</span>
            <span class="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono font-bold text-xs border border-brand-500/20">
              {{ record()!.confidenceScore }}/100 Pts
            </span>
          </h2>
          <span class="text-xs text-slate-400">Deterministic Rule Weights</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div
            *ngFor="let factor of confidenceBreakdown()!.factors"
            class="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-white truncate" [title]="factor.factor">{{ factor.factor }}</span>
                <span class="text-xs font-mono font-bold" [ngClass]="getFactorColor(factor.status)">
                  {{ factor.score }}/{{ factor.weight }}
                </span>
              </div>

              <!-- Mini Pillar Progress Bar -->
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2.5">
                <div
                  class="h-full rounded-full"
                  [ngClass]="factor.status === 'OPTIMAL' ? 'bg-emerald-500' : factor.status === 'ACCEPTABLE' ? 'bg-teal-500' : factor.status === 'NEEDS_ATTENTION' ? 'bg-amber-500' : 'bg-rose-500'"
                  [style.width.%]="(factor.score / factor.weight) * 100"
                ></div>
              </div>

              <p class="text-[11px] text-slate-400 leading-relaxed">{{ factor.explanation }}</p>
            </div>

            <div class="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
              <span class="text-slate-500">Status</span>
              <span [ngClass]="getFactorColor(factor.status)" class="font-bold uppercase">{{ factor.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation: Segmented Pill Navigation -->
      <div class="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 border border-slate-800 w-fit">
        <button
          (click)="activeTab = 'evidence'"
          class="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
          [ngClass]="activeTab === 'evidence' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Evidence Vault
          <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'evidence' ? 'bg-brand-700 text-white' : 'bg-slate-800 text-slate-300'">
            {{ evidenceItems().length }}
          </span>
        </button>

        <button
          (click)="activeTab = 'timeline'"
          class="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
          [ngClass]="activeTab === 'timeline' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Verification Timeline
          <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'timeline' ? 'bg-brand-700 text-white' : 'bg-slate-800 text-slate-300'">
            {{ timelineEvents().length }}
          </span>
        </button>

        <button
          (click)="activeTab = 'clarifications'"
          class="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
          [ngClass]="activeTab === 'clarifications' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Clarifications
          <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'clarifications' ? 'bg-brand-700 text-white' : 'bg-slate-800 text-slate-300'">
            {{ clarifications().length }}
          </span>
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
            class="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div class="flex items-start justify-between gap-3 mb-2.5">
                <div class="flex items-start gap-2.5 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0 mt-0.5">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div class="truncate">
                    <span class="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-wider block">
                      {{ item.documentType.replace('_', ' ') }}
                    </span>
                    <h3 class="text-sm font-bold text-white mt-0.5 truncate">{{ item.title }}</h3>
                  </div>
                </div>
                <span
                  class="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0"
                  [ngClass]="getReviewStatusClass(item.reviewStatus)"
                >
                  {{ item.reviewStatus }}
                </span>
              </div>

              <div class="text-[11px] text-slate-400 space-y-1 mb-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                <div class="flex items-center justify-between">
                  <span>File:</span>
                  <span class="font-mono text-slate-300 truncate max-w-[200px]">{{ item.originalFilename }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Size:</span>
                  <span class="text-slate-300 font-mono">{{ formatFileSize(item.fileSize) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Submitted by:</span>
                  <span class="text-slate-300">{{ item.submittedByName }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Date:</span>
                  <span class="text-slate-300">{{ item.submittedAt | date:'mediumDate' }}</span>
                </div>
                <div *ngIf="item.reviewerComments" class="mt-2 pt-2 border-t border-slate-800 text-slate-300 italic">
                  Reviewer: "{{ item.reviewerComments }}"
                </div>
              </div>
            </div>

            <!-- Evidence Card Actions -->
            <div class="flex items-center justify-between pt-3 border-t border-slate-800/60 gap-2">
              <div class="flex items-center gap-2">
                <!-- Preview / View PDF button -->
                <button
                  (click)="previewEvidence(item)"
                  class="px-2.5 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 text-xs font-semibold border border-brand-500/30 flex items-center gap-1.5 transition-colors"
                  title="View document in secure PDF viewer"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Document
                </button>

                <!-- Download button -->
                <button
                  (click)="downloadEvidence(item)"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 flex items-center gap-1.5 transition-colors"
                  title="Download authentic binary file"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>

              <button
                *ngIf="auth.isAdmin()"
                (click)="openReviewEvidenceModal(item)"
                class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
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
                (ngModelChange)="onDecisionStatusChange($event)"
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
              <label class="block text-xs font-semibold text-slate-300 mb-1">Workforce Background Screening Status *</label>
              <select
                [(ngModel)]="decisionBgStatus"
                name="decisionBgStatus"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
              >
                <option value="PASSED">PASSED (Screening Cleared & Verified)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Screening Under Review)</option>
                <option value="FLAGGED">FLAGGED (Anomaly / Discrepancy Found)</option>
                <option value="NOT_STARTED">NOT_STARTED (Pending Initiation)</option>
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

      <!-- Secure PDF Document Viewer Modal -->
      <app-pdf-viewer-modal
        [isOpen]="showPdfModal()"
        [item]="previewItem"
        (close)="closePdfModal()"
      ></app-pdf-viewer-modal>
    </div>

    <!-- Loading State -->
    <div *ngIf="isLoading() && !record()" class="glass-panel p-16 rounded-2xl border border-slate-800 text-center max-w-md mx-auto my-12 space-y-3">
      <div class="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-xs text-slate-400 font-medium">Accessing encrypted record vault...</p>
    </div>

    <!-- Record Not Found State -->
    <div *ngIf="recordNotFound() && !isLoading()" class="glass-panel p-12 rounded-2xl border border-slate-800 text-center max-w-xl mx-auto my-12 space-y-4 shadow-2xl">
      <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-white tracking-tight">Record Vault Not Found</h2>
      <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
        The requested workforce record ID <span class="font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">{{ recordId }}</span> does not exist in the active XML repository or has been archived.
      </p>
      <div class="pt-3 flex items-center justify-center gap-3">
        <a
          routerLink="/records"
          class="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Browse Verification Directory</span>
        </a>
        <a
          routerLink="/compliance"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          Compliance Deadlines
        </a>
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
  isLoading = signal<boolean>(true);
  recordNotFound = signal<boolean>(false);
  record = signal<EmploymentRecord | null>(null);
  evidenceItems = signal<EvidenceItem[]>([]);
  timelineEvents = signal<VerificationEvent[]>([]);
  clarifications = signal<ClarificationRequest[]>([]);
  confidenceBreakdown = signal<ConfidenceBreakdown | null>(null);

  // PDF Preview State
  showPdfModal = signal<boolean>(false);
  previewItem: EvidenceItem | null = null;

  previewEvidence(item: EvidenceItem): void {
    this.previewItem = item;
    this.showPdfModal.set(true);
  }

  closePdfModal(): void {
    this.showPdfModal.set(false);
    this.previewItem = null;
  }

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
  decisionBgStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FLAGGED' = 'PASSED';
  decisionReason = '';
  decisionPublicNotes = '';
  decisionInternalNotes = '';

  onBackgroundStatusChange(event: any) {
    const newStatus = event.target.value;
    const rec = this.record();
    if (!rec) return;

    this.recordService.updateRecord(rec.id, {
      backgroundCheckStatus: newStatus,
      backgroundCheckDate: newStatus === 'PASSED' ? new Date().toISOString().substring(0, 10) : undefined
    }).subscribe({
      next: (res: any) => {
        this.toast.success(`Background screening updated to ${newStatus}`);
        this.loadAll();
      },
      error: (err: any) => {
        this.toast.error(err.error?.error || 'Failed to update background status');
      }
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.recordId = params['id'];
      this.loadAll();
    });
  }

  loadAll() {
    this.isLoading.set(true);
    this.recordNotFound.set(false);
    this.recordService.getRecordById(this.recordId).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.data) {
          this.record.set(res.data);
          try {
            this.confidenceBreakdown.set(JSON.parse(res.data.confidenceBreakdownJson));
          } catch {
            this.confidenceBreakdown.set(null);
          }
        } else {
          this.record.set(null);
          this.recordNotFound.set(true);
        }
      },
      error: err => {
        this.isLoading.set(false);
        this.record.set(null);
        this.recordNotFound.set(true);
        this.toast.error(err.error?.error || 'Record not found in the XML registry.');
      }
    });

    this.recordService.getTimeline(this.recordId).subscribe({
      next: res => {
        if (res.data) this.timelineEvents.set(res.data);
      },
      error: () => {}
    });

    this.evidenceService.getEvidenceForRecord(this.recordId).subscribe({
      next: res => {
        if (res.data) this.evidenceItems.set(res.data);
      },
      error: () => {}
    });

    this.clarService.getClarificationsForRecord(this.recordId).subscribe({
      next: res => {
        if (res.data) this.clarifications.set(res.data);
      },
      error: () => {}
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
  openDecisionModal() {
    this.decisionStatus = (this.record()?.verificationStatus as any) || 'VERIFIED';
    this.decisionBgStatus = this.record()?.backgroundCheckStatus === 'IN_PROGRESS' || !this.record()?.backgroundCheckStatus
      ? 'PASSED'
      : this.record()!.backgroundCheckStatus;
    this.decisionPublicNotes = this.record()?.publicReviewerNotes || '';
    this.decisionInternalNotes = this.record()?.internalAssessmentNotes || '';
    this.showDecisionModal.set(true);
  }
  closeDecisionModal() { this.showDecisionModal.set(false); }

  onDecisionStatusChange(newStatus: 'VERIFIED' | 'ACTION_REQUIRED' | 'REJECTED' | 'IN_REVIEW') {
    if (newStatus === 'VERIFIED') {
      this.decisionBgStatus = 'PASSED';
    } else if (newStatus === 'REJECTED') {
      this.decisionBgStatus = 'FLAGGED';
    }
  }

  toggleQuickBackgroundStatus() {
    const cur = this.record()?.backgroundCheckStatus;
    const nextStatus = cur === 'PASSED' ? 'IN_PROGRESS' : 'PASSED';
    const nextDate = nextStatus === 'PASSED' ? new Date().toISOString().substring(0, 10) : undefined;

    this.recordService.updateRecord(this.recordId, {
      backgroundCheckStatus: nextStatus,
      backgroundCheckDate: nextDate
    }).subscribe({
      next: () => {
        this.toast.success(`Background screening updated to ${nextStatus}!`);
        this.loadAll();
      },
      error: err => {
        this.toast.error(err.error?.error || 'Failed to update background screening.');
      }
    });
  }

  onDecisionSubmit() {
    if (!this.decisionReason) {
      this.toast.error('Audit justification reason is required.');
      return;
    }
    this.recordService.recordDecision(this.recordId, {
      decision: this.decisionStatus,
      backgroundCheckStatus: this.decisionBgStatus,
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
