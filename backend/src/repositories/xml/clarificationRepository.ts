import { BaseXmlRepository } from './baseXmlRepository';
import { ClarificationRequest } from '../../types';

export class ClarificationRepository extends BaseXmlRepository<ClarificationRequest> {
  async getAll(): Promise<ClarificationRequest[]> {
    const data = await this.getFullData();
    return data.clarificationRequests;
  }

  async getById(id: string): Promise<ClarificationRequest | null> {
    const data = await this.getFullData();
    return data.clarificationRequests.find(c => c.id === id) || null;
  }

  async getByRecordId(recordId: string): Promise<ClarificationRequest[]> {
    const data = await this.getFullData();
    return data.clarificationRequests
      .filter(c => c.recordId === recordId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  async create(req: ClarificationRequest): Promise<ClarificationRequest> {
    const data = await this.getFullData();
    data.clarificationRequests.push(req);
    await this.saveFullData(data, `Create Clarification Request ${req.id} for Record ${req.recordId}`);
    return req;
  }

  async update(id: string, updates: Partial<ClarificationRequest>): Promise<ClarificationRequest | null> {
    const data = await this.getFullData();
    const index = data.clarificationRequests.findIndex(c => c.id === id);
    if (index === -1) return null;

    data.clarificationRequests[index] = {
      ...data.clarificationRequests[index],
      ...updates
    };
    await this.saveFullData(data, `Update Clarification Request ${id}`);
    return data.clarificationRequests[index];
  }

  async delete(id: string): Promise<boolean> {
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
