import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardMetrics } from '../../shared/models';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfidenceGaugeComponent } from '../../shared/components/confidence-gauge/confidence-gauge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, KpiCardComponent, StatusBadgeComponent, ConfidenceGaugeComponent],
  template: `
    <div class="space-y-8 max-w-7xl mx-auto">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h1 class="text-2xl font-black text-white tracking-tight">
              {{ auth.isAdmin() ? 'Executive Trust & Verification Overview' : 'My Verification Workspace' }}
            </h1>
            <span
              class="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold"
              [ngClass]="auth.isAdmin() ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'"
            >
              {{ auth.currentUser()?.role }}
            </span>
          </div>
          <p class="text-xs text-slate-400 font-medium">
            {{ auth.isAdmin() ? 'Enterprise Workforce Compliance Operations • Data persisted in private server-side XML' : 'Track your submitted employment verifications, pending inquiries, and compliance milestones' }}
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <a
            routerLink="/records"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Directory
          </a>
          <a
            routerLink="/records"
            [queryParams]="{ new: 'true' }"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Initiate Verification
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        <div *ngFor="let _ of [1,2,3,4]" class="h-32 bg-slate-900/60 rounded-2xl border border-slate-800"></div>
      </div>

      <!-- KPI Metrics Cards Row (Admin view) -->
      <div *ngIf="!isLoading() && metrics() && auth.isAdmin()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <app-kpi-card
          title="Total Workforce Records"
          [value]="metrics()!.totalRecords"
          subtitle="Monitored in XML Storage"
          route="/records"
          badgeText="Live Data"
          badgeClass="bg-brand-500/10 text-brand-300 border border-brand-500/20"
          iconBgClass="bg-brand-500/10 text-brand-400"
          glowClass="bg-brand-500"
        >
          <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </app-kpi-card>

        <app-kpi-card
          title="Verified Records"
          [value]="metrics()!.verifiedRecords"
          [subtitle]="metrics()!.completionRate + '% Verification Success'"
          route="/records?status=VERIFIED"
          badgeText="Dual-Audited"
          badgeClass="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
          iconBgClass="bg-emerald-500/10 text-emerald-400"
          glowClass="bg-emerald-500"
        >
          <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </app-kpi-card>

        <app-kpi-card
          title="Action Required"
          [value]="metrics()!.actionRequiredRecords"
          subtitle="Clarification Inquiry Bottlenecks"
          route="/records?status=ACTION_REQUIRED"
          badgeText="Urgent"
          badgeClass="bg-rose-500/10 text-rose-300 border border-rose-500/20"
          iconBgClass="bg-rose-500/10 text-rose-400"
          glowClass="bg-rose-500"
        >
          <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </app-kpi-card>

        <app-kpi-card
          title="Average Trust Index"
          [value]="metrics()!.averageConfidenceScore + '/100'"
          subtitle="Rules-Based Verification Confidence"
          route="/analytics"
          badgeText="Enterprise Benchmark"
          badgeClass="bg-purple-500/10 text-purple-300 border border-purple-500/20"
          iconBgClass="bg-purple-500/10 text-purple-400"
          glowClass="bg-purple-500"
        >
          <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </app-kpi-card>
      </div>

      <!-- KPI Metrics Cards Row (General User view) -->
      <div *ngIf="!isLoading() && metrics() && !auth.isAdmin()" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <app-kpi-card
          title="My Submitted Records"
          [value]="metrics()!.totalRecords"
          subtitle="Total employment verifications"
          route="/records"
          badgeText="Self Authored"
          badgeClass="bg-brand-500/10 text-brand-300"
          iconBgClass="bg-brand-500/10 text-brand-400"
        >
          <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
        </app-kpi-card>

        <app-kpi-card
          title="Verified Status"
          [value]="metrics()!.verifiedRecords"
          [subtitle]="metrics()!.completionRate + '% Verification Success'"
          route="/records?status=VERIFIED"
          badgeText="Verified"
          badgeClass="bg-emerald-500/10 text-emerald-300"
          iconBgClass="bg-emerald-500/10 text-emerald-400"
        >
          <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </app-kpi-card>

        <app-kpi-card
          title="Inquiries Awaiting You"
          [value]="metrics()!.actionRequiredRecords"
          subtitle="Clarifications requiring your response"
          route="/records?status=ACTION_REQUIRED"
          badgeText="Response Required"
          badgeClass="bg-rose-500/10 text-rose-300"
          iconBgClass="bg-rose-500/10 text-rose-400"
        >
          <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </app-kpi-card>
      </div>

      <!-- Main Operational Grid: Verification Status Breakdown & Upcoming Deadlines -->
      <div *ngIf="!isLoading() && metrics()" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Verification Pipeline Distribution (2 Cols) -->
        <div class="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                Verification Pipeline Status
                <span class="text-[11px] font-normal text-slate-400">• Real-time counts from XML</span>
              </h3>
            </div>
            <a routerLink="/records" class="text-xs font-semibold text-brand-400 hover:text-brand-300">View All</a>
          </div>

          <!-- Status Bar Visualizations -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span class="text-[11px] text-slate-400 font-medium">Pending Review</span>
              <div class="text-2xl font-mono font-bold text-amber-400 mt-1">{{ metrics()!.pendingRecords }}</div>
            </div>
            <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span class="text-[11px] text-slate-400 font-medium">Under Review</span>
              <div class="text-2xl font-mono font-bold text-sky-400 mt-1">{{ metrics()!.inReviewRecords }}</div>
            </div>
            <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span class="text-[11px] text-slate-400 font-medium">Action Required</span>
              <div class="text-2xl font-mono font-bold text-rose-400 mt-1">{{ metrics()!.actionRequiredRecords }}</div>
            </div>
            <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span class="text-[11px] text-slate-400 font-medium">Verified Cleared</span>
              <div class="text-2xl font-mono font-bold text-emerald-400 mt-1">{{ metrics()!.verifiedRecords }}</div>
            </div>
          </div>

          <!-- Recently Updated Records Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-slate-800/80 pb-2 uppercase tracking-wider text-[10px]">
                  <th class="py-2.5 font-semibold">Employee</th>
                  <th class="py-2.5 font-semibold">Department</th>
                  <th class="py-2.5 font-semibold">Status</th>
                  <th class="py-2.5 font-semibold">Confidence</th>
                  <th class="py-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/40">
                <tr *ngFor="let rec of metrics()!.recentRecords" class="hover:bg-slate-800/30 transition-colors">
                  <td class="py-3 font-semibold text-white">
                    {{ rec.employeeName }}
                    <span class="block text-[10px] text-slate-400 font-mono font-normal">{{ rec.employeeId }}</span>
                  </td>
                  <td class="py-3 text-slate-300">{{ rec.department }}</td>
                  <td class="py-3">
                    <app-status-badge [status]="rec.verificationStatus"></app-status-badge>
                  </td>
                  <td class="py-3">
                    <app-confidence-gauge [score]="rec.confidenceScore" [showLabel]="false"></app-confidence-gauge>
                  </td>
                  <td class="py-3 text-right">
                    <a
                      [routerLink]="['/records', rec.id]"
                      class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      Inspect
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Upcoming Compliance Deadlines (1 Col) -->
        <div class="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Compliance Milestones
              </h3>
              <a routerLink="/compliance" class="text-xs font-semibold text-brand-400 hover:text-brand-300">View All</a>
            </div>

            <div class="space-y-3">
              <div
                *ngFor="let dl of metrics()!.upcomingDeadlines"
                class="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div class="flex items-start justify-between gap-2">
                  <span class="text-xs font-semibold text-slate-200">{{ dl.title }}</span>
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase whitespace-nowrap"
                    [ngClass]="dl.status === 'OVERDUE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
                  >
                    {{ dl.status }}
                  </span>
                </div>
                <div class="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-mono">
                  <span>Due: {{ dl.dueDate | date:'mediumDate' }}</span>
                  <span class="text-brand-400 font-semibold">{{ dl.priority }} PRIORITY</span>
                </div>
              </div>

              <div *ngIf="metrics()!.upcomingDeadlines.length === 0" class="p-6 text-center text-xs text-slate-400">
                No outstanding compliance deadlines
              </div>
            </div>
          </div>

          <!-- Quick Tip Panel -->
          <div class="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
            <p class="font-semibold text-brand-400 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
              XML Storage Integrity
            </p>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              Every workflow step (verifications, evidence reviews, clarification requests) is atomically serialized to disk.
            </p>
          </div>
        </div>
      </div>

      <!-- Recent Audit Events (Admin Only) -->
      <div *ngIf="auth.isAdmin() && metrics() && metrics()!.recentAudits.length > 0" class="glass-panel p-6 rounded-2xl border border-slate-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <svg class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Recent Immutable Audit Trail Events
          </h3>
          <a routerLink="/audit" class="text-xs font-semibold text-brand-400 hover:text-brand-300">Open Explorer</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            *ngFor="let audit of metrics()!.recentAudits"
            class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-xs font-mono font-bold text-purple-300">{{ audit.actionType }}</span>
                <span
                  class="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold"
                  [ngClass]="audit.outcome === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'"
                >
                  {{ audit.outcome }}
                </span>
              </div>
              <p class="text-xs text-slate-300 font-medium truncate">{{ audit.actorName }} ({{ audit.actorRole }})</p>
              <p *ngIf="audit.reason" class="text-[11px] text-slate-400 mt-1 italic">{{ audit.reason }}</p>
            </div>
            <div class="mt-3 text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/60 pt-2">
              <span>{{ audit.timestamp | date:'short' }}</span>
              <span>{{ audit.requestId }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  analyticsService = inject(AnalyticsService);

  isLoading = signal<boolean>(true);
  metrics = signal<DashboardMetrics | null>(null);

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.isLoading.set(true);
    this.analyticsService.getDashboardMetrics().subscribe({
      next: res => {
        if (res.data) {
          this.metrics.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
