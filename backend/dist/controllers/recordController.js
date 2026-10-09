"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordController = void 0;
const recordService_1 = require("../services/recordService");
const evidenceService_1 = require("../services/evidenceService");
const clarificationService_1 = require("../services/clarificationService");
const schemas_1 = require("../schemas");
class RecordController {
    recordService;
    evidenceService;
    clarService;
    constructor() {
        this.recordService = new recordService_1.RecordService();
        this.evidenceService = new evidenceService_1.EvidenceService();
        this.clarService = new clarificationService_1.ClarificationService();
    }
    getRecords = async (req, res, next) => {
        try {
            const user = req.user;
            const { search, status, department, employmentType, sortBy, sortOrder, page, limit } = req.query;
            const result = await this.recordService.getRecords(user, {
                search: search,
                status: status,
                department: department,
                employmentType: employmentType,
                sortBy: sortBy,
                sortOrder: sortOrder,
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 10
            });
            res.json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    };
    getRecordById = async (req, res, next) => {
        try {
            const user = req.user;
            const record = await this.recordService.getRecordById(req.params.id, user);
            if (!record) {
                return res.status(404).json({ success: false, error: 'Record not found' });
            }
            res.json({
                success: true,
                data: record
            });
        }
        catch (err) {
            next(err);
        }
    };
    createRecord = async (req, res, next) => {
        try {
            const user = req.user;
            const validated = schemas_1.createRecordSchema.parse(req.body);
            const reqMeta = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'browser',
                requestId: req.requestId || 'unknown'
            };
            const record = await this.recordService.createRecord(validated, user, reqMeta);
            res.status(201).json({
                success: true,
                message: 'Employment record successfully created',
                data: record
            });
        }
        catch (err) {
            next(err);
        }
    };
    updateRecord = async (req, res, next) => {
        try {
            const user = req.user;
            const validated = schemas_1.updateRecordSchema.parse(req.body);
            const reqMeta = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'browser',
                requestId: req.requestId || 'unknown'
            };
            const record = await this.recordService.updateRecord(req.params.id, validated, user, reqMeta);
            res.json({
                success: true,
                message: 'Employment record updated successfully',
                data: record
            });
        }
        catch (err) {
            next(err);
        }
    };
    recordDecision = async (req, res, next) => {
        try {
            const user = req.user;
            const validated = schemas_1.reviewRecordSchema.parse(req.body);
            const reqMeta = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'browser',
                requestId: req.requestId || 'unknown'
            };
            const record = await this.recordService.recordVerificationDecision(req.params.id, validated.decision, validated.reason, validated.publicNotes, validated.internalNotes, validated.followUpDeadline, user, reqMeta);
            res.json({
                success: true,
                message: `Verification decision recorded: ${validated.decision}`,
                data: record
            });
        }
        catch (err) {
            next(err);
        }
    };
    getTimeline = async (req, res, next) => {
        try {
            const user = req.user;
            const timeline = await this.recordService.getTimeline(req.params.id, user);
            res.json({
                success: true,
                data: timeline
            });
        }
        catch (err) {
            next(err);
        }
    };
    getEvidence = async (req, res, next) => {
        try {
            const user = req.user;
            const items = await this.evidenceService.getEvidenceByRecordId(req.params.id, user);
            res.json({
                success: true,
                data: items
            });
        }
        catch (err) {
            next(err);
        }
    };
    getClarifications = async (req, res, next) => {
        try {
            const user = req.user;
            const items = await this.clarService.getClarificationsByRecordId(req.params.id, user);
            res.json({
                success: true,
                data: items
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.RecordController = RecordController;
