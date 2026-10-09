import { BaseXmlRepository } from './baseXmlRepository';
import { Organization } from '../../types';

export class OrganizationRepository extends BaseXmlRepository<Organization> {
  async getAll(): Promise<Organization[]> {
    const data = await this.getFullData();
    return data.organizations;
  }

  async getById(id: string): Promise<Organization | null> {
    const data = await this.getFullData();
    return data.organizations.find(o => o.id === id) || null;
  }

  async create(org: Organization): Promise<Organization> {
    const data = await this.getFullData();
    const existing = data.organizations.find(o => o.id === org.id);
    if (existing) {
      throw new Error(`Organization with ID ${org.id} already exists`);
    }
    data.organizations.push(org);
    await this.saveFullData(data, `Create Organization ${org.id}`);
    return org;
  }

  async update(id: string, updates: Partial<Organization>): Promise<Organization | null> {
    const data = await this.getFullData();
    const index = data.organizations.findIndex(o => o.id === id);
    if (index === -1) return null;

    data.organizations[index] = {
      ...data.organizations[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveFullData(data, `Update Organization ${id}`);
    return data.organizations[index];
  }

  async delete(id: string): Promise<boolean> {
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
