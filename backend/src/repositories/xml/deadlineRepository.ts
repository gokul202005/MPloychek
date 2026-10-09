import { BaseXmlRepository } from './baseXmlRepository';
import { ComplianceDeadline } from '../../types';

export class DeadlineRepository extends BaseXmlRepository<ComplianceDeadline> {
  async getAll(): Promise<ComplianceDeadline[]> {
    const data = await this.getFullData();
    return data.complianceDeadlines;
  }

  async getById(id: string): Promise<ComplianceDeadline | null> {
    const data = await this.getFullData();
    return data.complianceDeadlines.find(d => d.id === id) || null;
  }

  async getByRecordId(recordId: string): Promise<ComplianceDeadline[]> {
    const data = await this.getFullData();
    return data.complianceDeadlines.filter(d => d.recordId === recordId);
  }

  async getByOrganizationId(orgId: string): Promise<ComplianceDeadline[]> {
    const data = await this.getFullData();
    return data.complianceDeadlines.filter(d => d.organizationId === orgId);
  }

  async create(deadline: ComplianceDeadline): Promise<ComplianceDeadline> {
    const data = await this.getFullData();
    data.complianceDeadlines.push(deadline);
    await this.saveFullData(data, `Create Deadline ${deadline.id} (${deadline.title})`);
    return deadline;
  }

  async update(id: string, updates: Partial<ComplianceDeadline>): Promise<ComplianceDeadline | null> {
    const data = await this.getFullData();
    const index = data.complianceDeadlines.findIndex(d => d.id === id);
    if (index === -1) return null;

    data.complianceDeadlines[index] = {
      ...data.complianceDeadlines[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveFullData(data, `Update Deadline ${id}`);
    return data.complianceDeadlines[index];
  }

  async delete(id: string): Promise<boolean> {
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
