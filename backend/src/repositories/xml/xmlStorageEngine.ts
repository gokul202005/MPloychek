import fs from 'fs';
import path from 'path';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/env';
import { MploychekDataSchema } from '../../types';

export interface StorageHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  fileExists: boolean;
  filePath: string;
  fileSizeBytes: number;
  readDurationMs: number;
  parseDurationMs: number;
  lastChecked: string;
  error?: string;
}

export class XmlStorageEngine {
  private static instance: XmlStorageEngine;
  private filePath: string;
  private backupDir: string;
  private writeQueue: Promise<void> = Promise.resolve();
  private cachedData: MploychekDataSchema | null = null;
  private lastHealthCheck: StorageHealth | null = null;

  private xmlParser: XMLParser;
  private xmlBuilder: XMLBuilder;

  private constructor() {
    this.filePath = config.xmlDataFile;
    this.backupDir = config.backupDir;

    // Secure XML Parser options - Prevent XXE, entity expansion, attribute injection
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      parseTagValue: false, // Keep raw strings to maintain strict typing in our schema normalizers
      trimValues: true,
      processEntities: false,
      stopNodes: []
    });

    // Secure XML Builder options - Format XML, escape entities
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      indentBy: '  ',
      suppressEmptyNode: false
    });

    this.ensureDirectories();
  }

  public static getInstance(): XmlStorageEngine {
    if (!XmlStorageEngine.instance) {
      XmlStorageEngine.instance = new XmlStorageEngine();
    }
    return XmlStorageEngine.instance;
  }

  private ensureDirectories(): void {
    const dataDir = path.dirname(this.filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Validates raw XML string against security threats (DOCTYPE, Entity Expansion, Size limit)
   */
  private validateXmlSecurity(xmlContent: string): void {
    if (Buffer.byteLength(xmlContent, 'utf8') > config.maxXmlSizeBytes) {
      throw new Error(`XML payload exceeds maximum permitted size of ${config.maxXmlSizeBytes} bytes`);
    }

    const lower = xmlContent.toLowerCase();
    if (lower.includes('<!doctype') || lower.includes('<!entity') || lower.includes('system') && lower.includes('http')) {
      throw new Error('SECURITY VIOLATION: Malicious XML payload detected (DOCTYPE / ENTITY declarations are strictly prohibited).');
    }
  }

  /**
   * Initializes the XML storage file if it does not already exist.
   * NEVER overwrites an existing file during startup.
   */
  public async initialize(): Promise<void> {
    this.ensureDirectories();

    if (!fs.existsSync(this.filePath)) {
      const initialData: MploychekDataSchema = {
        organizations: [],
        users: [],
        employmentRecords: [],
        evidenceItems: [],
        verificationEvents: [],
        clarificationRequests: [],
        complianceDeadlines: [],
        notifications: [],
        auditEvents: []
      };
      await this.saveData(initialData, 'Initial empty database initialization');
      this.cachedData = initialData;
    } else {
      // Validate that the existing file can be parsed and is not corrupt
      await this.loadData();
    }
  }

  /**
   * Reads and parses data from the XML file.
   */
  public async loadData(): Promise<MploychekDataSchema> {
    if (!fs.existsSync(this.filePath)) {
      await this.initialize();
      return this.cachedData!;
    }

    const startTime = performance.now();
    const rawXml = fs.readFileSync(this.filePath, 'utf8');
    const readDuration = performance.now() - startTime;

    this.validateXmlSecurity(rawXml);

    const parseStart = performance.now();
    let parsed: any;
    try {
      parsed = this.xmlParser.parse(rawXml);
    } catch (err: any) {
      throw new Error(`XML parsing error: Stored XML is malformed or invalid: ${err.message}`);
    }
    const parseDuration = performance.now() - parseStart;

    if (!parsed || !parsed.mploychekData) {
      throw new Error('Invalid XML document structure: missing <mploychekData> root element.');
    }

    const normalized = this.normalizeDocument(parsed.mploychekData);
    this.cachedData = normalized;

    const stats = fs.statSync(this.filePath);
    this.lastHealthCheck = {
      status: 'HEALTHY',
      fileExists: true,
      filePath: this.filePath,
      fileSizeBytes: stats.size,
      readDurationMs: Math.round(readDuration * 100) / 100,
      parseDurationMs: Math.round(parseDuration * 100) / 100,
      lastChecked: new Date().toISOString()
    };

    return normalized;
  }

  /**
   * Safely writes the document using serialized queue and atomic temp-file rename.
   */
  public async saveData(data: MploychekDataSchema, reason = 'Update'): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.writeQueue = this.writeQueue
        .then(async () => {
          try {
            await this.performSafeWrite(data, reason);
            this.cachedData = data;
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  private async performSafeWrite(data: MploychekDataSchema, reason: string): Promise<void> {
    const docObject = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8'
      },
      mploychekData: {
        '@_schemaVersion': '1.0',
        '@_lastUpdated': new Date().toISOString(),
        '@_updateReason': reason,
        organizations: { organization: data.organizations },
        users: { user: data.users },
        employmentRecords: { record: data.employmentRecords },
        evidenceItems: { evidence: data.evidenceItems },
        verificationEvents: { event: data.verificationEvents },
        clarificationRequests: { clarification: data.clarificationRequests },
        complianceDeadlines: { deadline: data.complianceDeadlines },
        notifications: { notification: data.notifications },
        auditEvents: { auditEvent: data.auditEvents }
      }
    };

    const xmlString = this.xmlBuilder.build(docObject);
    this.validateXmlSecurity(xmlString);

    // 1. Create a safe backup of the current file before replacing
    if (fs.existsSync(this.filePath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `mploychek-backup-${timestamp}.xml`);
      fs.copyFileSync(this.filePath, backupPath);

      // Clean old backups keeping only last 20 snapshots
      this.pruneBackups();
    }

    // 2. Write to a temporary file in the same directory (ensures atomic move on same filesystem)
    const tempFileName = `mploychek.xml.tmp.${uuidv4()}`;
    const tempFilePath = path.join(path.dirname(this.filePath), tempFileName);

    const fd = fs.openSync(tempFilePath, 'w');
    fs.writeSync(fd, xmlString, 0, 'utf8');
    fs.fsyncSync(fd);
    fs.closeSync(fd);

    // 3. Atomically rename temporary file over target file
    fs.renameSync(tempFilePath, this.filePath);
  }

  private pruneBackups(): void {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('mploychek-backup-') && f.endsWith('.xml'))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f),
          time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 20) {
        files.slice(20).forEach(file => {
          try { fs.unlinkSync(file.path); } catch { }
        });
      }
    } catch {
      // Ignore backup prune errors
    }
  }

  /**
   * Helper to ensure XML lists are always converted to arrays even when single element or empty
   */
  private toArray<T>(val: any): T[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [val];
  }

  /**
   * Normalizes parsed XML object into validated TypeScript MploychekDataSchema
   */
  private normalizeDocument(root: any): MploychekDataSchema {
    return {
      organizations: this.toArray<any>(root.organizations?.organization).map(org => ({
        id: String(org.id || ''),
        name: String(org.name || ''),
        domain: String(org.domain || ''),
        tier: (org.tier || 'STANDARD') as any,
        verificationPolicy: (org.verificationPolicy || 'STANDARD') as any,
        createdAt: String(org.createdAt || new Date().toISOString()),
        updatedAt: String(org.updatedAt || new Date().toISOString())
      })),
      users: this.toArray<any>(root.users?.user).map(u => ({
        id: String(u.id || ''),
        name: String(u.name || ''),
        email: String(u.email || ''),
        passwordHash: String(u.passwordHash || ''),
        role: (u.role || 'USER') as any,
        organizationId: String(u.organizationId || ''),
        status: (u.status || 'ACTIVE') as any,
        department: String(u.department || ''),
        title: String(u.title || ''),
        phone: u.phone ? String(u.phone) : undefined,
        lastLoginAt: u.lastLoginAt ? String(u.lastLoginAt) : undefined,
        createdAt: String(u.createdAt || new Date().toISOString()),
        updatedAt: String(u.updatedAt || new Date().toISOString())
      })),
      employmentRecords: this.toArray<any>(root.employmentRecords?.record).map(r => ({
        id: String(r.id || ''),
        employeeId: String(r.employeeId || ''),
        employeeName: String(r.employeeName || ''),
        organizationId: String(r.organizationId || ''),
        department: String(r.department || ''),
        jobTitle: String(r.jobTitle || ''),
        employmentType: (r.employmentType || 'FULL_TIME') as any,
        startDate: String(r.startDate || ''),
        endDate: r.endDate ? String(r.endDate) : undefined,
        verificationStatus: (r.verificationStatus || 'PENDING') as any,
        backgroundCheckStatus: (r.backgroundCheckStatus || 'NOT_STARTED') as any,
        backgroundCheckDate: r.backgroundCheckDate ? String(r.backgroundCheckDate) : undefined,
        assignedReviewerId: r.assignedReviewerId ? String(r.assignedReviewerId) : undefined,
        assignedReviewerName: r.assignedReviewerName ? String(r.assignedReviewerName) : undefined,
        compensationGrade: r.compensationGrade ? String(r.compensationGrade) : undefined,
        internalAssessmentNotes: r.internalAssessmentNotes ? String(r.internalAssessmentNotes) : undefined,
        publicReviewerNotes: r.publicReviewerNotes ? String(r.publicReviewerNotes) : undefined,
        confidenceScore: Number(r.confidenceScore || 0),
        confidenceLevel: (r.confidenceLevel || 'LOW') as any,
        confidenceBreakdownJson: String(r.confidenceBreakdownJson || '{}'),
        followUpDeadline: r.followUpDeadline ? String(r.followUpDeadline) : undefined,
        createdBy: String(r.createdBy || ''),
        createdAt: String(r.createdAt || new Date().toISOString()),
        updatedAt: String(r.updatedAt || new Date().toISOString())
      })),
      evidenceItems: this.toArray<any>(root.evidenceItems?.evidence).map(e => ({
        id: String(e.id || ''),
        recordId: String(e.recordId || ''),
        organizationId: String(e.organizationId || ''),
        documentType: (e.documentType || 'OTHER') as any,
        title: String(e.title || ''),
        filename: String(e.filename || ''),
        originalFilename: String(e.originalFilename || ''),
        fileSize: Number(e.fileSize || 0),
        mimeType: String(e.mimeType || 'application/octet-stream'),
        storagePath: String(e.storagePath || ''),
        reviewStatus: (e.reviewStatus || 'PENDING') as any,
        reviewerId: e.reviewerId ? String(e.reviewerId) : undefined,
        reviewerName: e.reviewerName ? String(e.reviewerName) : undefined,
        reviewerComments: e.reviewerComments ? String(e.reviewerComments) : undefined,
        submittedBy: String(e.submittedBy || ''),
        submittedByName: String(e.submittedByName || ''),
        submittedAt: String(e.submittedAt || new Date().toISOString()),
        reviewedAt: e.reviewedAt ? String(e.reviewedAt) : undefined,
        expirationDate: e.expirationDate ? String(e.expirationDate) : undefined
      })),
      verificationEvents: this.toArray<any>(root.verificationEvents?.event).map(ev => ({
        id: String(ev.id || ''),
        recordId: String(ev.recordId || ''),
        organizationId: String(ev.organizationId || ''),
        eventType: (ev.eventType || 'STATUS_CHANGED') as any,
        title: String(ev.title || ''),
        description: String(ev.description || ''),
        actorId: String(ev.actorId || ''),
        actorName: String(ev.actorName || ''),
        actorRole: (ev.actorRole || 'USER') as any,
        previousStatus: ev.previousStatus ? String(ev.previousStatus) : undefined,
        newStatus: ev.newStatus ? String(ev.newStatus) : undefined,
        scoreDelta: ev.scoreDelta !== undefined ? Number(ev.scoreDelta) : undefined,
        timestamp: String(ev.timestamp || new Date().toISOString())
      })),
      clarificationRequests: this.toArray<any>(root.clarificationRequests?.clarification).map(c => ({
        id: String(c.id || ''),
        recordId: String(c.recordId || ''),
        organizationId: String(c.organizationId || ''),
        subject: String(c.subject || ''),
        question: String(c.question || ''),
        requestedBy: String(c.requestedBy || ''),
        requestedByName: String(c.requestedByName || ''),
        requestedAt: String(c.requestedAt || new Date().toISOString()),
        dueDate: String(c.dueDate || ''),
        status: (c.status || 'OPEN') as any,
        response: c.response ? String(c.response) : undefined,
        respondedBy: c.respondedBy ? String(c.respondedBy) : undefined,
        respondedByName: c.respondedByName ? String(c.respondedByName) : undefined,
        respondedAt: c.respondedAt ? String(c.respondedAt) : undefined
      })),
      complianceDeadlines: this.toArray<any>(root.complianceDeadlines?.deadline).map(d => ({
        id: String(d.id || ''),
        recordId: String(d.recordId || ''),
        organizationId: String(d.organizationId || ''),
        title: String(d.title || ''),
        category: (d.category || 'VERIFICATION_RENEWAL') as any,
        dueDate: String(d.dueDate || ''),
        status: (d.status || 'ACTIVE') as any,
        priority: (d.priority || 'MEDIUM') as any,
        assignedReviewerId: d.assignedReviewerId ? String(d.assignedReviewerId) : undefined,
        assignedReviewerName: d.assignedReviewerName ? String(d.assignedReviewerName) : undefined,
        reminderDaysBefore: Number(d.reminderDaysBefore || 7),
        createdAt: String(d.createdAt || new Date().toISOString()),
        updatedAt: String(d.updatedAt || new Date().toISOString())
      })),
      notifications: this.toArray<any>(root.notifications?.notification).map(n => ({
        id: String(n.id || ''),
        recipientId: String(n.recipientId || ''),
        organizationId: String(n.organizationId || ''),
        title: String(n.title || ''),
        message: String(n.message || ''),
        category: (n.category || 'SYSTEM') as any,
        targetType: (n.targetType || 'RECORD') as any,
        targetId: n.targetId ? String(n.targetId) : undefined,
        isRead: String(n.isRead) === 'true' || n.isRead === true,
        createdAt: String(n.createdAt || new Date().toISOString())
      })),
      auditEvents: this.toArray<any>(root.auditEvents?.auditEvent).map(a => ({
        id: String(a.id || ''),
        timestamp: String(a.timestamp || new Date().toISOString()),
        actorId: String(a.actorId || ''),
        actorName: String(a.actorName || ''),
        actorRole: (a.actorRole || 'USER') as any,
        organizationId: String(a.organizationId || ''),
        actionType: String(a.actionType || ''),
        entityType: (a.entityType || 'RECORD') as any,
        entityId: String(a.entityId || ''),
        outcome: (a.outcome || 'SUCCESS') as any,
        requestId: String(a.requestId || ''),
        ip: String(a.ip || '127.0.0.1'),
        userAgent: String(a.userAgent || 'system'),
        reason: a.reason ? String(a.reason) : undefined,
        metadataJson: a.metadataJson ? String(a.metadataJson) : undefined
      }))
    };
  }

  /**
   * Real file storage health check:
   * Confirms file existence, reads it, validates schema and measure parse speed.
   */
  public async checkHealth(): Promise<StorageHealth> {
    const start = performance.now();
    try {
      if (!fs.existsSync(this.filePath)) {
        return {
          status: 'UNHEALTHY',
          fileExists: false,
          filePath: this.filePath,
          fileSizeBytes: 0,
          readDurationMs: 0,
          parseDurationMs: 0,
          lastChecked: new Date().toISOString(),
          error: 'XML data file does not exist on disk'
        };
      }

      const readStart = performance.now();
      const content = fs.readFileSync(this.filePath, 'utf8');
      const readDuration = performance.now() - readStart;

      const parseStart = performance.now();
      const parsed = this.xmlParser.parse(content);
      const parseDuration = performance.now() - parseStart;

      if (!parsed.mploychekData) {
        throw new Error('Missing root <mploychekData> element');
      }

      const stats = fs.statSync(this.filePath);
      const health: StorageHealth = {
        status: 'HEALTHY',
        fileExists: true,
        filePath: this.filePath,
        fileSizeBytes: stats.size,
        readDurationMs: Math.round(readDuration * 100) / 100,
        parseDurationMs: Math.round(parseDuration * 100) / 100,
        lastChecked: new Date().toISOString()
      };
      this.lastHealthCheck = health;
      return health;
    } catch (err: any) {
      const health: StorageHealth = {
        status: 'UNHEALTHY',
        fileExists: fs.existsSync(this.filePath),
        filePath: this.filePath,
        fileSizeBytes: 0,
        readDurationMs: 0,
        parseDurationMs: 0,
        lastChecked: new Date().toISOString(),
        error: err.message
      };
      this.lastHealthCheck = health;
      return health;
    }
  }
}
