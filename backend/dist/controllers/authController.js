"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
const schemas_1 = require("../schemas");
class AuthController {
    authService;
    constructor() {
        this.authService = new authService_1.AuthService();
    }
    login = async (req, res, next) => {
        try {
            const validated = schemas_1.loginSchema.parse(req.body);
            const reqMeta = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'browser',
                requestId: req.requestId || 'unknown'
            };
            const result = await this.authService.login(validated.email, validated.password, reqMeta);
            res.json({
                success: true,
                message: 'Authentication successful',
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    };
    register = async (req, res, next) => {
        try {
            const validated = schemas_1.registerSchema.parse(req.body);
            const reqMeta = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'browser',
                requestId: req.requestId || 'unknown'
            };
            const result = await this.authService.register(validated, reqMeta);
            res.status(201).json({
                success: true,
                message: 'Account registered successfully',
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    };
    logout = async (req, res, next) => {
        try {
            res.json({
                success: true,
                message: 'Signed out successfully'
            });
        }
        catch (err) {
            next(err);
        }
    };
    getMe = async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const user = await this.authService.getMe(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            res.json({
                success: true,
                data: user
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AuthController = AuthController;
