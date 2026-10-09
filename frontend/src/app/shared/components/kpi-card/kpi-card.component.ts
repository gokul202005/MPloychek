import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      (click)="navigate()"
      class="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-200 border border-slate-800/80"
      [ngClass]="{
        'cursor-pointer hover:border-slate-700 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-0.5': route
      }"
    >
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ title }}</span>
        <div class="w-9 h-9 rounded-xl flex items-center justify-center" [ngClass]="iconBgClass">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>

      <div class="flex items-baseline justify-between">
        <div class="text-3xl font-extrabold tracking-tight text-white font-mono">{{ value }}</div>
        <span *ngIf="badgeText" class="text-xs font-medium px-2 py-0.5 rounded-full" [ngClass]="badgeClass">
          {{ badgeText }}
        </span>
      </div>

      <p *ngIf="subtitle" class="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
        {{ subtitle }}
      </p>

      <!-- Ambient glow subtle gradient -->
      <div
        class="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20"
        [ngClass]="glowClass"
      ></div>
    </div>
  `
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() subtitle?: string;
  @Input() badgeText?: string;
  @Input() badgeClass: string = 'bg-brand-500/10 text-brand-400 border border-brand-500/20';
  @Input() iconBgClass: string = 'bg-slate-800 text-brand-400';
  @Input() glowClass: string = 'bg-brand-500';
  @Input() route?: string;

  constructor(private router: Router) {}

  navigate() {
    if (this.route) {
      this.router.navigateByUrl(this.route);
    }
  }
}
