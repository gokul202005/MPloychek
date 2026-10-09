"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseXmlRepository = void 0;
const xmlStorageEngine_1 = require("./xmlStorageEngine");
class BaseXmlRepository {
    storage;
    constructor() {
        this.storage = xmlStorageEngine_1.XmlStorageEngine.getInstance();
    }
    async getFullData() {
        return this.storage.loadData();
    }
    async saveFullData(data, reason) {
        await this.storage.saveData(data, reason);
    }
}
exports.BaseXmlRepository = BaseXmlRepository;
