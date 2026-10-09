"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClarificationController = void 0;
const clarificationService_1 = require("../services/clarificationService");
const schemas_1 = require("../schemas");
class ClarificationController {
    clarService;
    constructor() {
        this.clarService = new clarificationService_1.ClarificationService();
    }
    createClarification = async (req, res, next) => {
        try {
            const user = req.user;
            const validated = schemas_1.createClarificationSchema.parse(req.body);
            const reqMeta = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'browser',
                requestId: req.requestId || 'unknown'
            };
            const result = await this.clarService.createClarification(req.params.id, validated, user, reqMeta);
            res.status(201).json({
                success: true,
                message: 'Clarification request issued successfully',
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    };
    respondClarification = async (req, res, next) => {
        try {
            const user = req.user;
            const validated = schemas_1.respondClarificationSchema.parse(req.body);
            const reqMeta = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'browser',
                requestId: req.requestId || 'unknown'
            };
            const result = await this.clarService.respondClarification(req.params.id, validated.response, user, reqMeta);
            res.json({
                success: true,
                message: 'Clarification response submitted successfully',
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.ClarificationController = ClarificationController;
