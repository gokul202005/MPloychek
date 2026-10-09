import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastContainerComponent } from '../../shared/components/toast/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col">
      <app-sidebar></app-sidebar>
      <div class="flex-1 flex flex-col">
        <app-header></app-header>
        <main class="flex-1 ml-64 p-6 lg:p-8 bg-slate-950">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-toast-container></app-toast-container>
    </div>
  `
})
export class MainLayoutComponent {}
