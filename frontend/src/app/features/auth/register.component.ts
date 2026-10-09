import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-lg relative z-10">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-black text-white tracking-tight">Create Workspace Account</h1>
          <p class="text-xs text-slate-400 mt-1">Join Apex Global Solutions Workforce Trust Platform</p>
        </div>

        <div class="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800/80">
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                [(ngModel)]="name"
                name="name"
                required
                placeholder="e.g. Jordan Bell"
                class="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="jordan@apexglobal.io"
                class="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
                <input
                  type="text"
                  [(ngModel)]="department"
                  name="department"
                  required
                  placeholder="Engineering"
                  class="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Job Title</label>
                <input
                  type="text"
                  [(ngModel)]="title"
                  name="title"
                  required
                  placeholder="Software Engineer"
                  class="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="At least 6 characters"
                class="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              [disabled]="isLoading()"
              class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all duration-150 disabled:opacity-50 mt-2"
            >
              {{ isLoading() ? 'Creating Account...' : 'Register Account' }}
            </button>
          </form>

          <div class="mt-6 text-center">
            <span class="text-xs text-slate-400">Already have an account? </span>
            <a routerLink="/login" class="text-xs font-semibold text-brand-400 hover:text-brand-300">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  department = '';
  title = '';
  isLoading = signal<boolean>(false);

  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  onSubmit() {
    if (!this.name || !this.email || !this.password || !this.department || !this.title) {
      this.toast.error('All fields are required.');
      return;
    }

    this.isLoading.set(true);
    this.auth.register({
      name: this.name,
      email: this.email,
      password: this.password,
      department: this.department,
      title: this.title
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success('Registration complete! Welcome to MPloyChek.');
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.isLoading.set(false);
        const msg = err.error?.error || 'Registration failed.';
        this.toast.error(msg);
      }
    });
  }
}
