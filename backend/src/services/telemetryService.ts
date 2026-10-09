import os from 'os';
import { TelemetryRecord } from '../types';
import { XmlStorageEngine, StorageHealth } from '../repositories/xml/xmlStorageEngine';

export class TelemetryService {
  private static instance: TelemetryService;
  private recentRequests: TelemetryRecord[] = [];
  private maxStoredRequests = 100;
  private totalRequests = 0;
  private totalSuccess = 0;
  private totalClientErrors = 0;
  private totalServerErrors = 0;
  private totalDurationMs = 0;
  private inFlightRequests = 0;
  private simulatedDelayMs = 0;

  private constructor() {}

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  public recordRequestStart(): void {
    this.inFlightRequests++;
  }

  public recordRequestEnd(record: TelemetryRecord): void {
    this.inFlightRequests = Math.max(0, this.inFlightRequests - 1);
    this.totalRequests++;
    this.totalDurationMs += record.durationMs;

    if (record.status >= 200 && record.status < 400) {
      this.totalSuccess++;
    } else if (record.status >= 400 && record.status < 500) {
      this.totalClientErrors++;
    } else if (record.status >= 500) {
      this.totalServerErrors++;
    }

    this.recentRequests.unshift(record);
    if (this.recentRequests.length > this.maxStoredRequests) {
      this.recentRequests.pop();
    }
  }

  public getSimulatedDelayMs(): number {
    return this.simulatedDelayMs;
  }

  public setSimulatedDelayMs(delayMs: number): void {
    // Clamped strictly to allowed presets or max 1500ms
    const allowed = [0, 150, 350, 800, 1500];
    if (allowed.includes(delayMs)) {
      this.simulatedDelayMs = delayMs;
    } else {
      this.simulatedDelayMs = Math.max(0, Math.min(1500, delayMs));
    }
  }

  public async getSummary(): Promise<{
    totalRequests: number;
    totalSuccess: number;
    totalClientErrors: number;
    totalServerErrors: number;
    averageResponseTimeMs: number;
    inFlightRequests: number;
    simulatedDelayMs: number;
    runtime: {
      nodeVersion: string;
      platform: string;
      uptimeSeconds: number;
      memoryUsage: {
        rssMb: number;
        heapTotalMb: number;
        heapUsedMb: number;
      };
      systemLoad: number[];
    };
    xmlStorageHealth: StorageHealth;
  }> {
    const mem = process.memoryUsage();
    const xmlEngine = XmlStorageEngine.getInstance();
    const xmlHealth = await xmlEngine.checkHealth();

    return {
      totalRequests: this.totalRequests,
      totalSuccess: this.totalSuccess,
      totalClientErrors: this.totalClientErrors,
      totalServerErrors: this.totalServerErrors,
      averageResponseTimeMs:
        this.totalRequests > 0 ? Math.round((this.totalDurationMs / this.totalRequests) * 10) / 10 : 0,
      inFlightRequests: this.inFlightRequests,
      simulatedDelayMs: this.simulatedDelayMs,
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsage: {
          rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
          heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
          heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10
        },
        systemLoad: os.loadavg()
      },
      xmlStorageHealth: xmlHealth
    };
  }

  public getRecentRequests(limit = 30): TelemetryRecord[] {
    return this.recentRequests.slice(0, limit);
  }
}
