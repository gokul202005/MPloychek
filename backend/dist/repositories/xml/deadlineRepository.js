"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadlineRepository = void 0;
const baseXmlRepository_1 = require("./baseXmlRepository");
class DeadlineRepository extends baseXmlRepository_1.BaseXmlRepository {
    async getAll() {
        const data = await this.getFullData();
        return data.complianceDeadlines;
    }
    async getById(id) {
        const data = await this.getFullData();
        return data.complianceDeadlines.find(d => d.id === id) || null;
    }
    async getByRecordId(recordId) {
        const data = await this.getFullData();
        return data.complianceDeadlines.filter(d => d.recordId === recordId);
    }
    async getByOrganizationId(orgId) {
        const data = await this.getFullData();
        return data.complianceDeadlines.filter(d => d.organizationId === orgId);
    }
    async create(deadline) {
        const data = await this.getFullData();
        data.complianceDeadlines.push(deadline);
        await this.saveFullData(data, `Create Deadline ${deadline.id} (${deadline.title})`);
        return deadline;
    }
    async update(id, updates) {
        const data = await this.getFullData();
        const index = data.complianceDeadlines.findIndex(d => d.id === id);
        if (index === -1)
            return null;
        data.complianceDeadlines[index] = {
            ...data.complianceDeadlines[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await this.saveFullData(data, `Update Deadline ${id}`);
        return data.complianceDeadlines[index];
    }
    async delete(id) {
        const data = await this.getFullData();
        const initialLen = data.complianceDeadlines.length;
        data.complianceDeadlines = data.complianceDeadlines.filter(d => d.id !== id);
        if (data.complianceDeadlines.length !== initialLen) {
            await this.saveFullData(data, `Delete Deadline ${id}`);
            return true;
        }
        return false;
    }
}
exports.DeadlineRepository = DeadlineRepository;
