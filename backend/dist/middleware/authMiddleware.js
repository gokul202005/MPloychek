"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const userRepository_1 = require("../repositories/xml/userRepository");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required. Missing Bearer token.'
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
        const userRepo = new userRepository_1.UserRepository();
        const user = await userRepo.getById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication failed. User no longer exists.'
            });
        }
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                error: 'Account access has been deactivated. Contact your compliance administrator.'
            });
        }
        req.user = userRepo.toSafeUser(user);
        next();
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            error: err.name === 'TokenExpiredError' ? 'Authentication token expired.' : 'Invalid authentication token.'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Access denied: Administrator privileges required.'
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
