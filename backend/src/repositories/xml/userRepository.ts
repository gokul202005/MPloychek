import { BaseXmlRepository } from './baseXmlRepository';
import { User, SafeUser } from '../../types';

export class UserRepository extends BaseXmlRepository<User> {
  async getAll(): Promise<User[]> {
    const data = await this.getFullData();
    return data.users;
  }

  async getById(id: string): Promise<User | null> {
    const data = await this.getFullData();
    return data.users.find(u => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await this.getFullData();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async create(user: User): Promise<User> {
    const data = await this.getFullData();
    if (data.users.some(u => u.id === user.id)) {
      throw new Error(`User with ID ${user.id} already exists`);
    }
    if (data.users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error(`User with email ${user.email} already exists`);
    }
    data.users.push(user);
    await this.saveFullData(data, `Create User ${user.id} (${user.email})`);
    return user;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const data = await this.getFullData();
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    data.users[index] = {
      ...data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveFullData(data, `Update User ${id}`);
    return data.users[index];
  }

  async delete(id: string): Promise<boolean> {
    const data = await this.getFullData();
    const user = data.users.find(u => u.id === id);
    if (!user) return false;

    // Safeguard: Do not delete last active administrator
    if (user.role === 'ADMIN' && user.status === 'ACTIVE') {
      const activeAdmins = data.users.filter(u => u.role === 'ADMIN' && u.status === 'ACTIVE');
      if (activeAdmins.length <= 1) {
        throw new Error('SECURITY SAFEGUARD: Cannot delete the last active Administrator account.');
      }
    }

    const initialLen = data.users.length;
    data.users = data.users.filter(u => u.id !== id);
    if (data.users.length !== initialLen) {
      await this.saveFullData(data, `Delete User ${id}`);
      return true;
    }
    return false;
  }

  async countActiveAdmins(): Promise<number> {
    const data = await this.getFullData();
    return data.users.filter(u => u.role === 'ADMIN' && u.status === 'ACTIVE').length;
  }

  toSafeUser(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
