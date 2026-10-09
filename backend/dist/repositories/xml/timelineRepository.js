"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineRepository = void 0;
const baseXmlRepository_1 = require("./baseXmlRepository");
class TimelineRepository extends baseXmlRepository_1.BaseXmlRepository {
    async getAll() {
        const data = await this.getFullData();
        return data.verificationEvents;
    }
    async getById(id) {
        const data = await this.getFullData();
        return data.verificationEvents.find(ev => ev.id === id) || null;
    }
    async getByRecordId(recordId) {
        const data = await this.getFullData();
        return data.verificationEvents
            .filter(ev => ev.recordId === recordId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    async create(event) {
        const data = await this.getFullData();
        data.verificationEvents.push(event);
        await this.saveFullData(data, `Add Timeline Event ${event.eventType} for Record ${event.recordId}`);
        return event;
    }
    async update(id, updates) {
        const data = await this.getFullData();
        const index = data.verificationEvents.findIndex(ev => ev.id === id);
        if (index === -1)
            return null;
        data.verificationEvents[index] = {
            ...data.verificationEvents[index],
            ...updates
        };
        await this.saveFullData(data, `Update Timeline Event ${id}`);
        return data.verificationEvents[index];
    }
    async delete(id) {
        const data = await this.getFullData();
        const initialLen = data.verificationEvents.length;
        data.verificationEvents = data.verificationEvents.filter(ev => ev.id !== id);
        if (data.verificationEvents.length !== initialLen) {
            await this.saveFullData(data, `Delete Timeline Event ${id}`);
            return true;
        }
        return false;
    }
}
exports.TimelineRepository = TimelineRepository;
