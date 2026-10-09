import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerificationStatus } from '../../models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border shadow-sm"
      [ngClass]="getBadgeClass()"
    >
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getDotClass()"></span>
      {{ getDisplayLabel() }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: VerificationStatus | string = 'PENDING';

  getBadgeClass(): string {
    switch (this.status) {
      case 'VERIFIED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'IN_REVIEW':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'ACTION_REQUIRED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'RESUBMITTED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'EXPIRED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  getDotClass(): string {
    switch (this.status) {
      case 'VERIFIED':
        return 'bg-emerald-400 animate-pulse';
      case 'PENDING':
        return 'bg-amber-400';
      case 'IN_REVIEW':
        return 'bg-sky-400 animate-pulse';
      case 'ACTION_REQUIRED':
        return 'bg-rose-400 animate-ping';
      case 'RESUBMITTED':
        return 'bg-purple-400';
      case 'REJECTED':
        return 'bg-red-400';
      case 'EXPIRED':
        return 'bg-slate-400';
      default:
        return 'bg-slate-400';
    }
  }

  getDisplayLabel(): string {
    return (this.status || '').replace(/_/g, ' ');
  }
}
