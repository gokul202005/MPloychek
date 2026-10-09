import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="pointer-events-auto p-4 rounded-xl shadow-2xl border text-xs font-medium flex items-center justify-between gap-3 transition-all duration-300 transform translate-y-0"
        [ngClass]="getToastClass(toast.type)"
      >
        <div class="flex items-center gap-2.5">
          <span class="w-2 h-2 rounded-full" [ngClass]="getDotClass(toast.type)"></span>
          <span class="text-white">{{ toast.message }}</span>
        </div>
        <button (click)="toastService.dismiss(toast.id)" class="text-slate-400 hover:text-white">
          &times;
        </button>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getToastClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200';
      case 'error':
        return 'bg-rose-950/90 border-rose-500/40 text-rose-200';
      default:
        return 'bg-slate-900/90 border-brand-500/40 text-slate-200';
    }
  }

  getDotClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-400';
      case 'error':
        return 'bg-rose-400 animate-ping';
      default:
        return 'bg-brand-400';
    }
  }
}
