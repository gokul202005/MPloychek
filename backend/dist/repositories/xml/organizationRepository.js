"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationRepository = void 0;
const baseXmlRepository_1 = require("./baseXmlRepository");
class OrganizationRepository extends baseXmlRepository_1.BaseXmlRepository {
    async getAll() {
        const data = await this.getFullData();
        return data.organizations;
    }
    async getById(id) {
        const data = await this.getFullData();
        return data.organizations.find(o => o.id === id) || null;
    }
    async create(org) {
        const data = await this.getFullData();
        const existing = data.organizations.find(o => o.id === org.id);
        if (existing) {
            throw new Error(`Organization with ID ${org.id} already exists`);
        }
        data.organizations.push(org);
        await this.saveFullData(data, `Create Organization ${org.id}`);
        return org;
    }
    async update(id, updates) {
        const data = await this.getFullData();
        const index = data.organizations.findIndex(o => o.id === id);
        if (index === -1)
            return null;
        data.organizations[index] = {
            ...data.organizations[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await this.saveFullData(data, `Update Organization ${id}`);
        return data.organizations[index];
    }
    async delete(id) {
        const data = await this.getFullData();
        const initialLen = data.organizations.length;
        data.organizations = data.organizations.filter(o => o.id !== id);
        if (data.organizations.length !== initialLen) {
            await this.saveFullData(data, `Delete Organization ${id}`);
            return true;
        }
        return false;
    }
}
exports.OrganizationRepository = OrganizationRepository;
