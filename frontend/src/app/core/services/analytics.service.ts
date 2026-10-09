import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { DashboardMetrics, AnalyticsOverview } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private api: ApiService) {}

  getDashboardMetrics() {
    return this.api.get<DashboardMetrics>('/analytics/dashboard');
  }

  getAnalyticsOverview() {
    return this.api.get<AnalyticsOverview>('/analytics/overview');
  }
}
