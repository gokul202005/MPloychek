import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { TelemetryService } from '../../core/services/telemetry.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="h-16 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30 ml-64">
      <!-- Breadcrumb / Status -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span class="text-white font-semibold flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Workforce Trust Vault
          </span>
          <span class="text-slate-600">/</span>
          <span class="text-slate-300">Enterprise Registry</span>
        </div>

        <!-- Real XML Storage Status indicator -->
        <div
          class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border"
          [ngClass]="xmlHealth() === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'"
        >
          <span class="w-1.5 h-1.5 rounded-full" [ngClass]="xmlHealth() === 'HEALTHY' ? 'bg-emerald-400' : 'bg-amber-400'"></span>
          XML Store: {{ xmlHealth() }}
        </div>
      </div>

      <!-- Controls & Notification Center -->
      <div class="flex items-center gap-3">
        <!-- Latency Simulator Selector (Admin / Dev feature) -->
        <div *ngIf="auth.isAdmin()" class="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1 text-xs">
          <span class="text-slate-400 text-[11px] font-medium hidden md:inline">Latency Sim:</span>
          <select
            [value]="currentDelay()"
            (change)="onDelayChange($event)"
            class="bg-transparent text-slate-200 text-xs font-mono font-semibold focus:outline-none cursor-pointer"
          >
            <option [value]="0" class="bg-slate-900 text-white">0 ms (Instant)</option>
            <option [value]="150" class="bg-slate-900 text-white">150 ms (Fast)</option>
            <option [value]="350" class="bg-slate-900 text-white">350 ms (Normal)</option>
            <option [value]="800" class="bg-slate-900 text-white">800 ms (Slow 3G)</option>
            <option [value]="1500" class="bg-slate-900 text-white">1,500 ms (High Latency)</option>
          </select>
        </div>

        <!-- In-app Notification Bell -->
        <div class="relative">
          <button
            (click)="toggleNotifications()"
            class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors relative"
            title="Notifications"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span
              *ngIf="notifService.unreadCount() > 0"
              class="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse"
            >
              {{ notifService.unreadCount() }}
            </span>
          </button>

          <!-- Notification Dropdown Popover -->
          <div
            *ngIf="showNotifications()"
            class="absolute right-0 mt-2 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden"
          >
            <div class="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-white">Notifications</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono">
                  {{ notifService.unreadCount() }} new
                </span>
              </div>
              <button
                *ngIf="notifService.unreadCount() > 0"
                (click)="markAllRead()"
                class="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                Mark all read
              </button>
            </div>

            <div class="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
              <div
                *ngFor="let notif of notifService.notifications()"
                (click)="onNotificationClick(notif)"
                class="p-3.5 hover:bg-slate-800/50 cursor-pointer transition-colors"
                [ngClass]="{ 'bg-slate-800/20': !notif.isRead }"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="text-xs font-semibold text-white" [ngClass]="{ 'text-brand-300': !notif.isRead }">
                    {{ notif.title }}
                  </p>
                  <span class="text-[10px] text-slate-400 whitespace-nowrap">{{ formatTime(notif.createdAt) }}</span>
                </div>
                <p class="text-xs text-slate-300 mt-1 leading-relaxed">{{ notif.message }}</p>
              </div>

              <div *ngIf="notifService.notifications().length === 0" class="p-6 text-center text-slate-400 text-xs">
                No notifications present
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  notifService = inject(NotificationService);
  telemetryService = inject(TelemetryService);
  toast = inject(ToastService);

  showNotifications = signal<boolean>(false);
  xmlHealth = signal<'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'>('HEALTHY');
  currentDelay = signal<number>(0);

  ngOnInit() {
    this.notifService.fetchNotifications().subscribe();
    this.restoreSavedDelay();
    this.checkHealth();
  }

  private restoreSavedDelay() {
    const saved = localStorage.getItem('mploychek_simulated_delay');
    if (saved !== null) {
      const delay = parseInt(saved, 10);
      if (!isNaN(delay)) {
        this.currentDelay.set(delay);
        this.telemetryService.setSimulatedDelay(delay).subscribe({
          error: () => {}
        });
      }
    }
  }

  checkHealth() {
    this.telemetryService.getSummary().subscribe({
      next: res => {
        if (res.data) {
          this.xmlHealth.set(res.data.xmlStorageHealth.status);
          const saved = localStorage.getItem('mploychek_simulated_delay');
          if (saved === null) {
            this.currentDelay.set(res.data.simulatedDelayMs);
          }
        }
      },
      error: () => {}
    });
  }

  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.toast.success('All notifications marked as read.');
      }
    });
  }

  onNotificationClick(notif: any) {
    if (!notif.isRead) {
      this.notifService.markAsRead(notif.id).subscribe();
    }
    this.showNotifications.set(false);

    // Permission-aware and context-sensitive routing
    if (notif.targetType === 'RECORD' && notif.targetId) {
      this.router.navigate(['/records', notif.targetId]);
    } else if (notif.targetType === 'DEADLINE' || notif.title?.toLowerCase().includes('deadline') || notif.title?.toLowerCase().includes('milestone')) {
      this.router.navigate(['/compliance']);
    } else if (notif.targetType === 'EVIDENCE') {
      if (notif.targetId) {
        this.router.navigate(['/records', notif.targetId]);
      } else {
        this.router.navigate(['/evidence']);
      }
    } else if (notif.targetType === 'CLARIFICATION' || notif.title?.toLowerCase().includes('clarification') || notif.title?.toLowerCase().includes('w-2')) {
      if (notif.targetId) {
        this.router.navigate(['/records', notif.targetId]);
      } else {
        this.router.navigate(['/compliance']);
      }
    } else {
      this.router.navigate(['/records']);
    }
  }

  onDelayChange(event: any) {
    const delay = parseInt(event.target.value, 10);
    localStorage.setItem('mploychek_simulated_delay', String(delay));
    this.currentDelay.set(delay);
    this.telemetryService.setSimulatedDelay(delay).subscribe({
      next: () => {
        this.toast.info(`Development delay configured to ${delay}ms`);
      }
    });
  }

  formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
