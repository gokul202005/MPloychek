"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClarificationRepository = void 0;
const baseXmlRepository_1 = require("./baseXmlRepository");
class ClarificationRepository extends baseXmlRepository_1.BaseXmlRepository {
    async getAll() {
        const data = await this.getFullData();
        return data.clarificationRequests;
    }
    async getById(id) {
        const data = await this.getFullData();
        return data.clarificationRequests.find(c => c.id === id) || null;
    }
    async getByRecordId(recordId) {
        const data = await this.getFullData();
        return data.clarificationRequests
            .filter(c => c.recordId === recordId)
            .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    }
    async create(req) {
        const data = await this.getFullData();
        data.clarificationRequests.push(req);
        await this.saveFullData(data, `Create Clarification Request ${req.id} for Record ${req.recordId}`);
        return req;
    }
    async update(id, updates) {
        const data = await this.getFullData();
        const index = data.clarificationRequests.findIndex(c => c.id === id);
        if (index === -1)
            return null;
        data.clarificationRequests[index] = {
            ...data.clarificationRequests[index],
            ...updates
        };
        await this.saveFullData(data, `Update Clarification Request ${id}`);
        return data.clarificationRequests[index];
    }
    async delete(id) {
        const data = await this.getFullData();
        const initialLen = data.clarificationRequests.length;
        data.clarificationRequests = data.clarificationRequests.filter(c => c.id !== id);
        if (data.clarificationRequests.length !== initialLen) {
            await this.saveFullData(data, `Delete Clarification Request ${id}`);
            return true;
        }
        return false;
    }
}
exports.ClarificationRepository = ClarificationRepository;
