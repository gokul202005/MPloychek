import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecordService } from '../../core/services/record.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { EmploymentRecord, VerificationStatus, EmploymentType } from '../../shared/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfidenceGaugeComponent } from '../../shared/components/confidence-gauge/confidence-gauge.component';

@Component({
  selector: 'app-record-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent, ConfidenceGaugeComponent],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Page Title & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-white tracking-tight">Employment Verification Directory</h1>
          <p class="text-xs text-slate-400 font-medium mt-1">
            Browse, filter, and track verified workforce credentials and compliance records
          </p>
        </div>

        <div class="flex items-center gap-2.5 self-start sm:self-auto">
          <!-- Scope Toggle (All Records vs My Submissions) for Users -->
          <div *ngIf="!auth.isAdmin()" class="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <button
              type="button"
              (click)="setScope('all')"
              [ngClass]="scope === 'all' ? 'bg-brand-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              All Workforce Records
            </button>
            <button
              type="button"
              (click)="setScope('mine')"
              [ngClass]="scope === 'mine' ? 'bg-brand-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              My Submissions
            </button>
          </div>

          <button
            (click)="openCreateModal()"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Initiate New Verification
          </button>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- Search Input -->
          <div class="lg:col-span-2 relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onFilterChange()"
              placeholder="Search by worker name, EMP ID, job title..."
              class="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <svg class="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Status Filter -->
          <div>
            <select
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onFilterChange()"
              class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="">All Verification Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="ACTION_REQUIRED">Action Required</option>
              <option value="RESUBMITTED">Resubmitted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <!-- Department Filter -->
          <div>
            <select
              [(ngModel)]="selectedDepartment"
              (ngModelChange)="onFilterChange()"
              class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Finance">Finance</option>
              <option value="Product Design">Product Design</option>
              <option value="Legal & Risk">Legal & Risk</option>
              <option value="Commercial Sales">Commercial Sales</option>
              <option value="Cloud Infrastructure">Cloud Infrastructure</option>
              <option value="AI Research">AI Research</option>
              <option value="Growth Marketing">Growth Marketing</option>
            </select>
          </div>

          <!-- Sort Filter -->
          <div>
            <select
              [(ngModel)]="sortBy"
              (ngModelChange)="onFilterChange()"
              class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="createdAt">Sort: Newest First</option>
              <option value="confidenceScore">Sort: Trust Score</option>
              <option value="employeeName">Sort: Employee Name</option>
              <option value="startDate">Sort: Start Date</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="p-12 text-center text-slate-400 font-medium text-xs">
        <div class="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3"></div>
        Querying XML records from server...
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading() && records().length === 0" class="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
        <div class="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-sm font-bold text-white mb-1">No matching employment records</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto mb-4">
          Adjust your filters or initiate a new verification to populate the workforce trust directory.
        </p>
        <button
          (click)="resetFilters()"
          class="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
        >
          Reset Filters
        </button>
      </div>

      <!-- Data Table -->
      <div *ngIf="!isLoading() && records().length > 0" class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th class="py-3.5 px-4 font-semibold">Employee</th>
                <th class="py-3.5 px-4 font-semibold">Department & Title</th>
                <th class="py-3.5 px-4 font-semibold">Type</th>
                <th class="py-3.5 px-4 font-semibold">Verification Status</th>
                <th class="py-3.5 px-4 font-semibold">Trust Index</th>
                <th class="py-3.5 px-4 font-semibold" *ngIf="auth.isAdmin()">Comp Grade</th>
                <th class="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr
                *ngFor="let rec of records()"
                [routerLink]="['/records', rec.id]"
                class="hover:bg-slate-800/40 cursor-pointer transition-colors group"
              >
                <td class="py-3.5 px-4">
                  <div class="font-bold text-white group-hover:text-brand-300 transition-colors">
                    {{ rec.employeeName }}
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">{{ rec.employeeId }}</span>
                </td>
                <td class="py-3.5 px-4">
                  <div class="text-slate-200 font-medium">{{ rec.jobTitle }}</div>
                  <span class="text-[11px] text-slate-400">{{ rec.department }}</span>
                </td>
                <td class="py-3.5 px-4">
                  <span class="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-mono text-slate-300">
                    {{ rec.employmentType.replace('_', ' ') }}
                  </span>
                </td>
                <td class="py-3.5 px-4">
                  <app-status-badge [status]="rec.verificationStatus"></app-status-badge>
                </td>
                <td class="py-3.5 px-4">
                  <app-confidence-gauge [score]="rec.confidenceScore"></app-confidence-gauge>
                </td>
                <!-- Confidential Field (Admin Only) -->
                <td class="py-3.5 px-4" *ngIf="auth.isAdmin()">
                  <span *ngIf="rec.compensationGrade" class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-semibold">
                    {{ rec.compensationGrade }}
                  </span>
                  <span *ngIf="!rec.compensationGrade" class="text-slate-600 italic text-[11px]">Unassigned</span>
                </td>
                <td class="py-3.5 px-4 text-right">
                  <a
                    [routerLink]="['/records', rec.id]"
                    class="px-3 py-1.5 rounded-lg bg-slate-800 group-hover:bg-brand-600 text-slate-200 group-hover:text-white text-xs font-semibold border border-slate-700/80 group-hover:border-brand-500 transition-colors inline-block"
                  >
                    View Vault
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
          <div>
            Showing <span class="font-bold text-white">{{ (currentPage - 1) * 10 + 1 }}</span> to
            <span class="font-bold text-white">{{ Math.min(currentPage * 10, totalRecords) }}</span> of
            <span class="font-bold text-white">{{ totalRecords }}</span> records
          </div>
          <div class="flex items-center gap-1.5">
            <button
              (click)="changePage(currentPage - 1)"
              [disabled]="currentPage === 1"
              class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              Prev
            </button>
            <span class="px-3 py-1.5 font-mono text-white font-bold bg-slate-800/80 rounded-lg">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <button
              (click)="changePage(currentPage + 1)"
              [disabled]="currentPage >= totalPages"
              class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Initiate Verification Modal -->
      <div
        *ngIf="showCreateModal()"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      >
        <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-700 max-w-lg w-full relative shadow-2xl my-8">
          <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div>
              <h2 class="text-base font-bold text-white">Initiate Employment Record</h2>
              <p class="text-xs text-slate-400">Creates an onboarding entity in XML storage</p>
            </div>
            <button (click)="closeCreateModal()" class="text-slate-400 hover:text-white text-lg">&times;</button>
          </div>

          <form (ngSubmit)="onCreateSubmit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Employee Name *</label>
                <input
                  type="text"
                  [(ngModel)]="newRecord.employeeName"
                  name="employeeName"
                  required
                  placeholder="e.g. Alex Morgan"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Employee ID *</label>
                <input
                  type="text"
                  [(ngModel)]="newRecord.employeeId"
                  name="employeeId"
                  required
                  placeholder="EMP-8490"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
                <input
                  type="text"
                  [(ngModel)]="newRecord.department"
                  name="department"
                  required
                  placeholder="Engineering"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Job Title *</label>
                <input
                  type="text"
                  [(ngModel)]="newRecord.jobTitle"
                  name="jobTitle"
                  required
                  placeholder="Software Engineer"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Employment Type *</label>
                <select
                  [(ngModel)]="newRecord.employmentType"
                  name="employmentType"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACTOR">Contractor</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Start Date *</label>
                <input
                  type="date"
                  [(ngModel)]="newRecord.startDate"
                  name="startDate"
                  required
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <!-- Confidential Fields (Only visible to Admin) -->
            <div *ngIf="auth.isAdmin()" class="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-3">
              <div class="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Restricted Confidential Data (Admin Scope)
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-slate-300 mb-1">Compensation Grade</label>
                  <input
                    type="text"
                    [(ngModel)]="newRecord.compensationGrade"
                    name="compensationGrade"
                    placeholder="e.g. L6 - Staff"
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-slate-300 mb-1">Internal Notes</label>
                  <input
                    type="text"
                    [(ngModel)]="newRecord.internalAssessmentNotes"
                    name="internalAssessmentNotes"
                    placeholder="Dual-audit priority"
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
              <button
                type="button"
                (click)="closeCreateModal()"
                class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isSaving()"
                class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {{ isSaving() ? 'Saving to XML...' : 'Create Record' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RecordListComponent implements OnInit {
  auth = inject(AuthService);
  recordService = inject(RecordService);
  toast = inject(ToastService);
  route = inject(ActivatedRoute);

  Math = Math;

  records = signal<EmploymentRecord[]>([]);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  showCreateModal = signal<boolean>(false);

  searchQuery = '';
  selectedStatus = '';
  selectedDepartment = '';
  sortBy = 'createdAt';
  scope: 'all' | 'mine' = 'all';
  currentPage = 1;
  totalRecords = 0;
  totalPages = 1;

  newRecord: any = {
    employeeName: '',
    employeeId: '',
    department: '',
    jobTitle: '',
    employmentType: 'FULL_TIME',
    startDate: new Date().toISOString().substring(0, 10),
    compensationGrade: '',
    internalAssessmentNotes: ''
  };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.selectedStatus = params['status'];
      }
      if (params['new'] === 'true') {
        this.openCreateModal();
      }
      if (params['my'] === 'true' || params['scope'] === 'mine') {
        this.scope = 'mine';
      }
      this.loadRecords();
    });
  }

  setScope(newScope: 'all' | 'mine') {
    this.scope = newScope;
    this.currentPage = 1;
    this.loadRecords();
  }

  loadRecords() {
    this.isLoading.set(true);
    this.recordService
      .getRecords({
        search: this.searchQuery,
        status: this.selectedStatus,
        department: this.selectedDepartment,
        sortBy: this.sortBy,
        sortOrder: 'desc',
        page: this.currentPage,
        limit: 10,
        onlyMine: this.scope === 'mine'
      })
      .subscribe({
        next: res => {
          if (res.data) {
            this.records.set(res.data.items);
            this.totalRecords = res.data.total;
            this.totalPages = res.data.totalPages;
            this.currentPage = res.data.page;
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadRecords();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadRecords();
    }
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedDepartment = '';
    this.currentPage = 1;
    this.loadRecords();
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  onCreateSubmit() {
    if (!this.newRecord.employeeName || !this.newRecord.employeeId || !this.newRecord.department || !this.newRecord.jobTitle) {
      this.toast.error('Please complete all mandatory fields.');
      return;
    }

    this.isSaving.set(true);
    this.recordService.createRecord(this.newRecord).subscribe({
      next: res => {
        this.isSaving.set(false);
        this.closeCreateModal();
        this.toast.success(`Verification record created for ${res.data.employeeName}!`);
        this.loadRecords();
      },
      error: err => {
        this.isSaving.set(false);
        this.toast.error(err.error?.error || 'Failed to create record.');
      }
    });
  }
}
