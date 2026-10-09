import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComplianceService } from '../../core/services/compliance.service';
import { RecordService } from '../../core/services/record.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ComplianceDeadline, EmploymentRecord } from '../../shared/models';

@Component({
  selector: 'app-deadline-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Title & Action -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-white tracking-tight">Compliance Deadline Center</h1>
          <p class="text-xs text-slate-400 font-medium mt-1">
            Monitor verification renewals, inquiry resolution windows, and regulatory credential expiries
          </p>
        </div>

        <button
          *ngIf="auth.isAdmin()"
          (click)="openCreateModal()"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Schedule Milestone
        </button>
      </div>

      <!-- Filters & Toolbar -->
      <div class="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div class="flex flex-wrap items-center gap-2.5">
          <button
            (click)="setFilter('ALL')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            [ngClass]="activeFilter === 'ALL' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'"
          >
            All Milestones
          </button>
          <button
            (click)="setFilter('OVERDUE')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            [ngClass]="activeFilter === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            Overdue
          </button>
          <button
            (click)="setFilter('ACTIVE')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            [ngClass]="activeFilter === 'ACTIVE' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'"
          >
            Active & Pending
          </button>
          <button
            (click)="setFilter('COMPLETED')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            [ngClass]="activeFilter === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'"
          >
            Resolved
          </button>
        </div>

        <div class="text-xs text-slate-400 font-mono">
          Total Deadlines: <span class="font-bold text-white">{{ filteredDeadlines().length }}</span>
        </div>
      </div>

      <!-- Deadlines Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          *ngFor="let dl of filteredDeadlines()"
          class="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
          [ngClass]="{ 'border-rose-900/40 bg-rose-950/10': dl.status === 'OVERDUE' }"
        >
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-400">
                {{ dl.category.replace('_', ' ') }}
              </span>
              <span
                class="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                [ngClass]="getStatusBadgeClass(dl.status)"
              >
                {{ dl.status }}
              </span>
            </div>

            <h3 class="text-sm font-bold text-white mb-2 leading-snug">{{ dl.title }}</h3>

            <div class="space-y-1.5 text-xs text-slate-400 mb-4">
              <div class="flex items-center justify-between">
                <span>Target Due Date:</span>
                <span class="font-mono text-white font-semibold">{{ dl.dueDate | date:'mediumDate' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Priority Tier:</span>
                <span class="font-bold uppercase text-[11px]" [ngClass]="getPriorityColor(dl.priority)">
                  {{ dl.priority }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span>Assigned Reviewer:</span>
                <span class="text-slate-300">{{ dl.assignedReviewerName || 'Unassigned' }}</span>
              </div>
              <div class="flex items-center justify-between" *ngIf="getRecordName(dl.recordId)">
                <span>Target Worker:</span>
                <span class="text-slate-300 font-medium truncate max-w-[160px]">{{ getRecordName(dl.recordId) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Countdown:</span>
                <span class="font-mono font-bold text-xs" [ngClass]="getCountdownColor(dl)">
                  {{ getCountdownText(dl) }}
                </span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <a
              [routerLink]="['/records', dl.recordId]"
              class="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              Open Record Vault &rarr;
            </a>

            <button
              *ngIf="auth.isAdmin() && dl.status !== 'COMPLETED'"
              (click)="markComplete(dl.id)"
              class="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-colors"
            >
              Mark Resolved
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredDeadlines().length === 0" class="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
        No compliance deadlines in this filter category.
      </div>

      <!-- Schedule Deadline Modal (Admin) -->
      <div *ngIf="showCreateModal()" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full relative shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 class="text-sm font-bold text-white">Schedule Compliance Deadline</h2>
            <button (click)="closeCreateModal()" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <form (ngSubmit)="onCreateSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Target Employee Profile *</label>
              <select
                [(ngModel)]="newDeadline.recordId"
                (ngModelChange)="onRecordSelect($event)"
                name="recordId"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option *ngFor="let rec of availableRecords()" [value]="rec.id">
                  {{ rec.employeeName }} ({{ rec.employeeId }} — {{ rec.jobTitle }})
                </option>
              </select>
              <p class="text-[10px] text-slate-400 mt-1">Select an active workforce profile from the XML registry.</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Milestone Title *</label>
              <input
                type="text"
                [(ngModel)]="newDeadline.title"
                name="title"
                required
                placeholder="Annual Re-Verification Renewal"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                <select
                  [(ngModel)]="newDeadline.category"
                  name="category"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="VERIFICATION_RENEWAL">Verification Renewal</option>
                  <option value="CLARIFICATION_RESPONSE">Clarification Response</option>
                  <option value="EVIDENCE_EXPIRY">Evidence Expiry</option>
                  <option value="ANNUAL_AUDIT">Annual Audit</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Priority Tier *</label>
                <select
                  [(ngModel)]="newDeadline.priority"
                  name="priority"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Due Date *</label>
                <input
                  type="date"
                  [(ngModel)]="newDeadline.dueDate"
                  name="dueDate"
                  required
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Assigned Reviewer *</label>
                <select
                  [(ngModel)]="newDeadline.assignedReviewerId"
                  (ngModelChange)="onReviewerChange($event)"
                  name="assignedReviewerId"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="usr-admin-01">Eleanor Vance (Admin)</option>
                  <option value="usr-user-01">Marcus Chen (Talent Ops)</option>
                  <option value="usr-user-02">Sarah Jenkins (Verification)</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="closeCreateModal()"
                class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white"
              >
                Schedule Milestone
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class DeadlineCenterComponent implements OnInit {
  auth = inject(AuthService);
  compService = inject(ComplianceService);
  recordService = inject(RecordService);
  toast = inject(ToastService);

  deadlines = signal<ComplianceDeadline[]>([]);
  availableRecords = signal<EmploymentRecord[]>([]);
  activeFilter: 'ALL' | 'OVERDUE' | 'ACTIVE' | 'COMPLETED' = 'ALL';
  showCreateModal = signal<boolean>(false);

  newDeadline: any = {
    recordId: '',
    title: '',
    category: 'VERIFICATION_RENEWAL',
    priority: 'HIGH',
    assignedReviewerId: 'usr-admin-01',
    assignedReviewerName: 'Eleanor Vance',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10),
    reminderDaysBefore: 7
  };

  onReviewerChange(revId: string) {
    if (revId === 'usr-admin-01') this.newDeadline.assignedReviewerName = 'Eleanor Vance';
    else if (revId === 'usr-user-01') this.newDeadline.assignedReviewerName = 'Marcus Chen';
    else if (revId === 'usr-user-02') this.newDeadline.assignedReviewerName = 'Sarah Jenkins';
  }

  ngOnInit() {
    this.loadDeadlines();
    this.loadRecords();
  }

  loadRecords() {
    this.recordService.getRecords({ limit: 100 }).subscribe({
      next: res => {
        if (res.data?.items) {
          this.availableRecords.set(res.data.items);
          if (res.data.items.length > 0 && !this.newDeadline.recordId) {
            this.newDeadline.recordId = res.data.items[0].id;
          }
        }
      }
    });
  }

  getRecordName(recordId: string): string {
    const match = this.availableRecords().find(r => r.id === recordId);
    return match ? match.employeeName : '';
  }

  onRecordSelect(recId: string) {
    const rec = this.availableRecords().find(r => r.id === recId);
    if (rec && (!this.newDeadline.title || this.newDeadline.title.startsWith('Verification Renewal:'))) {
      this.newDeadline.title = `Verification Renewal: ${rec.employeeName}`;
    }
  }

  loadDeadlines() {
    this.compService.getDeadlines().subscribe({
      next: res => {
        if (res.data) this.deadlines.set(res.data);
      }
    });
  }

  filteredDeadlines() {
    const all = this.deadlines();
    if (this.activeFilter === 'ALL') return all;
    return all.filter(d => d.status === this.activeFilter);
  }

  setFilter(f: any) {
    this.activeFilter = f;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'OVERDUE':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    }
  }

  getPriorityColor(p: string): string {
    switch (p) {
      case 'CRITICAL':
        return 'text-rose-400';
      case 'HIGH':
        return 'text-amber-400';
      default:
        return 'text-sky-400';
    }
  }

  getCountdownText(dl: ComplianceDeadline): string {
    if (dl.status === 'COMPLETED') return 'Resolved';
    const diff = new Date(dl.dueDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} day(s) overdue`;
    if (days === 0) return 'Due today';
    return `${days} day(s) remaining`;
  }

  getCountdownColor(dl: ComplianceDeadline): string {
    if (dl.status === 'COMPLETED') return 'text-emerald-400';
    const diff = new Date(dl.dueDate).getTime() - Date.now();
    if (diff < 0) return 'text-rose-400';
    if (diff < 3 * 86400000) return 'text-amber-400';
    return 'text-slate-300';
  }

  markComplete(id: string) {
    this.compService.updateDeadline(id, { status: 'COMPLETED' }).subscribe({
      next: () => {
        this.toast.success('Deadline marked as resolved!');
        this.loadDeadlines();
      }
    });
  }

  openCreateModal() {
    if (this.availableRecords().length > 0) {
      if (!this.newDeadline.recordId) {
        this.newDeadline.recordId = this.availableRecords()[0].id;
      }
      const currentRec = this.availableRecords().find(r => r.id === this.newDeadline.recordId);
      if (currentRec && !this.newDeadline.title) {
        this.newDeadline.title = `Verification Renewal: ${currentRec.employeeName}`;
      }
    }
    this.showCreateModal.set(true);
  }

  closeCreateModal() { this.showCreateModal.set(false); }

  onCreateSubmit() {
    if (!this.newDeadline.title || !this.newDeadline.recordId || !this.newDeadline.dueDate) {
      this.toast.error('All fields are required.');
      return;
    }
    this.compService.createDeadline(this.newDeadline).subscribe({
      next: () => {
        this.closeCreateModal();
        this.toast.success('Compliance deadline scheduled in XML storage!');
        this.loadDeadlines();
      },
      error: err => {
        this.toast.error(err.error?.error || 'Failed to schedule deadline.');
      }
    });
  }
}
