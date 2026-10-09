import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AnalyticsOverview } from '../../shared/models';

@Component({
  selector: 'app-analytics-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 class="text-2xl font-black text-white tracking-tight">Workforce Trust Analytics</h1>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Empirical verification metrics and operational pipeline turnaround derived from XML storage
        </p>
      </div>

      <!-- Top Metric KPI Highlights -->
      <div *ngIf="overview()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-panel p-5 rounded-2xl border border-slate-800">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Success Completion Rate</span>
          <div class="text-3xl font-extrabold font-mono text-emerald-400">{{ overview()!.verificationRate }}%</div>
          <p class="text-xs text-slate-500 mt-2">Verified out of {{ overview()!.totalRecords }} records</p>
        </div>

        <div class="glass-panel p-5 rounded-2xl border border-slate-800">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Average Turnaround Time</span>
          <div class="text-3xl font-extrabold font-mono text-brand-400">{{ overview()!.averageTurnaroundDays }} Days</div>
          <p class="text-xs text-slate-500 mt-2">Submission to verified clearance</p>
        </div>

        <div class="glass-panel p-5 rounded-2xl border border-slate-800">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Open Inquiries</span>
          <div class="text-3xl font-extrabold font-mono text-amber-400">{{ overview()!.openInquiriesCount }}</div>
          <p class="text-xs text-slate-500 mt-2">Active clarification tickets</p>
        </div>

        <div class="glass-panel p-5 rounded-2xl border border-slate-800">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lapsed / Overdue</span>
          <div class="text-3xl font-extrabold font-mono text-rose-400">{{ overview()!.overdueComplianceCount }}</div>
          <p class="text-xs text-slate-500 mt-2">Compliance deadlines past due</p>
        </div>
      </div>

      <!-- Trust Distribution & Status Distribution Grid -->
      <div *ngIf="overview()" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Confidence Distribution -->
        <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 class="text-sm font-bold text-white flex items-center justify-between">
            <span>Trust Confidence Index Distribution</span>
            <span class="text-xs font-mono text-slate-400">{{ overview()!.totalRecords }} Records Evaluated</span>
          </h2>

          <div class="space-y-4">
            <div>
              <div class="flex items-center justify-between text-xs font-medium mb-1">
                <span class="text-emerald-400 font-semibold">High Confidence (80 - 100)</span>
                <span class="font-mono text-white">{{ overview()!.confidenceDistribution.high }} records</span>
              </div>
              <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  class="h-full bg-emerald-500 transition-all duration-500"
                  [style.width.%]="(overview()!.confidenceDistribution.high / overview()!.totalRecords) * 100"
                ></div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs font-medium mb-1">
                <span class="text-amber-400 font-semibold">Moderate Confidence (50 - 79)</span>
                <span class="font-mono text-white">{{ overview()!.confidenceDistribution.medium }} records</span>
              </div>
              <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  class="h-full bg-amber-500 transition-all duration-500"
                  [style.width.%]="(overview()!.confidenceDistribution.medium / overview()!.totalRecords) * 100"
                ></div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs font-medium mb-1">
                <span class="text-rose-400 font-semibold">Low Confidence (< 50)</span>
                <span class="font-mono text-white">{{ overview()!.confidenceDistribution.low }} records</span>
              </div>
              <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  class="h-full bg-rose-500 transition-all duration-500"
                  [style.width.%]="(overview()!.confidenceDistribution.low / overview()!.totalRecords) * 100"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Verification Pipeline Status Breakdown -->
        <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 class="text-sm font-bold text-white">Pipeline Status Breakdown</h2>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div
              *ngFor="let entry of getStatusEntries()"
              class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
            >
              <span class="text-slate-400 font-medium">{{ entry.key.replace('_', ' ') }}</span>
              <span class="font-bold font-mono text-white">{{ entry.val }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsViewComponent implements OnInit {
  analyticsService = inject(AnalyticsService);
  overview = signal<AnalyticsOverview | null>(null);

  ngOnInit() {
    this.analyticsService.getAnalyticsOverview().subscribe({
      next: res => {
        if (res.data) this.overview.set(res.data);
      }
    });
  }

  getStatusEntries(): { key: string; val: number }[] {
    if (!this.overview() || !this.overview()!.statusDistribution) return [];
    return Object.entries(this.overview()!.statusDistribution).map(([key, val]) => ({ key, val: val as number }));
  }
}
