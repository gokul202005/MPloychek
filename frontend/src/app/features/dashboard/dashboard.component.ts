import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardMetrics, EmploymentRecord } from '../../shared/models';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfidenceGaugeComponent } from '../../shared/components/confidence-gauge/confidence-gauge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, KpiCardComponent, StatusBadgeComponent, ConfidenceGaugeComponent],
  template: `
    <div class="space-y-8 max-w-7xl mx-auto relative">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1 flex-wrap">
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

        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Interactive Operator Profile Chip with Hover Option -->
          <div
            class="relative px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 flex items-center gap-2.5 cursor-pointer transition-all shadow-sm group"
            (mouseenter)="onOperatorMouseEnter($event)"
            (mouseleave)="onOperatorMouseLeave()"
          >
            <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md border border-brand-400/30 group-hover:scale-105 transition-transform">
              {{ (auth.currentUser()?.name || 'U')[0] }}
            </div>
            <div class="text-left pr-1">
              <span class="text-xs font-semibold text-white group-hover:text-brand-300 transition-colors block leading-tight">
                {{ auth.currentUser()?.name }}
              </span>
              <span class="text-[10px] text-slate-400 font-mono">
                {{ auth.currentUser()?.department || 'Operations' }}
              </span>
            </div>
            <span class="text-[9px] text-brand-400 font-semibold px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Profile
            </span>
          </div>

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
          badgeText="Benchmark"
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

          <!-- Recently Updated Records Table with Profile Hover Card Option -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-slate-800/80 pb-2 uppercase tracking-wider text-[10px]">
                  <th class="py-2.5 font-semibold">Employee Profile (Hover Details)</th>
                  <th class="py-2.5 font-semibold">Department</th>
                  <th class="py-2.5 font-semibold">Status</th>
                  <th class="py-2.5 font-semibold">Confidence</th>
                  <th class="py-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/40">
                <tr *ngFor="let rec of metrics()!.recentRecords" class="hover:bg-slate-800/30 transition-colors">
                  <td class="py-3">
                    <!-- Interactive Profile Hover Trigger -->
                    <div
                      class="flex items-center gap-2.5 cursor-pointer group py-0.5"
                      (mouseenter)="onCandidateMouseEnter(rec, $event)"
                      (mouseleave)="onCandidateMouseLeave()"
                    >
                      <div class="relative flex-shrink-0">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md border border-brand-400/30 group-hover:scale-110 group-hover:ring-2 group-hover:ring-brand-400/60 transition-all">
                          {{ getInitials(rec.employeeName) }}
                        </div>
                        <span
                          class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900"
                          [ngClass]="{
                            'bg-emerald-400': rec.verificationStatus === 'VERIFIED',
                            'bg-amber-400': rec.verificationStatus === 'IN_REVIEW' || rec.verificationStatus === 'PENDING' || rec.verificationStatus === 'RESUBMITTED',
                            'bg-rose-400': rec.verificationStatus === 'ACTION_REQUIRED' || rec.verificationStatus === 'REJECTED'
                          }"
                        ></span>
                      </div>
                      <div class="min-w-0">
                        <span class="font-semibold text-white group-hover:text-brand-300 transition-colors flex items-center gap-1.5">
                          {{ rec.employeeName }}
                          <span class="text-[9px] px-1.5 py-0.2 rounded-md bg-brand-500/10 text-brand-400 font-mono border border-brand-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            View Profile
                          </span>
                        </span>
                        <div class="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span class="text-slate-300 font-medium">{{ rec.employeeId }}</span>
                          <span>•</span>
                          <span class="text-slate-500 group-hover:text-slate-400 truncate max-w-[130px]">{{ rec.jobTitle || 'Profile' }}</span>
                        </div>
                      </div>
                    </div>
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
            <svg class="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Immutable Audit Trail Activity
          </h3>
          <a routerLink="/audit" class="text-xs font-semibold text-brand-400 hover:text-brand-300">Audit Explorer</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            *ngFor="let audit of metrics()!.recentAudits.slice(0, 3)"
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

      <!-- ========================================================== -->
      <!-- FLOATING CANDIDATE PROFILE HOVER CARD (Interactive Popover) -->
      <!-- ========================================================== -->
      <div
        *ngIf="hoveredRecord() && hoverPosition()"
        (mouseenter)="onCardMouseEnter()"
        (mouseleave)="onCardMouseLeave()"
        class="fixed z-50 w-80 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl shadow-black/90 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
        [style.top.px]="hoverPosition()!.top"
        [style.left.px]="hoverPosition()!.left"
      >
        <!-- Card Header -->
        <div class="flex items-start gap-3 pb-3 border-b border-slate-800/80">
          <div class="relative flex-shrink-0">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-base shadow-lg border border-white/20">
              {{ getInitials(hoveredRecord()!.employeeName) }}
            </div>
            <span
              class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white"
              [ngClass]="{
                'bg-emerald-500': hoveredRecord()!.verificationStatus === 'VERIFIED',
                'bg-amber-500': hoveredRecord()!.verificationStatus === 'IN_REVIEW' || hoveredRecord()!.verificationStatus === 'PENDING' || hoveredRecord()!.verificationStatus === 'RESUBMITTED',
                'bg-rose-500': hoveredRecord()!.verificationStatus === 'ACTION_REQUIRED' || hoveredRecord()!.verificationStatus === 'REJECTED'
              }"
            >
              <span *ngIf="hoveredRecord()!.verificationStatus === 'VERIFIED'">✓</span>
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <h4 class="text-sm font-bold text-white truncate">{{ hoveredRecord()!.employeeName }}</h4>
              <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {{ hoveredRecord()!.employeeId }}
              </span>
            </div>
            <p class="text-[11px] text-slate-300 font-medium truncate mt-0.5">{{ hoveredRecord()!.jobTitle || 'Unassigned Role' }}</p>
            <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80 font-medium">
                {{ hoveredRecord()!.department }}
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                {{ hoveredRecord()!.employmentType || 'FULL_TIME' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Trust Confidence Breakdown -->
        <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-[11px] text-slate-400 font-medium">Trust Confidence Index</span>
            <span class="font-mono font-bold text-white">{{ hoveredRecord()!.confidenceScore }}/100</span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              [ngClass]="{
                'bg-gradient-to-r from-emerald-500 to-teal-400': hoveredRecord()!.confidenceScore >= 80,
                'bg-gradient-to-r from-amber-500 to-orange-400': hoveredRecord()!.confidenceScore >= 50 && hoveredRecord()!.confidenceScore < 80,
                'bg-gradient-to-r from-rose-500 to-red-400': hoveredRecord()!.confidenceScore < 50
              }"
              [style.width.%]="hoveredRecord()!.confidenceScore"
            ></div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <span
              class="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              [ngClass]="getTrustTier(hoveredRecord()!.confidenceScore).bgClass + ' ' + getTrustTier(hoveredRecord()!.confidenceScore).colorClass"
            >
              {{ getTrustTier(hoveredRecord()!.confidenceScore).label }}
            </span>
            <app-status-badge [status]="hoveredRecord()!.verificationStatus"></app-status-badge>
          </div>
        </div>

        <!-- Detailed Profile Metrics Grid -->
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <span class="text-[10px] text-slate-400 block mb-0.5">Background Check</span>
            <span
              class="font-semibold font-mono text-[10px] flex items-center gap-1"
              [ngClass]="{
                'text-emerald-400': hoveredRecord()!.backgroundCheckStatus === 'PASSED',
                'text-amber-400': hoveredRecord()!.backgroundCheckStatus === 'IN_PROGRESS' || hoveredRecord()!.backgroundCheckStatus === 'NOT_STARTED',
                'text-rose-400': hoveredRecord()!.backgroundCheckStatus === 'FLAGGED'
              }"
            >
              <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                'bg-emerald-400': hoveredRecord()!.backgroundCheckStatus === 'PASSED',
                'bg-amber-400': hoveredRecord()!.backgroundCheckStatus === 'IN_PROGRESS' || hoveredRecord()!.backgroundCheckStatus === 'NOT_STARTED',
                'bg-rose-400': hoveredRecord()!.backgroundCheckStatus === 'FLAGGED'
              }"></span>
              {{ hoveredRecord()!.backgroundCheckStatus }}
            </span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <span class="text-[10px] text-slate-400 block mb-0.5">Tenure Start Date</span>
            <span class="font-medium text-slate-200">
              {{ hoveredRecord()!.startDate ? (hoveredRecord()!.startDate | date:'mediumDate') : 'Pending' }}
            </span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800" *ngIf="auth.isAdmin()">
            <span class="text-[10px] text-slate-400 block mb-0.5">Comp Grade</span>
            <span class="font-mono font-semibold text-purple-300 text-[10px]">
              {{ hoveredRecord()!.compensationGrade || 'Standard' }}
            </span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <span class="text-[10px] text-slate-400 block mb-0.5">Dossier ID</span>
            <span class="font-mono text-slate-400 text-[10px] truncate block">
              {{ hoveredRecord()!.id }}
            </span>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <a
            [routerLink]="['/records', hoveredRecord()!.id]"
            class="flex-1 text-center py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-brand-500/20"
          >
            Inspect Full Dossier
          </a>
          <a
            [routerLink]="['/records', hoveredRecord()!.id]"
            [queryParams]="{ tab: 'evidence' }"
            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
            title="Evidence Vault"
          >
            Evidence
          </a>
        </div>
      </div>

      <!-- ========================================================== -->
      <!-- FLOATING OPERATOR PROFILE HOVER CARD (Interactive Popover) -->
      <!-- ========================================================== -->
      <div
        *ngIf="showOperatorProfile() && operatorHoverPosition()"
        (mouseenter)="onOperatorCardMouseEnter()"
        (mouseleave)="onOperatorCardMouseLeave()"
        class="fixed z-50 w-80 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl shadow-black/90 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
        [style.top.px]="operatorHoverPosition()!.top"
        [style.left.px]="operatorHoverPosition()!.left"
      >
        <!-- Operator Card Header -->
        <div class="flex items-start gap-3 pb-3 border-b border-slate-800/80">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-amber-500 flex items-center justify-center font-bold text-white text-base shadow-lg border border-white/20">
            {{ (auth.currentUser()?.name || 'U')[0] }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <h4 class="text-sm font-bold text-white truncate">{{ auth.currentUser()?.name }}</h4>
              <span
                class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase"
                [ngClass]="auth.isAdmin() ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'"
              >
                {{ auth.currentUser()?.role }}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 font-mono truncate mt-0.5">{{ auth.currentUser()?.email }}</p>
            <div class="flex items-center gap-1.5 mt-1.5">
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                {{ auth.currentUser()?.department || 'Operations' }}
              </span>
              <span class="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Active Session
              </span>
            </div>
          </div>
        </div>

        <!-- Clearance & Organization -->
        <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-slate-400">Organization</span>
            <span class="font-semibold text-slate-200">Acme Global Security</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-slate-400">Security Clearance</span>
            <span class="font-mono text-[10px] text-amber-400 font-bold">SOC-2 TYPE II VERIFIER</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-slate-400">Persistence Engine</span>
            <span class="font-mono text-[10px] text-brand-300 font-bold">100% PURE XML VAULT</span>
          </div>
        </div>

        <!-- Permissions Capabilities -->
        <div class="space-y-1.5 text-[11px]">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Permissions</span>
          <div class="space-y-1 text-slate-300">
            <div class="flex items-center gap-2" *ngIf="auth.isAdmin()">
              <span class="text-emerald-400">✓</span> Full Verification & Decision Authority
            </div>
            <div class="flex items-center gap-2" *ngIf="auth.isAdmin()">
              <span class="text-emerald-400">✓</span> Immutable Audit History Ledger Access
            </div>
            <div class="flex items-center gap-2" *ngIf="auth.isAdmin()">
              <span class="text-emerald-400">✓</span> System Telemetry & Chaos Simulator
            </div>
            <div class="flex items-center gap-2" *ngIf="!auth.isAdmin()">
              <span class="text-emerald-400">✓</span> Candidate Self-Service & Clarification Response
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="pt-2 border-t border-slate-800/80 flex items-center gap-2" *ngIf="auth.isAdmin()">
          <a
            routerLink="/users"
            class="flex-1 text-center py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
          >
            User Management
          </a>
          <button
            (click)="auth.logout()"
            class="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium text-xs border border-rose-500/30 transition-colors"
          >
            Sign Out
          </button>
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

  // Candidate Profile Hover State
  hoveredRecord = signal<EmploymentRecord | null>(null);
  hoverPosition = signal<{ top: number; left: number } | null>(null);
  private isHoveringCard = false;
  private hoverTimeout: any = null;

  // Operator Profile Hover State
  showOperatorProfile = signal<boolean>(false);
  operatorHoverPosition = signal<{ top: number; left: number } | null>(null);
  private isHoveringOperatorCard = false;
  private operatorHoverTimeout: any = null;

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

  // Candidate Profile Hover Handlers
  onCandidateMouseEnter(rec: EmploymentRecord, event: MouseEvent) {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    const cardWidth = 320;
    const cardHeight = 380;
    let left = rect.right + 14;
    let top = rect.top - 20;

    // Boundary checking
    if (left + cardWidth > window.innerWidth - 16) {
      left = rect.left - cardWidth - 14;
    }
    if (top + cardHeight > window.innerHeight - 16) {
      top = window.innerHeight - cardHeight - 16;
    }
    if (top < 16) top = 16;

    this.hoverPosition.set({ top, left });
    this.hoveredRecord.set(rec);
  }

  onCandidateMouseLeave() {
    this.hoverTimeout = setTimeout(() => {
      if (!this.isHoveringCard) {
        this.hoveredRecord.set(null);
      }
    }, 180);
  }

  onCardMouseEnter() {
    this.isHoveringCard = true;
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
  }

  onCardMouseLeave() {
    this.isHoveringCard = false;
    this.hoveredRecord.set(null);
  }

  // Operator Profile Hover Handlers
  onOperatorMouseEnter(event: MouseEvent) {
    if (this.operatorHoverTimeout) clearTimeout(this.operatorHoverTimeout);
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    const cardWidth = 320;
    let top = rect.bottom + 10;
    let left = rect.left;

    if (left + cardWidth > window.innerWidth - 16) {
      left = window.innerWidth - cardWidth - 16;
    }

    this.operatorHoverPosition.set({ top, left });
    this.showOperatorProfile.set(true);
  }

  onOperatorMouseLeave() {
    this.operatorHoverTimeout = setTimeout(() => {
      if (!this.isHoveringOperatorCard) {
        this.showOperatorProfile.set(false);
      }
    }, 180);
  }

  onOperatorCardMouseEnter() {
    this.isHoveringOperatorCard = true;
    if (this.operatorHoverTimeout) clearTimeout(this.operatorHoverTimeout);
  }

  onOperatorCardMouseLeave() {
    this.isHoveringOperatorCard = false;
    this.showOperatorProfile.set(false);
  }

  // Helper Methods
  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getTrustTier(score: number): { label: string; colorClass: string; bgClass: string } {
    if (score >= 80) {
      return {
        label: 'High Trust • Verified',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/15 border-emerald-500/30'
      };
    }
    if (score >= 50) {
      return {
        label: 'Moderate • In Review',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/15 border-amber-500/30'
      };
    }
    return {
      label: 'High Risk • Action Needed',
      colorClass: 'text-rose-400',
      bgClass: 'bg-rose-500/15 border-rose-500/30'
    };
  }
}
