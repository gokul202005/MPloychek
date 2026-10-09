import { BaseXmlRepository } from './baseXmlRepository';
import { VerificationEvent } from '../../types';

export class TimelineRepository extends BaseXmlRepository<VerificationEvent> {
  async getAll(): Promise<VerificationEvent[]> {
    const data = await this.getFullData();
    return data.verificationEvents;
  }

  async getById(id: string): Promise<VerificationEvent | null> {
    const data = await this.getFullData();
    return data.verificationEvents.find(ev => ev.id === id) || null;
  }

  async getByRecordId(recordId: string): Promise<VerificationEvent[]> {
    const data = await this.getFullData();
    return data.verificationEvents
      .filter(ev => ev.recordId === recordId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async create(event: VerificationEvent): Promise<VerificationEvent> {
    const data = await this.getFullData();
    data.verificationEvents.push(event);
    await this.saveFullData(data, `Add Timeline Event ${event.eventType} for Record ${event.recordId}`);
    return event;
  }

  async update(id: string, updates: Partial<VerificationEvent>): Promise<VerificationEvent | null> {
    const data = await this.getFullData();
    const index = data.verificationEvents.findIndex(ev => ev.id === id);
    if (index === -1) return null;

    data.verificationEvents[index] = {
      ...data.verificationEvents[index],
      ...updates
    };
    await this.saveFullData(data, `Update Timeline Event ${id}`);
    return data.verificationEvents[index];
  }

  async delete(id: string): Promise<boolean> {
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
