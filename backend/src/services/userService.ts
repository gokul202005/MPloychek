import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../repositories/xml/userRepository';
import { AuditService } from './auditService';
import { User, SafeUser } from '../types';

export class UserService {
  private userRepo: UserRepository;
  private auditService: AuditService;

  constructor() {
    this.userRepo = new UserRepository();
    this.auditService = new AuditService();
  }

  async getUsers(
    currentUser: SafeUser,
    params: { search?: string; role?: string; status?: string; page?: number; limit?: number }
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new Error('Access denied: Administrator privileges required.');
    }

    const allUsers = await this.userRepo.getAll();
    let users = allUsers.filter(u => u.organizationId === currentUser.organizationId);

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      users = users.filter(
        u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q) ||
          u.title.toLowerCase().includes(q)
      );
    }

    if (params.role) {
      users = users.filter(u => u.role === params.role);
    }

    if (params.status) {
      users = users.filter(u => u.status === params.status);
    }

    // Sort by createdAt desc
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = users.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = users.slice(startIndex, startIndex + limit).map(u => this.userRepo.toSafeUser(u));

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  async getUserById(id: string, currentUser: SafeUser): Promise<SafeUser | null> {
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
      throw new Error('Access denied: You cannot view other users.');
    }
    const user = await this.userRepo.getById(id);
    if (!user) return null;
    return this.userRepo.toSafeUser(user);
  }

  async createUser(
    data: any,
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<SafeUser> {
    if (currentUser.role !== 'ADMIN') {
      throw new Error('Access denied: Only Administrators can create user accounts.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser: User = {
      id: `user-${uuidv4().substring(0, 8)}`,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role || 'USER',
      organizationId: currentUser.organizationId,
      status: 'ACTIVE',
      department: data.department,
      title: data.title,
      phone: data.phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await this.userRepo.create(newUser);

    await this.auditService.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      organizationId: currentUser.organizationId,
      actionType: 'ADMIN_USER_CREATE',
      entityType: 'USER',
      entityId: saved.id,
      outcome: 'SUCCESS',
      requestId: reqMeta.requestId,
      ip: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      metadata: { email: saved.email, role: saved.role }
    });

    return this.userRepo.toSafeUser(saved);
  }

  async updateUser(
    id: string,
    updates: Partial<User>,
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<SafeUser> {
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
      throw new Error('Access denied.');
    }

    // Role modification is admin only
    if (updates.role && currentUser.role !== 'ADMIN') {
      throw new Error('Access denied: Only Administrators can change roles.');
    }

    const targetUser = await this.userRepo.getById(id);
    if (!targetUser) throw new Error('User not found.');

    // Protect last active administrator from role downgrade
    if (targetUser.role === 'ADMIN' && updates.role === 'USER') {
      const activeAdmins = await this.userRepo.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new Error('SECURITY SAFEGUARD: Cannot downgrade the last active Administrator account.');
      }
    }

    delete updates.passwordHash; // Never allow updating passwordHash via this endpoint

    const updated = await this.userRepo.update(id, updates);
    if (!updated) throw new Error('Failed to update user.');

    await this.auditService.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      organizationId: currentUser.organizationId,
      actionType: 'ADMIN_USER_UPDATE',
      entityType: 'USER',
      entityId: id,
      outcome: 'SUCCESS',
      requestId: reqMeta.requestId,
      ip: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      metadata: { changedFields: Object.keys(updates) }
    });

    return this.userRepo.toSafeUser(updated);
  }

  async updateUserStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
    reason: string,
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<SafeUser> {
    if (currentUser.role !== 'ADMIN') {
      throw new Error('Access denied: Only Administrators can change account activation status.');
    }

    const targetUser = await this.userRepo.getById(id);
    if (!targetUser) throw new Error('User not found.');

    // Safeguard: Protect last active administrator from deactivation
    if (targetUser.role === 'ADMIN' && status === 'INACTIVE') {
      const activeAdmins = await this.userRepo.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new Error('SECURITY SAFEGUARD: Cannot deactivate the last active Administrator account.');
      }
    }

    const updated = await this.userRepo.update(id, { status });
    if (!updated) throw new Error('Failed to change user status.');

    await this.auditService.logEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      organizationId: currentUser.organizationId,
      actionType: status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'USER',
      entityId: id,
      outcome: 'SUCCESS',
      requestId: reqMeta.requestId,
      ip: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      reason
    });

    return this.userRepo.toSafeUser(updated);
  }

  async deleteUser(
    id: string,
    currentUser: SafeUser,
    reqMeta: { ip: string; userAgent: string; requestId: string }
  ): Promise<boolean> {
    if (currentUser.role !== 'ADMIN') {
      throw new Error('Access denied: Only Administrators can delete accounts.');
    }

    const success = await this.userRepo.delete(id);
    if (success) {
      await this.auditService.logEvent({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        organizationId: currentUser.organizationId,
        actionType: 'ADMIN_USER_DELETE',
        entityType: 'USER',
        entityId: id,
        outcome: 'SUCCESS',
        requestId: reqMeta.requestId,
        ip: reqMeta.ip,
        userAgent: reqMeta.userAgent
      });
    }
    return success;
  }
}
