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
              <tr *ngFor="let ev of events()" class="hover:bg-slate-800/30 transition-colors">
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
      </div>

      <!-- Detail Modal -->
      <div *ngIf="selectedEvent" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel p-6 rounded-2xl border border-slate-700 max-w-lg w-full relative shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 class="text-sm font-bold text-white font-mono">{{ selectedEvent.actionType }}</h2>
            <button (click)="selectedEvent = null" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <div class="space-y-3 text-xs text-slate-300">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="text-slate-500 text-[10px] block">Actor</span>
                <span class="font-bold text-white">{{ selectedEvent.actorName }} ({{ selectedEvent.actorRole }})</span>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] block">Actor ID</span>
                <span class="font-mono">{{ selectedEvent.actorId }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="text-slate-500 text-[10px] block">Target Entity</span>
                <span class="font-mono text-purple-300">{{ selectedEvent.entityType }}: {{ selectedEvent.entityId }}</span>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] block">Origin IP / Agent</span>
                <span class="font-mono text-slate-400">{{ selectedEvent.ip }}</span>
              </div>
            </div>

            <div *ngIf="selectedEvent.reason" class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span class="text-[10px] text-brand-400 font-bold block mb-1">Audit Rationale / Justification</span>
              <p class="text-slate-200">{{ selectedEvent.reason }}</p>
            </div>

            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10px]">
              <span class="text-slate-500 block mb-1">Request ID: {{ selectedEvent.requestId }}</span>
              <span class="text-slate-500 block">Timestamp: {{ selectedEvent.timestamp }}</span>
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

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.auditService.getAuditEvents({
      search: this.searchQuery,
      actionType: this.selectedAction,
      outcome: this.selectedOutcome,
      limit: 50
    }).subscribe({
      next: res => {
        if (res.data) this.events.set(res.data.items);
      }
    });
  }

  onFilterChange() {
    this.loadEvents();
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
