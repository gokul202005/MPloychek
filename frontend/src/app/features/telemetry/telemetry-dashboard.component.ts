import { Component, inject, OnInit, signal } from '@angular/core';
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
          <span>Active Path: {{ summary()!.xmlStorageHealth.filePath }}</span>
          <span>Last Verified: {{ summary()!.xmlStorageHealth.lastChecked | date:'mediumTime' }}</span>
        </div>
      </div>

      <!-- Recent Requests Activity Stream -->
      <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div class="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <h2 class="text-xs font-bold text-white uppercase tracking-wider">Observed Inbound HTTP Requests</h2>
          <span class="text-[10px] font-mono text-slate-400">Captured via TelemetryMiddleware</span>
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
              <tr *ngFor="let req of recentRequests()" class="hover:bg-slate-800/30">
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
      </div>
    </div>
  `
})
export class TelemetryDashboardComponent implements OnInit {
  telemetryService = inject(TelemetryService);
  toast = inject(ToastService);

  summary = signal<TelemetrySummary | null>(null);
  recentRequests = signal<TelemetryRecord[]>([]);

  ngOnInit() {
    this.loadTelemetry();
  }

  loadTelemetry() {
    this.telemetryService.getSummary().subscribe({
      next: res => {
        if (res.data) this.summary.set(res.data);
      }
    });

    this.telemetryService.getRequests(30).subscribe({
      next: res => {
        if (res.data) this.recentRequests.set(res.data);
      }
    });
  }

  testPing() {
    this.telemetryService.ping().subscribe({
      next: res => {
        this.toast.success(`Server responded: ${res.data.message} in real-time`);
        this.loadTelemetry();
      }
    });
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
