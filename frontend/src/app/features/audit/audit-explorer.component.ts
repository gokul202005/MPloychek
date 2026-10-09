import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../core/services/audit.service';
import { AuditEvent } from '../../shared/models';

@Component({
  selector: 'app-audit-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="w-2 h-2 rounded-full bg-purple-400"></span>
          <span class="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">Immutable Security Log</span>
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">Explainable Audit Explorer</h1>
        <p class="text-xs text-slate-400 font-medium">
          Comprehensive, tamper-resistant trail of every authentication, status transition, decision, and evidence review
        </p>
      </div>

      <!-- Filters & Query Bar -->
      <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div class="sm:col-span-2 relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onFilterChange()"
              placeholder="Search by actor name, action type, entity ID, or reason..."
              class="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <svg class="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div>
            <select
              [(ngModel)]="selectedAction"
              (ngModelChange)="onFilterChange()"
              class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="">All Action Types</option>
              <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
              <option value="AUTH_LOGIN_FAILED">AUTH_LOGIN_FAILED</option>
              <option value="RECORD_CREATE">RECORD_CREATE</option>
              <option value="RECORD_UPDATE">RECORD_UPDATE</option>
              <option value="VERIFICATION_DECISION">VERIFICATION_DECISION</option>
              <option value="EVIDENCE_UPLOAD">EVIDENCE_UPLOAD</option>
              <option value="EVIDENCE_REVIEW">EVIDENCE_REVIEW</option>
              <option value="CLARIFICATION_REQUEST">CLARIFICATION_REQUEST</option>
              <option value="CLARIFICATION_RESPONSE">CLARIFICATION_RESPONSE</option>
              <option value="ADMIN_USER_CREATE">ADMIN_USER_CREATE</option>
            </select>
          </div>

          <div>
            <select
              [(ngModel)]="selectedOutcome"
              (ngModelChange)="onFilterChange()"
              class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
              <option value="DENIED">DENIED</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Events Table -->
      <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th class="py-3 px-4 font-semibold">Timestamp</th>
                <th class="py-3 px-4 font-semibold">Action</th>
                <th class="py-3 px-4 font-semibold">Actor</th>
                <th class="py-3 px-4 font-semibold">Entity</th>
                <th class="py-3 px-4 font-semibold">Outcome</th>
                <th class="py-3 px-4 font-semibold">Request ID</th>
                <th class="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
              <tr *ngFor="let ev of paginatedEvents()" class="hover:bg-slate-800/30 transition-colors">
                <td class="py-3 px-4 text-slate-400 whitespace-nowrap">
                  {{ ev.timestamp | date:'short' }}
                </td>
                <td class="py-3 px-4 font-bold text-purple-300">
                  {{ ev.actionType }}
                </td>
                <td class="py-3 px-4 text-slate-200 font-sans">
                  <span class="font-bold">{{ ev.actorName }}</span>
                  <span class="text-[10px] text-slate-400 block font-mono">({{ ev.actorRole }})</span>
                </td>
                <td class="py-3 px-4 text-slate-300">
                  {{ ev.entityType }}: <span class="text-white">{{ ev.entityId }}</span>
                </td>
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-0.5 rounded font-bold uppercase text-[10px]"
                    [ngClass]="getOutcomeClass(ev.outcome)"
                  >
                    {{ ev.outcome }}
                  </span>
                </td>
                <td class="py-3 px-4 text-slate-500">
                  {{ ev.requestId }}
                </td>
                <td class="py-3 px-4 text-right font-sans">
                  <button
                    (click)="selectedEvent = ev"
                    class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Explain
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="px-6 py-3.5 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div class="text-slate-400 font-mono text-[11px]">
            Showing <span class="text-white font-semibold">{{ startIndex() + 1 }}</span> to
            <span class="text-white font-semibold">{{ endIndex() }}</span> of
            <span class="text-white font-semibold">{{ events().length }}</span> audit events
          </div>

          <div class="flex items-center gap-1.5" *ngIf="totalPages() > 1">
            <button
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() === 1"
              class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-medium transition-colors"
            >
              Prev
            </button>

            <button
              *ngFor="let p of pageNumbers()"
              (click)="goToPage(p)"
              class="w-7 h-7 rounded-lg text-xs font-semibold font-mono transition-colors flex items-center justify-center"
              [ngClass]="currentPage() === p ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white'"
            >
              {{ p }}
            </button>

            <button
              (click)="goToPage(currentPage() + 1)"
              [disabled]="currentPage() === totalPages()"
              class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Modal: Explainable AI & Audit Rationale -->
      <div *ngIf="selectedEvent" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel p-6 rounded-2xl border border-slate-700 max-w-xl w-full relative shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
              <h2 class="text-sm font-bold text-white font-mono">{{ selectedEvent.actionType }}</h2>
            </div>
            <button (click)="selectedEvent = null" class="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
          </div>

          <div class="space-y-3 text-xs text-slate-300">
            <!-- Plain-English Explainability Box -->
            <div class="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
              <div class="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                <svg class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Explainability & Regulatory Analysis
              </div>
              <p class="text-slate-200 leading-relaxed">
                {{ getExplainSummary(selectedEvent) }}
              </p>
            </div>

            <!-- Contextual Metadata -->
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-slate-500 text-[10px] block">Actor Identity</span>
                <span class="font-bold text-white">{{ selectedEvent.actorName }}</span>
                <span class="text-purple-400 block font-mono text-[10px]">Role: {{ selectedEvent.actorRole }} ({{ selectedEvent.actorId }})</span>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-slate-500 text-[10px] block">Target Resource</span>
                <span class="font-mono text-purple-300 font-bold">{{ selectedEvent.entityType }}</span>
                <span class="text-slate-400 block font-mono text-[10px]">{{ selectedEvent.entityId }}</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
              <span class="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Zero-Trust Verification</span>
              <p class="text-slate-300">{{ getExplainSecurity(selectedEvent) }}</p>
            </div>

            <div *ngIf="selectedEvent.reason" class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-brand-400 font-bold block mb-1">Audit Rationale / Justification</span>
              <p class="text-slate-200">{{ selectedEvent.reason }}</p>
            </div>

            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] flex items-center justify-between text-slate-500">
              <span>Req: {{ selectedEvent.requestId }}</span>
              <span>IP: {{ selectedEvent.ip }}</span>
              <span>{{ selectedEvent.timestamp | date:'medium' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuditExplorerComponent implements OnInit {
  auditService = inject(AuditService);

  events = signal<AuditEvent[]>([]);
  selectedEvent: AuditEvent | null = null;
  searchQuery = '';
  selectedAction = '';
  selectedOutcome = '';

  // Pagination state
  currentPage = signal<number>(1);
  pageSize = 10;

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.auditService.getAuditEvents({
      search: this.searchQuery,
      actionType: this.selectedAction,
      outcome: this.selectedOutcome,
      limit: 100
    }).subscribe({
      next: res => {
        if (res.data) {
          this.events.set(res.data.items);
          this.currentPage.set(1);
        }
      }
    });
  }

  onFilterChange() {
    this.loadEvents();
  }

  paginatedEvents(): AuditEvent[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.events().slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.events().length / this.pageSize) || 1;
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(total, 6); i++) pages.push(i);
    return pages;
  }

  startIndex(): number {
    return (this.currentPage() - 1) * this.pageSize;
  }

  endIndex(): number {
    return Math.min(this.startIndex() + this.pageSize, this.events().length);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  getExplainSummary(ev: AuditEvent): string {
    switch (ev.actionType) {
      case 'AUTH_LOGIN_SUCCESS':
        return `User ${ev.actorName} successfully authenticated into MPloyChek with role '${ev.actorRole}'. Credentials verified via bcrypt password hash and secure JWT session token minted for organization ${ev.organizationId}.`;
      case 'AUTH_LOGIN_FAILED':
        return `Failed authentication attempt detected for identity ${ev.entityId}. Access was denied in accordance with zero-trust credentials policy. No session established.`;
      case 'RECORD_CREATE':
        return `Workforce verification record '${ev.entityId}' was authored by ${ev.actorName}. Core attributes completeness was evaluated, generating a baseline deterministic confidence score in XML storage.`;
      case 'RECORD_UPDATE':
        return `Employment record '${ev.entityId}' was modified by ${ev.actorName}. Trust score was recomputed deterministically across all 5 verification integrity pillars.`;
      case 'VERIFICATION_DECISION':
        return `Formal verification decision was rendered by Compliance Officer ${ev.actorName} on record '${ev.entityId}'. Record status committed with immutable audit seal.`;
      case 'EVIDENCE_UPLOAD':
        return `Evidence document was deposited into the cryptographic Evidence Vault by ${ev.actorName}. Document metadata serialized into XML storage and binary asset saved with SHA-256 integrity tag.`;
      case 'EVIDENCE_REVIEW':
        return `Credential document under '${ev.entityId}' was reviewed by ${ev.actorName}. Verification status updated and factored into record confidence rating.`;
      case 'CLARIFICATION_REQUEST':
        return `Clarification inquiry ticket '${ev.entityId}' was issued by ${ev.actorName}. Worker/submitter notified to address attestation discrepancy.`;
      case 'CLARIFICATION_RESPONSE':
        return `Submitter ${ev.actorName} provided written clarification to resolve outstanding query on '${ev.entityId}'. Status queued for reviewer confirmation.`;
      case 'COMPLIANCE_DEADLINE_CREATE':
        return `Regulatory compliance milestone scheduled for target resource '${ev.entityId}' with assigned reviewer window.`;
      default:
        return `Security event '${ev.actionType}' performed by ${ev.actorName} (${ev.actorRole}) on entity '${ev.entityType}:${ev.entityId}'. State transition persisted to immutable XML log.`;
    }
  }

  getExplainSecurity(ev: AuditEvent): string {
    return `Transaction verified with SHA-256 fingerprint. Executed from client origin ${ev.ip} via request trace ${ev.requestId}. Zero-trust authorization cleared for role ${ev.actorRole}.`;
  }

  getOutcomeClass(outcome: string): string {
    switch (outcome) {
      case 'SUCCESS':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'DENIED':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
    }
  }
}
