"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const baseXmlRepository_1 = require("./baseXmlRepository");
class UserRepository extends baseXmlRepository_1.BaseXmlRepository {
    async getAll() {
        const data = await this.getFullData();
        return data.users;
    }
    async getById(id) {
        const data = await this.getFullData();
        return data.users.find(u => u.id === id) || null;
    }
    async findByEmail(email) {
        const data = await this.getFullData();
        return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
    async create(user) {
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
    async update(id, updates) {
        const data = await this.getFullData();
        const index = data.users.findIndex(u => u.id === id);
        if (index === -1)
            return null;
        data.users[index] = {
            ...data.users[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await this.saveFullData(data, `Update User ${id}`);
        return data.users[index];
    }
    async delete(id) {
        const data = await this.getFullData();
        const user = data.users.find(u => u.id === id);
        if (!user)
            return false;
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
    async countActiveAdmins() {
        const data = await this.getFullData();
        return data.users.filter(u => u.role === 'ADMIN' && u.status === 'ACTIVE').length;
    }
    toSafeUser(user) {
        const { passwordHash, ...safe } = user;
        return safe;
    }
}
exports.UserRepository = UserRepository;
