import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { TelemetrySummary, TelemetryRecord } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  constructor(private api: ApiService) {}

  getSummary() {
    return this.api.get<TelemetrySummary>('/telemetry/summary');
  }

  getRequests(limit = 40) {
    return this.api.get<TelemetryRecord[]>('/telemetry/requests', { limit });
  }

  setSimulatedDelay(delayMs: number) {
    return this.api.post<{ message: string; currentDelayMs: number }>('/telemetry/delay', { delayMs });
  }

  ping() {
    return this.api.post<{ message: string; timestamp: string }>('/telemetry/ping', {});
  }
}
