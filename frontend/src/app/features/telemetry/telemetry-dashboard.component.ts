import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TelemetryService } from '../../core/services/telemetry.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { TelemetrySummary, TelemetryRecord } from '../../shared/models';

@Component({
  selector: 'app-telemetry-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Title & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span class="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">Live System Observability</span>
          </div>
          <h1 class="text-2xl font-black text-white tracking-tight">Telemetry & Storage Health</h1>
          <p class="text-xs text-slate-400 font-medium">Real-time HTTP performance, Node.js runtime stats, and XML file persistence integrity</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="testPing()"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <svg class="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Send Ping
          </button>
          <button
            (click)="loadTelemetry()"
            class="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Metrics
          </button>
        </div>
      </div>

      <!-- Telemetry Overview Cards -->
      <div *ngIf="summary()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-panel p-5 rounded-2xl border border-slate-800">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total API Invocations</span>
          <div class="text-3xl font-extrabold font-mono text-white">{{ summary()!.totalRequests }}</div>
          <span class="text-xs text-slate-500 mt-2 block">{{ summary()!.inFlightRequests }} currently active in-flight</span>
        </div>

        <div class="glass-panel p-5 rounded-2xl border border-slate-800">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Average Latency</span>
          <div class="text-3xl font-extrabold font-mono text-brand-400">{{ summary()!.averageResponseTimeMs }} ms</div>
          <span class="text-xs text-slate-500 mt-2 block font-mono">Simulated delay: +{{ summary()!.simulatedDelayMs }} ms</span>
        </div>

        <div class="glass-panel p-5 rounded-2xl border border-slate-800">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Success / Error Distribution</span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold font-mono text-emerald-400">{{ summary()!.totalSuccess }}</span>
            <span class="text-xs text-slate-500 font-mono">/</span>
            <span class="text-xl font-bold font-mono text-rose-400">{{ summary()!.totalClientErrors + summary()!.totalServerErrors }} err</span>
          </div>
          <span class="text-[11px] text-slate-500 mt-2 block">Client 4xx: {{ summary()!.totalClientErrors }} | Server 5xx: {{ summary()!.totalServerErrors }}</span>
        </div>

        <div class="glass-panel p-5 rounded-2xl border border-slate-800">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Node.js Runtime</span>
          <div class="text-xl font-extrabold font-mono text-purple-300 mt-1">{{ summary()!.runtime.nodeVersion }}</div>
          <span class="text-xs text-slate-500 mt-2 block font-mono">
            Uptime: {{ summary()!.runtime.uptimeSeconds }}s | Heap: {{ summary()!.runtime.memoryUsage.heapUsedMb }} MB
          </span>
        </div>
      </div>

      <!-- Real XML File-Storage Health Check Panel (Section 12) -->
      <div *ngIf="summary()" class="glass-panel p-6 rounded-2xl border border-slate-800">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 class="text-sm font-bold text-white uppercase tracking-wider">XML Storage Engine Diagnostics</h2>
          </div>
          <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {{ summary()!.xmlStorageHealth.status }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span class="text-slate-500 text-[10px] block mb-1">STORAGE ENGINE TYPE</span>
            <span class="font-bold text-white">Pure XML Document</span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span class="text-slate-500 text-[10px] block mb-1">FILE READ BENCHMARK</span>
            <span class="font-bold text-emerald-400">{{ summary()!.xmlStorageHealth.readDurationMs }} ms</span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span class="text-slate-500 text-[10px] block mb-1">FAST-XML PARSER VALIDATION</span>
            <span class="font-bold text-sky-400">{{ summary()!.xmlStorageHealth.parseDurationMs }} ms</span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span class="text-slate-500 text-[10px] block mb-1">SERIALIZED FILE SIZE</span>
            <span class="font-bold text-white">{{ (summary()!.xmlStorageHealth.fileSizeBytes / 1024).toFixed(1) }} KB</span>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
          <span>Active Path: <strong class="text-slate-200">{{ getSanitizedPath(summary()!.xmlStorageHealth.filePath) }}</strong></span>
          <span>Last Verified: {{ summary()!.xmlStorageHealth.lastChecked | date:'mediumTime' }}</span>
        </div>
      </div>

      <!-- Recent Requests Activity Stream -->
      <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div class="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2.5">
            <h2 class="text-xs font-bold text-white uppercase tracking-wider">Observed Inbound HTTP Requests</h2>
            <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold border border-slate-700/60">
              {{ recentRequests().length }} captured
            </span>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-[10px] font-mono text-slate-400 hidden sm:inline">Captured via TelemetryMiddleware</span>

            <button
              (click)="clearRequests()"
              [disabled]="recentRequests().length === 0 || isClearing()"
              class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Clear observed HTTP request log"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>{{ isClearing() ? 'Clearing...' : 'Clear Log' }}</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead>
              <tr class="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th class="py-2.5 px-4 font-semibold">Method</th>
                <th class="py-2.5 px-4 font-semibold">Endpoint Path</th>
                <th class="py-2.5 px-4 font-semibold">Status</th>
                <th class="py-2.5 px-4 font-semibold">Latency</th>
                <th class="py-2.5 px-4 font-semibold">Request ID</th>
                <th class="py-2.5 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/40 text-[11px]">
              <tr *ngIf="recentRequests().length === 0">
                <td colspan="6" class="py-12 text-center text-slate-400 font-sans">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <div class="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span class="text-xs text-slate-400 font-medium">No HTTP requests in current telemetry stream</span>
                    <span class="text-[11px] text-slate-500">All observed requests have been cleared. New requests will appear automatically.</span>
                  </div>
                </td>
              </tr>
              <tr *ngFor="let req of paginatedRequests()" class="hover:bg-slate-800/30">
                <td class="py-2.5 px-4 font-bold" [ngClass]="getMethodColor(req.method)">
                  {{ req.method }}
                </td>
                <td class="py-2.5 px-4 text-slate-300">{{ req.path }}</td>
                <td class="py-2.5 px-4 font-bold" [ngClass]="getStatusColor(req.status)">
                  {{ req.status }}
                </td>
                <td class="py-2.5 px-4 font-semibold text-white">
                  {{ req.durationMs }} ms
                </td>
                <td class="py-2.5 px-4 text-slate-500">{{ req.requestId }}</td>
                <td class="py-2.5 px-4 text-right text-slate-400">{{ req.timestamp | date:'mediumTime' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="px-6 py-3 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" *ngIf="recentRequests().length > 0">
          <div class="text-slate-400 font-mono text-[11px]">
            Page <span class="text-white font-semibold">{{ currentPage() }}</span> of
            <span class="text-white font-semibold">{{ totalPages() }}</span> •
            Showing <span class="text-white font-semibold">{{ startIndex() + 1 }}</span> to
            <span class="text-white font-semibold">{{ endIndex() }}</span> of
            <span class="text-white font-semibold">{{ recentRequests().length }}</span> requests
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
              [ngClass]="currentPage() === p ? 'bg-brand-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white'"
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
    </div>
  `
})
export class TelemetryDashboardComponent implements OnInit, OnDestroy {
  telemetryService = inject(TelemetryService);
  toast = inject(ToastService);

  summary = signal<TelemetrySummary | null>(null);
  recentRequests = signal<TelemetryRecord[]>([]);
  isClearing = signal<boolean>(false);

  // Pagination
  currentPage = signal<number>(1);
  pageSize = 10;
  private pollInterval?: any;

  ngOnInit() {
    this.loadTelemetry();
    // Auto-refresh telemetry stream every 3 seconds for live observability
    this.pollInterval = setInterval(() => {
      this.refreshQuietly();
    }, 3000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  loadTelemetry() {
    this.telemetryService.getSummary().subscribe({
      next: res => {
        if (res.data) this.summary.set(res.data);
      }
    });

    this.telemetryService.getRequests(50).subscribe({
      next: res => {
        if (res.data) {
          this.recentRequests.set(res.data);
        }
      }
    });
  }

  refreshQuietly() {
    this.telemetryService.getSummary().subscribe({
      next: res => {
        if (res.data) this.summary.set(res.data);
      }
    });
    this.telemetryService.getRequests(50).subscribe({
      next: res => {
        if (res.data) this.recentRequests.set(res.data);
      }
    });
  }

  paginatedRequests(): TelemetryRecord[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.recentRequests().slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.recentRequests().length / this.pageSize) || 1;
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(total, 5); i++) pages.push(i);
    return pages;
  }

  startIndex(): number {
    return (this.currentPage() - 1) * this.pageSize;
  }

  endIndex(): number {
    return Math.min(this.startIndex() + this.pageSize, this.recentRequests().length);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  clearRequests() {
    this.isClearing.set(true);
    this.telemetryService.clearRequests().subscribe({
      next: () => {
        this.recentRequests.set([]);
        this.currentPage.set(1);
        this.isClearing.set(false);
        this.loadTelemetry();
        this.toast.success('Inbound request telemetry stream cleared.');
      },
      error: err => {
        this.isClearing.set(false);
        this.toast.error(err.error?.error || 'Failed to clear telemetry stream.');
      }
    });
  }

  testPing() {
    const startTime = Date.now();
    this.telemetryService.ping().subscribe({
      next: res => {
        const duration = Date.now() - startTime;
        const pingRecord: TelemetryRecord = {
          id: `ping-${Date.now()}`,
          method: 'POST',
          path: '/api/telemetry/ping',
          status: 200,
          durationMs: duration,
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1',
          userAgent: 'browser',
          requestId: `req-ping-${Math.random().toString(36).substring(2, 8)}`
        };

        // Immediately prepend ping to UI table
        this.recentRequests.update(prev => [pingRecord, ...prev]);
        this.toast.success(`Server responded: ${res.data.message} in ${duration}ms`);
        this.refreshQuietly();
      },
      error: () => {
        this.toast.error('Ping request timed out.');
      }
    });
  }

  getSanitizedPath(rawPath: string | undefined): string {
    if (!rawPath) return 'backend/data/mploychek.xml';
    if (rawPath.includes('mploychek.xml')) {
      return 'backend/data/mploychek.xml';
    }
    return rawPath;
  }

  getMethodColor(method: string): string {
    switch (method) {
      case 'GET': return 'text-sky-400';
      case 'POST': return 'text-emerald-400';
      case 'PATCH': return 'text-amber-400';
      case 'DELETE': return 'text-rose-400';
      default: return 'text-slate-300';
    }
  }

  getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return 'text-emerald-400';
    if (status >= 400 && status < 500) return 'text-amber-400';
    return 'text-rose-400';
  }
}
