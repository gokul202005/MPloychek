import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'records',
        loadComponent: () => import('./features/records/record-list.component').then(m => m.RecordListComponent)
      },
      {
        path: 'records/:id',
        loadComponent: () => import('./features/records/record-detail.component').then(m => m.RecordDetailComponent)
      },
      {
        path: 'compliance',
        loadComponent: () => import('./features/compliance/deadline-center.component').then(m => m.DeadlineCenterComponent)
      },
      {
        path: 'evidence',
        loadComponent: () => import('./features/evidence/evidence-vault.component').then(m => m.EvidenceVaultComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics-view.component').then(m => m.AnalyticsViewComponent)
      },
      {
        path: 'docs',
        loadComponent: () => import('./features/documentation/docs-view.component').then(m => m.DocsViewComponent)
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/users/user-directory.component').then(m => m.UserDirectoryComponent)
      },
      {
        path: 'audit',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/audit/audit-explorer.component').then(m => m.AuditExplorerComponent)
      },
      {
        path: 'telemetry',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/telemetry/telemetry-dashboard.component').then(m => m.TelemetryDashboardComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
