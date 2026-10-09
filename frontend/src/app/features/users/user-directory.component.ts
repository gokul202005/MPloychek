import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserAdminService } from '../../core/services/user-admin.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { User } from '../../shared/models';

@Component({
  selector: 'app-user-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span class="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Restricted Administration</span>
          </div>
          <h1 class="text-2xl font-black text-white tracking-tight">Enterprise User Directory</h1>
          <p class="text-xs text-slate-400 font-medium">Manage organization accounts, role credentials, and access activations</p>
        </div>

        <button
          (click)="openCreateModal()"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add New User
        </button>
      </div>

      <!-- User List Table -->
      <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th class="py-3.5 px-4 font-semibold">User</th>
                <th class="py-3.5 px-4 font-semibold">Role</th>
                <th class="py-3.5 px-4 font-semibold">Status</th>
                <th class="py-3.5 px-4 font-semibold">Department & Title</th>
                <th class="py-3.5 px-4 font-semibold">Created Date</th>
                <th class="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr *ngFor="let u of users()" class="hover:bg-slate-800/30 transition-colors">
                <td class="py-3.5 px-4">
                  <div class="font-bold text-white">{{ u.name }}</div>
                  <span class="text-[10px] text-slate-400 font-mono">{{ u.email }}</span>
                </td>
                <td class="py-3.5 px-4">
                  <span
                    class="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                    [ngClass]="u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'"
                  >
                    {{ u.role }}
                  </span>
                </td>
                <td class="py-3.5 px-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    [ngClass]="u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="u.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                    {{ u.status }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-slate-300">
                  <div>{{ u.title }}</div>
                  <span class="text-[10px] text-slate-400">{{ u.department }}</span>
                </td>
                <td class="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                  {{ u.createdAt | date:'mediumDate' }}
                </td>
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      *ngIf="u.id !== auth.currentUser()?.id"
                      (click)="toggleStatus(u)"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                      [ngClass]="u.status === 'ACTIVE' ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/40' : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/40'"
                    >
                      {{ u.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button
                      *ngIf="u.id !== auth.currentUser()?.id"
                      (click)="toggleRole(u)"
                      class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      {{ u.role === 'ADMIN' ? 'Make User' : 'Promote Admin' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add User Modal -->
      <div *ngIf="showCreateModal()" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-700 max-w-md w-full relative shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 class="text-sm font-bold text-white">Create Enterprise User</h2>
            <button (click)="closeCreateModal()" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <form (ngSubmit)="onCreateSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                [(ngModel)]="newUser.name"
                name="name"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                [(ngModel)]="newUser.email"
                name="email"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
                <input
                  type="text"
                  [(ngModel)]="newUser.department"
                  name="department"
                  required
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Job Title *</label>
                <input
                  type="text"
                  [(ngModel)]="newUser.title"
                  name="title"
                  required
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">System Role *</label>
                <select
                  [(ngModel)]="newUser.role"
                  name="role"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="USER">USER (General Worker)</option>
                  <option value="ADMIN">ADMIN (Compliance Officer)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Initial Password *</label>
                <input
                  type="password"
                  [(ngModel)]="newUser.password"
                  name="password"
                  required
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="closeCreateModal()"
                class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class UserDirectoryComponent implements OnInit {
  auth = inject(AuthService);
  userService = inject(UserAdminService);
  toast = inject(ToastService);

  users = signal<User[]>([]);
  showCreateModal = signal<boolean>(false);

  newUser: any = {
    name: '',
    email: '',
    department: '',
    title: '',
    role: 'USER',
    password: ''
  };

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers({ limit: 50 }).subscribe({
      next: res => {
        if (res.data) this.users.set(res.data.items);
      }
    });
  }

  toggleStatus(user: User) {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const reason = `Status modified by administrator ${this.auth.currentUser()?.name}`;
    this.userService.updateUserStatus(user.id, nextStatus, reason).subscribe({
      next: () => {
        this.toast.success(`User marked as ${nextStatus}!`);
        this.loadUsers();
      },
      error: err => {
        this.toast.error(err.error?.error || 'Action failed.');
      }
    });
  }

  toggleRole(user: User) {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    this.userService.updateUser(user.id, { role: nextRole }).subscribe({
      next: () => {
        this.toast.success(`User role changed to ${nextRole}!`);
        this.loadUsers();
      },
      error: err => {
        this.toast.error(err.error?.error || 'Role change failed.');
      }
    });
  }

  openCreateModal() { this.showCreateModal.set(true); }
  closeCreateModal() { this.showCreateModal.set(false); }

  onCreateSubmit() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      this.toast.error('All fields are required.');
      return;
    }
    this.userService.createUser(this.newUser).subscribe({
      next: () => {
        this.closeCreateModal();
        this.toast.success('User account created and saved to XML!');
        this.loadUsers();
      },
      error: err => {
        this.toast.error(err.error?.error || 'User creation failed.');
      }
    });
  }
}
