import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { UserRepository } from '../repositories/xml/userRepository';
import { OrganizationRepository } from '../repositories/xml/organizationRepository';
import { AuditService } from './auditService';
import { User, SafeUser } from '../types';

export class AuthService {
  private userRepo: UserRepository;
  private orgRepo: OrganizationRepository;
  private auditService: AuditService;

  constructor() {
    this.userRepo = new UserRepository();
    this.orgRepo = new OrganizationRepository();
    this.auditService = new AuditService();
  }

  async login(
    email: string,
    pass: string,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<{ token: string; user: SafeUser }> {
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

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
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

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

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

  async register(
    data: {
      name: string;
      email: string;
      password: string;
      organizationId?: string;
      department: string;
      title: string;
      phone?: string;
    },
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<{ token: string; user: SafeUser }> {
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

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser: User = {
      id: `user-${uuidv4().substring(0, 8)}`,
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

    const token = jwt.sign(
      {
        userId: savedUser.id,
        role: savedUser.role,
        organizationId: savedUser.organizationId
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: this.userRepo.toSafeUser(savedUser)
    };
  }

  async getMe(userId: string): Promise<SafeUser | null> {
    const user = await this.userRepo.getById(userId);
    return user ? this.userRepo.toSafeUser(user) : null;
  }
}
