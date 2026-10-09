"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const userRepository_1 = require("../repositories/xml/userRepository");
const organizationRepository_1 = require("../repositories/xml/organizationRepository");
const auditService_1 = require("./auditService");
class AuthService {
    userRepo;
    orgRepo;
    auditService;
    constructor() {
        this.userRepo = new userRepository_1.UserRepository();
        this.orgRepo = new organizationRepository_1.OrganizationRepository();
        this.auditService = new auditService_1.AuditService();
    }
    async login(email, pass, reqMeta) {
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            await this.auditService.logEvent({
                actorId: 'anonymous',
                actorName: email,
                actorRole: 'USER',
                organizationId: 'unknown',
                actionType: 'AUTH_LOGIN_FAILED',
                entityType: 'AUTH',
                entityId: email,
                outcome: 'FAILURE',
                requestId: reqMeta.requestId,
                ip: reqMeta.ip,
                userAgent: reqMeta.userAgent,
                reason: 'User not found'
            });
            throw new Error('Invalid email or password.');
        }
        if (user.status !== 'ACTIVE') {
            await this.auditService.logEvent({
                actorId: user.id,
                actorName: user.name,
                actorRole: user.role,
                organizationId: user.organizationId,
                actionType: 'AUTH_LOGIN_BLOCKED',
                entityType: 'AUTH',
                entityId: user.id,
                outcome: 'DENIED',
                requestId: reqMeta.requestId,
                ip: reqMeta.ip,
                userAgent: reqMeta.userAgent,
                reason: 'Account is deactivated'
            });
            throw new Error('Your account has been deactivated. Please contact an administrator.');
        }
        const isMatch = await bcryptjs_1.default.compare(pass, user.passwordHash);
        if (!isMatch) {
            await this.auditService.logEvent({
                actorId: user.id,
                actorName: user.name,
                actorRole: user.role,
                organizationId: user.organizationId,
                actionType: 'AUTH_LOGIN_FAILED',
                entityType: 'AUTH',
                entityId: user.id,
                outcome: 'FAILURE',
                requestId: reqMeta.requestId,
                ip: reqMeta.ip,
                userAgent: reqMeta.userAgent,
                reason: 'Invalid password credentials'
            });
            throw new Error('Invalid email or password.');
        }
        // Update lastLoginAt
        await this.userRepo.update(user.id, { lastLoginAt: new Date().toISOString() });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            role: user.role,
            organizationId: user.organizationId
        }, env_1.config.jwtSecret, { expiresIn: '24h' });
        await this.auditService.logEvent({
            actorId: user.id,
            actorName: user.name,
            actorRole: user.role,
            organizationId: user.organizationId,
            actionType: 'AUTH_LOGIN_SUCCESS',
            entityType: 'AUTH',
            entityId: user.id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent
        });
        return {
            token,
            user: this.userRepo.toSafeUser(user)
        };
    }
    async register(data, reqMeta) {
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) {
            throw new Error('A user with this email address already exists.');
        }
        // Assign default org if none provided
        let orgId = data.organizationId;
        if (!orgId) {
            const orgs = await this.orgRepo.getAll();
            orgId = orgs.length > 0 ? orgs[0].id : 'org-default';
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(data.password, salt);
        const newUser = {
            id: `user-${(0, uuid_1.v4)().substring(0, 8)}`,
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash,
            role: 'USER', // Public registration is strictly restricted to USER role
            organizationId: orgId,
            status: 'ACTIVE',
            department: data.department,
            title: data.title,
            phone: data.phone,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const savedUser = await this.userRepo.create(newUser);
        await this.auditService.logEvent({
            actorId: savedUser.id,
            actorName: savedUser.name,
            actorRole: 'USER',
            organizationId: savedUser.organizationId,
            actionType: 'USER_REGISTERED',
            entityType: 'USER',
            entityId: savedUser.id,
            outcome: 'SUCCESS',
            requestId: reqMeta.requestId,
            ip: reqMeta.ip,
            userAgent: reqMeta.userAgent
        });
        const token = jsonwebtoken_1.default.sign({
            userId: savedUser.id,
            role: savedUser.role,
            organizationId: savedUser.organizationId
        }, env_1.config.jwtSecret, { expiresIn: '24h' });
        return {
            token,
            user: this.userRepo.toSafeUser(savedUser)
        };
    }
    async getMe(userId) {
        const user = await this.userRepo.getById(userId);
        return user ? this.userRepo.toSafeUser(user) : null;
    }
}
exports.AuthService = AuthService;
