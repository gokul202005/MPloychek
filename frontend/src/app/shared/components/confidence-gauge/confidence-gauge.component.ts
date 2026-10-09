import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confidence-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2.5">
      <!-- Radial circular progress indicator -->
      <div class="relative w-10 h-10 flex items-center justify-center">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <!-- Background track -->
          <path
            class="text-slate-800"
            stroke-width="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <!-- Stroke progress -->
          <path
            [ngClass]="getStrokeColor()"
            [attr.stroke-dasharray]="score + ', 100'"
            stroke-width="3.5"
            stroke-linecap="round"
            stroke="currentColor"
            fill="none"
            class="transition-all duration-700 ease-out"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span class="absolute font-mono text-[11px] font-bold" [ngClass]="getTextColor()">
          {{ score }}
        </span>
      </div>

      <div *ngIf="showLabel" class="flex flex-col">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-semibold uppercase tracking-wider" [ngClass]="getTextColor()">
            {{ getLevel() }} TRUST
          </span>
        </div>
        <span class="text-[10px] text-slate-400">Rules-based confidence</span>
      </div>
    </div>
  `
})
export class ConfidenceGaugeComponent {
  @Input() score: number = 0;
  @Input() showLabel: boolean = true;

  getLevel(): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (this.score >= 80) return 'HIGH';
    if (this.score >= 50) return 'MEDIUM';
    return 'LOW';
  }

  getStrokeColor(): string {
    const level = this.getLevel();
    if (level === 'HIGH') return 'text-emerald-400';
    if (level === 'MEDIUM') return 'text-amber-400';
    return 'text-rose-400';
  }

  getTextColor(): string {
    const level = this.getLevel();
    if (level === 'HIGH') return 'text-emerald-400';
    if (level === 'MEDIUM') return 'text-amber-400';
    return 'text-rose-400';
  }
}
