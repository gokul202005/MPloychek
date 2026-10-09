"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryService = void 0;
const os_1 = __importDefault(require("os"));
const xmlStorageEngine_1 = require("../repositories/xml/xmlStorageEngine");
class TelemetryService {
    static instance;
    recentRequests = [];
    maxStoredRequests = 100;
    totalRequests = 0;
    totalSuccess = 0;
    totalClientErrors = 0;
    totalServerErrors = 0;
    totalDurationMs = 0;
    inFlightRequests = 0;
    simulatedDelayMs = 0;
    constructor() { }
    static getInstance() {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }
    recordRequestStart() {
        this.inFlightRequests++;
    }
    recordRequestEnd(record) {
        this.inFlightRequests = Math.max(0, this.inFlightRequests - 1);
        this.totalRequests++;
        this.totalDurationMs += record.durationMs;
        if (record.status >= 200 && record.status < 400) {
            this.totalSuccess++;
        }
        else if (record.status >= 400 && record.status < 500) {
            this.totalClientErrors++;
        }
        else if (record.status >= 500) {
            this.totalServerErrors++;
        }
        this.recentRequests.unshift(record);
        if (this.recentRequests.length > this.maxStoredRequests) {
            this.recentRequests.pop();
        }
    }
    getSimulatedDelayMs() {
        return this.simulatedDelayMs;
    }
    setSimulatedDelayMs(delayMs) {
        // Clamped strictly to allowed presets or max 1500ms
        const allowed = [0, 150, 350, 800, 1500];
        if (allowed.includes(delayMs)) {
            this.simulatedDelayMs = delayMs;
        }
        else {
            this.simulatedDelayMs = Math.max(0, Math.min(1500, delayMs));
        }
    }
    async getSummary() {
        const mem = process.memoryUsage();
        const xmlEngine = xmlStorageEngine_1.XmlStorageEngine.getInstance();
        const xmlHealth = await xmlEngine.checkHealth();
        return {
            totalRequests: this.totalRequests,
            totalSuccess: this.totalSuccess,
            totalClientErrors: this.totalClientErrors,
            totalServerErrors: this.totalServerErrors,
            averageResponseTimeMs: this.totalRequests > 0 ? Math.round((this.totalDurationMs / this.totalRequests) * 10) / 10 : 0,
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
                systemLoad: os_1.default.loadavg()
            },
            xmlStorageHealth: xmlHealth
        };
    }
    getRecentRequests(limit = 30) {
        return this.recentRequests.slice(0, limit);
    }
    clearRequests() {
        this.recentRequests = [];
        this.totalRequests = 0;
        this.totalSuccess = 0;
        this.totalClientErrors = 0;
        this.totalServerErrors = 0;
        this.totalDurationMs = 0;
        this.inFlightRequests = 0;
    }
}
exports.TelemetryService = TelemetryService;
