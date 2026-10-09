"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceRepository = void 0;
const baseXmlRepository_1 = require("./baseXmlRepository");
class EvidenceRepository extends baseXmlRepository_1.BaseXmlRepository {
    async getAll() {
        const data = await this.getFullData();
        return data.evidenceItems;
    }
    async getById(id) {
        const data = await this.getFullData();
        return data.evidenceItems.find(e => e.id === id) || null;
    }
    async getByRecordId(recordId) {
        const data = await this.getFullData();
        return data.evidenceItems.filter(e => e.recordId === recordId);
    }
    async create(evidence) {
        const data = await this.getFullData();
        if (data.evidenceItems.some(e => e.id === evidence.id)) {
            throw new Error(`Evidence with ID ${evidence.id} already exists`);
        }
        data.evidenceItems.push(evidence);
        await this.saveFullData(data, `Add Evidence ${evidence.id} for Record ${evidence.recordId}`);
        return evidence;
    }
    async update(id, updates) {
        const data = await this.getFullData();
        const index = data.evidenceItems.findIndex(e => e.id === id);
        if (index === -1)
            return null;
        data.evidenceItems[index] = {
            ...data.evidenceItems[index],
            ...updates
        };
        await this.saveFullData(data, `Update Evidence ${id}`);
        return data.evidenceItems[index];
    }
    async delete(id) {
        const data = await this.getFullData();
        const initialLen = data.evidenceItems.length;
        data.evidenceItems = data.evidenceItems.filter(e => e.id !== id);
        if (data.evidenceItems.length !== initialLen) {
            await this.saveFullData(data, `Delete Evidence ${id}`);
            return true;
        }
        return false;
    }
}
exports.EvidenceRepository = EvidenceRepository;
