import { BaseXmlRepository } from './baseXmlRepository';
import { EvidenceItem } from '../../types';

export class EvidenceRepository extends BaseXmlRepository<EvidenceItem> {
  async getAll(): Promise<EvidenceItem[]> {
    const data = await this.getFullData();
    return data.evidenceItems;
  }

  async getById(id: string): Promise<EvidenceItem | null> {
    const data = await this.getFullData();
    return data.evidenceItems.find(e => e.id === id) || null;
  }

  async getByRecordId(recordId: string): Promise<EvidenceItem[]> {
    const data = await this.getFullData();
    return data.evidenceItems.filter(e => e.recordId === recordId);
  }

  async create(evidence: EvidenceItem): Promise<EvidenceItem> {
    const data = await this.getFullData();
    if (data.evidenceItems.some(e => e.id === evidence.id)) {
      throw new Error(`Evidence with ID ${evidence.id} already exists`);
    }
    data.evidenceItems.push(evidence);
    await this.saveFullData(data, `Add Evidence ${evidence.id} for Record ${evidence.recordId}`);
    return evidence;
  }

  async update(id: string, updates: Partial<EvidenceItem>): Promise<EvidenceItem | null> {
    const data = await this.getFullData();
    const index = data.evidenceItems.findIndex(e => e.id === id);
    if (index === -1) return null;

    data.evidenceItems[index] = {
      ...data.evidenceItems[index],
      ...updates
    };
    await this.saveFullData(data, `Update Evidence ${id}`);
    return data.evidenceItems[index];
  }

  async delete(id: string): Promise<boolean> {
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
