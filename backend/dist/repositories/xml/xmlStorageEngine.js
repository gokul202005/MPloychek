"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlStorageEngine = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fast_xml_parser_1 = require("fast-xml-parser");
const uuid_1 = require("uuid");
const env_1 = require("../../config/env");
class XmlStorageEngine {
    static instance;
    filePath;
    backupDir;
    writeQueue = Promise.resolve();
    cachedData = null;
    lastHealthCheck = null;
    xmlParser;
    xmlBuilder;
    constructor() {
        this.filePath = env_1.config.xmlDataFile;
        this.backupDir = env_1.config.backupDir;
        // Secure XML Parser options - Decode standard entities (&amp; -> &) with generous expansion ceiling
        this.xmlParser = new fast_xml_parser_1.XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            allowBooleanAttributes: true,
            parseTagValue: false,
            trimValues: true,
            processEntities: {
                enabled: true,
                maxTotalExpansions: 1000000,
                maxExpandedLength: 50000000
            },
            stopNodes: []
        });
        // Secure XML Builder options - Format XML, escape entities
        this.xmlBuilder = new fast_xml_parser_1.XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            format: true,
            indentBy: '  ',
            suppressEmptyNode: false
        });
        this.ensureDirectories();
    }
    static getInstance() {
        if (!XmlStorageEngine.instance) {
            XmlStorageEngine.instance = new XmlStorageEngine();
        }
        return XmlStorageEngine.instance;
    }
    ensureDirectories() {
        const dataDir = path_1.default.dirname(this.filePath);
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs_1.default.existsSync(this.backupDir)) {
            fs_1.default.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    /**
     * Validates raw XML string against security threats (DOCTYPE, Entity Expansion, Size limit)
     */
    validateXmlSecurity(xmlContent) {
        if (Buffer.byteLength(xmlContent, 'utf8') > env_1.config.maxXmlSizeBytes) {
            throw new Error(`XML payload exceeds maximum permitted size of ${env_1.config.maxXmlSizeBytes} bytes`);
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
    async initialize() {
        this.ensureDirectories();
        if (!fs_1.default.existsSync(this.filePath)) {
            const initialData = {
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
        }
        else {
            // Validate that the existing file can be parsed and is not corrupt
            await this.loadData();
        }
    }
    /**
     * Reads and parses data from the XML file.
     */
    async loadData() {
        if (!fs_1.default.existsSync(this.filePath)) {
            await this.initialize();
            return this.cachedData;
        }
        const startTime = performance.now();
        const rawXml = fs_1.default.readFileSync(this.filePath, 'utf8');
        const readDuration = performance.now() - startTime;
        this.validateXmlSecurity(rawXml);
        const parseStart = performance.now();
        let parsed;
        try {
            parsed = this.xmlParser.parse(rawXml);
        }
        catch (err) {
            throw new Error(`XML parsing error: Stored XML is malformed or invalid: ${err.message}`);
        }
        const parseDuration = performance.now() - parseStart;
        if (!parsed || !parsed.mploychekData) {
            throw new Error('Invalid XML document structure: missing <mploychekData> root element.');
        }
        const normalized = this.normalizeDocument(parsed.mploychekData);
        this.cachedData = normalized;
        const stats = fs_1.default.statSync(this.filePath);
        this.lastHealthCheck = {
            status: 'HEALTHY',
            fileExists: true,
            filePath: 'backend/data/mploychek.xml',
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
    async saveData(data, reason = 'Update') {
        return new Promise((resolve, reject) => {
            this.writeQueue = this.writeQueue
                .then(async () => {
                try {
                    await this.performSafeWrite(data, reason);
                    this.cachedData = data;
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
    async performSafeWrite(data, reason) {
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
        if (fs_1.default.existsSync(this.filePath)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path_1.default.join(this.backupDir, `mploychek-backup-${timestamp}.xml`);
            fs_1.default.copyFileSync(this.filePath, backupPath);
            // Clean old backups keeping only last 20 snapshots
            this.pruneBackups();
        }
        // 2. Write to a temporary file in the same directory (ensures atomic move on same filesystem)
        const tempFileName = `mploychek.xml.tmp.${(0, uuid_1.v4)()}`;
        const tempFilePath = path_1.default.join(path_1.default.dirname(this.filePath), tempFileName);
        const fd = fs_1.default.openSync(tempFilePath, 'w');
        fs_1.default.writeSync(fd, xmlString, 0, 'utf8');
        fs_1.default.fsyncSync(fd);
        fs_1.default.closeSync(fd);
        // 3. Atomically rename temporary file over target file (with Windows retry & copy fallback)
        let renamed = false;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                fs_1.default.renameSync(tempFilePath, this.filePath);
                renamed = true;
                break;
            }
            catch (err) {
                if (err.code === 'EPERM' || err.code === 'EBUSY') {
                    const start = Date.now();
                    while (Date.now() - start < 25) { /* micro-sleep */ }
                }
                else {
                    throw err;
                }
            }
        }
        if (!renamed) {
            try {
                fs_1.default.copyFileSync(tempFilePath, this.filePath);
                try {
                    fs_1.default.unlinkSync(tempFilePath);
                }
                catch { }
            }
            catch (fallbackErr) {
                throw fallbackErr;
            }
        }
    }
    pruneBackups() {
        try {
            const files = fs_1.default.readdirSync(this.backupDir)
                .filter(f => f.startsWith('mploychek-backup-') && f.endsWith('.xml'))
                .map(f => ({
                name: f,
                path: path_1.default.join(this.backupDir, f),
                time: fs_1.default.statSync(path_1.default.join(this.backupDir, f)).mtime.getTime()
            }))
                .sort((a, b) => b.time - a.time);
            if (files.length > 20) {
                files.slice(20).forEach(file => {
                    try {
                        fs_1.default.unlinkSync(file.path);
                    }
                    catch { }
                });
            }
        }
        catch {
            // Ignore backup prune errors
        }
    }
    cleanText(val) {
        if (val === undefined || val === null)
            return '';
        let str = String(val);
        while (str.includes('&amp;')) {
            str = str.replace(/&amp;/g, '&');
        }
        return str.trim();
    }
    /**
     * Helper to ensure XML lists are always converted to arrays even when single element or empty
     */
    toArray(val) {
        if (!val)
            return [];
        if (Array.isArray(val))
            return val;
        return [val];
    }
    /**
     * Normalizes parsed XML object into validated TypeScript MploychekDataSchema
     */
    normalizeDocument(root) {
        return {
            organizations: this.toArray(root.organizations?.organization).map(org => ({
                id: this.cleanText(org.id),
                name: this.cleanText(org.name),
                domain: this.cleanText(org.domain),
                tier: (org.tier || 'STANDARD'),
                verificationPolicy: (org.verificationPolicy || 'STANDARD'),
                createdAt: String(org.createdAt || new Date().toISOString()),
                updatedAt: String(org.updatedAt || new Date().toISOString())
            })),
            users: this.toArray(root.users?.user).map(u => ({
                id: String(u.id || ''),
                name: String(u.name || ''),
                email: String(u.email || ''),
                passwordHash: String(u.passwordHash || ''),
                role: (u.role || 'USER'),
                organizationId: String(u.organizationId || ''),
                status: (u.status || 'ACTIVE'),
                department: String(u.department || ''),
                title: String(u.title || ''),
                phone: u.phone ? String(u.phone) : undefined,
                lastLoginAt: u.lastLoginAt ? String(u.lastLoginAt) : undefined,
                createdAt: String(u.createdAt || new Date().toISOString()),
                updatedAt: String(u.updatedAt || new Date().toISOString())
            })),
            employmentRecords: this.toArray(root.employmentRecords?.record).map(r => ({
                id: String(r.id || ''),
                employeeId: String(r.employeeId || ''),
                employeeName: String(r.employeeName || ''),
                organizationId: String(r.organizationId || ''),
                department: String(r.department || ''),
                jobTitle: String(r.jobTitle || ''),
                employmentType: (r.employmentType || 'FULL_TIME'),
                startDate: String(r.startDate || ''),
                endDate: r.endDate ? String(r.endDate) : undefined,
                verificationStatus: (r.verificationStatus || 'PENDING'),
                backgroundCheckStatus: (r.backgroundCheckStatus || 'NOT_STARTED'),
                backgroundCheckDate: r.backgroundCheckDate ? String(r.backgroundCheckDate) : undefined,
                assignedReviewerId: r.assignedReviewerId ? String(r.assignedReviewerId) : undefined,
                assignedReviewerName: r.assignedReviewerName ? String(r.assignedReviewerName) : undefined,
                compensationGrade: r.compensationGrade ? String(r.compensationGrade) : undefined,
                internalAssessmentNotes: r.internalAssessmentNotes ? String(r.internalAssessmentNotes) : undefined,
                publicReviewerNotes: r.publicReviewerNotes ? String(r.publicReviewerNotes) : undefined,
                confidenceScore: Number(r.confidenceScore || 0),
                confidenceLevel: (r.confidenceLevel || 'LOW'),
                confidenceBreakdownJson: String(r.confidenceBreakdownJson || '{}'),
                followUpDeadline: r.followUpDeadline ? String(r.followUpDeadline) : undefined,
                createdBy: String(r.createdBy || ''),
                createdAt: String(r.createdAt || new Date().toISOString()),
                updatedAt: String(r.updatedAt || new Date().toISOString())
            })),
            evidenceItems: this.toArray(root.evidenceItems?.evidence).map(e => ({
                id: this.cleanText(e.id),
                recordId: this.cleanText(e.recordId),
                organizationId: this.cleanText(e.organizationId),
                documentType: (e.documentType || 'OTHER'),
                title: this.cleanText(e.title),
                filename: this.cleanText(e.filename),
                originalFilename: this.cleanText(e.originalFilename),
                fileSize: Number(e.fileSize || 0),
                mimeType: String(e.mimeType || 'application/octet-stream'),
                storagePath: String(e.storagePath || ''),
                reviewStatus: (e.reviewStatus || 'PENDING'),
                reviewerId: e.reviewerId ? this.cleanText(e.reviewerId) : undefined,
                reviewerName: e.reviewerName ? this.cleanText(e.reviewerName) : undefined,
                reviewerComments: e.reviewerComments ? this.cleanText(e.reviewerComments) : undefined,
                submittedBy: String(e.submittedBy || ''),
                submittedByName: String(e.submittedByName || ''),
                submittedAt: String(e.submittedAt || new Date().toISOString()),
                reviewedAt: e.reviewedAt ? String(e.reviewedAt) : undefined,
                expirationDate: e.expirationDate ? String(e.expirationDate) : undefined
            })),
            verificationEvents: this.toArray(root.verificationEvents?.event).map(ev => ({
                id: String(ev.id || ''),
                recordId: String(ev.recordId || ''),
                organizationId: String(ev.organizationId || ''),
                eventType: (ev.eventType || 'STATUS_CHANGED'),
                title: String(ev.title || ''),
                description: String(ev.description || ''),
                actorId: String(ev.actorId || ''),
                actorName: String(ev.actorName || ''),
                actorRole: (ev.actorRole || 'USER'),
                previousStatus: ev.previousStatus ? String(ev.previousStatus) : undefined,
                newStatus: ev.newStatus ? String(ev.newStatus) : undefined,
                scoreDelta: ev.scoreDelta !== undefined ? Number(ev.scoreDelta) : undefined,
                timestamp: String(ev.timestamp || new Date().toISOString())
            })),
            clarificationRequests: this.toArray(root.clarificationRequests?.clarification).map(c => ({
                id: String(c.id || ''),
                recordId: String(c.recordId || ''),
                organizationId: String(c.organizationId || ''),
                subject: String(c.subject || ''),
                question: String(c.question || ''),
                requestedBy: String(c.requestedBy || ''),
                requestedByName: String(c.requestedByName || ''),
                requestedAt: String(c.requestedAt || new Date().toISOString()),
                dueDate: String(c.dueDate || ''),
                status: (c.status || 'OPEN'),
                response: c.response ? String(c.response) : undefined,
                respondedBy: c.respondedBy ? String(c.respondedBy) : undefined,
                respondedByName: c.respondedByName ? String(c.respondedByName) : undefined,
                respondedAt: c.respondedAt ? String(c.respondedAt) : undefined
            })),
            complianceDeadlines: this.toArray(root.complianceDeadlines?.deadline).map(d => ({
                id: String(d.id || ''),
                recordId: String(d.recordId || ''),
                organizationId: String(d.organizationId || ''),
                title: String(d.title || ''),
                category: (d.category || 'VERIFICATION_RENEWAL'),
                dueDate: String(d.dueDate || ''),
                status: (d.status || 'ACTIVE'),
                priority: (d.priority || 'MEDIUM'),
                assignedReviewerId: d.assignedReviewerId ? String(d.assignedReviewerId) : undefined,
                assignedReviewerName: d.assignedReviewerName ? String(d.assignedReviewerName) : undefined,
                reminderDaysBefore: Number(d.reminderDaysBefore || 7),
                createdAt: String(d.createdAt || new Date().toISOString()),
                updatedAt: String(d.updatedAt || new Date().toISOString())
            })),
            notifications: this.toArray(root.notifications?.notification).map(n => ({
                id: String(n.id || ''),
                recipientId: String(n.recipientId || ''),
                organizationId: String(n.organizationId || ''),
                title: String(n.title || ''),
                message: String(n.message || ''),
                category: (n.category || 'SYSTEM'),
                targetType: (n.targetType || 'RECORD'),
                targetId: n.targetId ? String(n.targetId) : undefined,
                isRead: String(n.isRead) === 'true' || n.isRead === true,
                createdAt: String(n.createdAt || new Date().toISOString())
            })),
            auditEvents: this.toArray(root.auditEvents?.auditEvent).map(a => ({
                id: String(a.id || ''),
                timestamp: String(a.timestamp || new Date().toISOString()),
                actorId: String(a.actorId || ''),
                actorName: String(a.actorName || ''),
                actorRole: (a.actorRole || 'USER'),
                organizationId: String(a.organizationId || ''),
                actionType: String(a.actionType || ''),
                entityType: (a.entityType || 'RECORD'),
                entityId: String(a.entityId || ''),
                outcome: (a.outcome || 'SUCCESS'),
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
    async checkHealth() {
        const start = performance.now();
        try {
            if (!fs_1.default.existsSync(this.filePath)) {
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
            const content = fs_1.default.readFileSync(this.filePath, 'utf8');
            const readDuration = performance.now() - readStart;
            const parseStart = performance.now();
            const parsed = this.xmlParser.parse(content);
            const parseDuration = performance.now() - parseStart;
            if (!parsed.mploychekData) {
                throw new Error('Missing root <mploychekData> element');
            }
            const stats = fs_1.default.statSync(this.filePath);
            const health = {
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
        }
        catch (err) {
            const health = {
                status: 'UNHEALTHY',
                fileExists: fs_1.default.existsSync(this.filePath),
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
exports.XmlStorageEngine = XmlStorageEngine;
