import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <!-- Background atmospheric decorative glows -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-md relative z-10">
        <!-- Brand Header -->
        <div class="text-center mb-8 flex flex-col items-center">
          <div class="relative mb-3 group">
            <div class="absolute -inset-1.5 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-3xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500"></div>
            <div class="relative w-20 h-20 rounded-2xl overflow-hidden border border-brand-400/40 shadow-2xl bg-slate-900/90 p-1 flex items-center justify-center">
              <img src="/assets/logo.png" alt="MPloyChek Logo" class="w-full h-full object-cover rounded-xl" />
            </div>
          </div>
          <h1 class="text-2xl font-black text-white tracking-tight">MPloyChek</h1>
          <p class="text-xs text-slate-400 mt-1 font-medium">Workforce Trust & Verification Platform</p>
          <div class="inline-flex items-center gap-1.5 mt-2.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-mono shadow-inner">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
            Persistent XML Architecture
          </div>
        </div>

        <!-- Login Form Card -->
        <div class="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800/80">
          <h2 class="text-lg font-bold text-white mb-1">Sign In</h2>
          <p class="text-xs text-slate-400 mb-5">Enter your authorized enterprise credentials</p>

          <!-- Role Selector Option (User vs Admin) -->
          <div class="mb-5">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-semibold text-slate-300">Select Role</label>
              <span class="text-[11px] font-mono text-slate-400">
                Mode: <span [class]="selectedRole() === 'admin' ? 'text-amber-400 font-bold' : 'text-sky-400 font-bold'">{{ selectedRole() === 'admin' ? 'Administrator' : 'General User' }}</span>
              </span>
            </div>
            <div class="grid grid-cols-2 p-1.5 bg-slate-900/90 rounded-xl border border-slate-800 gap-2">
              <button
                type="button"
                id="role-admin-toggle"
                (click)="selectRole('admin')"
                class="flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer"
                [ngClass]="selectedRole() === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'"
              >
                <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Administrator</span>
                <span *ngIf="selectedRole() === 'admin'" class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              </button>

              <button
                type="button"
                id="role-user-toggle"
                (click)="selectRole('user')"
                class="flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer"
                [ngClass]="selectedRole() === 'user'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-md shadow-sky-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'"
              >
                <svg class="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>General User</span>
                <span *ngIf="selectedRole() === 'user'" class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              </button>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-slate-300">Work Email</label>
                <span class="text-[10px] text-slate-400 font-mono">
                  {{ selectedRole() === 'admin' ? 'Elevated Access' : 'Standard Access' }}
                </span>
              </div>
              <input
                type="email"
                [(ngModel)]="email"
                (ngModelChange)="onEmailChange($event)"
                (input)="onEmailChange(email)"
                (change)="onEmailChange(email)"
                name="email"
                required
                placeholder="admin@mploychek.test"
                class="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="••••••••"
                class="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              [disabled]="isLoading()"
              class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              <span *ngIf="isLoading()" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ isLoading() ? 'Verifying Credentials...' : 'Sign In as ' + (selectedRole() === 'admin' ? 'Administrator' : 'General User') }}
            </button>
          </form>

          <!-- Quick-Fill Demo Credentials -->
          <div class="mt-6 pt-5 border-t border-slate-800">
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">Quick Demo Access</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="selectRole('admin')"
                class="px-3 py-2.5 rounded-xl transition-all duration-200 text-left border cursor-pointer"
                [ngClass]="selectedRole() === 'admin'
                  ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30 shadow-md shadow-amber-500/5'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-amber-400">Administrator</span>
                  <span *ngIf="selectedRole() === 'admin'" class="text-[9px] text-amber-300 font-semibold px-1.5 py-0.5 rounded bg-amber-500/20">Selected</span>
                </div>
                <div class="text-[10px] text-slate-400 font-mono truncate mt-0.5">admin&#64;mploychek.test</div>
              </button>
              <button
                type="button"
                (click)="selectRole('user')"
                class="px-3 py-2.5 rounded-xl transition-all duration-200 text-left border cursor-pointer"
                [ngClass]="selectedRole() === 'user'
                  ? 'bg-sky-500/10 border-sky-500/50 ring-1 ring-sky-500/30 shadow-md shadow-sky-500/5'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-sky-400">General User</span>
                  <span *ngIf="selectedRole() === 'user'" class="text-[9px] text-sky-300 font-semibold px-1.5 py-0.5 rounded bg-sky-500/20">Selected</span>
                </div>
                <div class="text-[10px] text-slate-400 font-mono truncate mt-0.5">user&#64;mploychek.test</div>
              </button>
            </div>
          </div>

          <!-- Register Link -->
          <div class="mt-5 text-center">
            <span class="text-xs text-slate-400">Need an account? </span>
            <a routerLink="/register" class="text-xs font-semibold text-brand-400 hover:text-brand-300">
              Register here
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  selectedRole = signal<'admin' | 'user'>('admin');
  email = 'admin@mploychek.test';
  password = 'Admin@123';
  isLoading = signal<boolean>(false);

  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  selectRole(role: 'admin' | 'user') {
    this.selectedRole.set(role);
    if (role === 'admin') {
      this.email = 'admin@mploychek.test';
      this.password = 'Admin@123';
    } else {
      this.email = 'user@mploychek.test';
      this.password = 'User@123';
    }
  }

  quickFill(role: 'admin' | 'user') {
    this.selectRole(role);
  }

  onEmailChange(val: string) {
    const lower = (val || '').toLowerCase().trim();
    if (lower.includes('admin') || lower === 'admin@mploychek.test') {
      if (this.selectedRole() !== 'admin') {
        this.selectedRole.set('admin');
        if (this.password === 'User@123') {
          this.password = 'Admin@123';
        }
      }
    } else if (lower.includes('user') || lower.includes('chen') || lower.includes('sarah') || lower === 'user@mploychek.test') {
      if (this.selectedRole() !== 'user') {
        this.selectedRole.set('user');
        if (this.password === 'Admin@123') {
          this.password = 'User@123';
        }
      }
    }
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.toast.error('Please enter both email and password.');
      return;
    }

    this.isLoading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success(`Welcome back, ${this.auth.currentUser()?.name}!`);
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.isLoading.set(false);
        const msg = err.error?.error || 'Invalid credentials. Please verify your login details.';
        this.toast.error(msg);
      }
    });
  }
}
