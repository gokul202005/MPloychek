import { XmlStorageEngine } from './xmlStorageEngine';
import { MploychekDataSchema } from '../../types';

export abstract class BaseXmlRepository<T extends { id: string }> {
  protected storage: XmlStorageEngine;

  constructor() {
    this.storage = XmlStorageEngine.getInstance();
  }

  protected async getFullData(): Promise<MploychekDataSchema> {
    return this.storage.loadData();
  }

  protected async saveFullData(data: MploychekDataSchema, reason: string): Promise<void> {
    await this.storage.saveData(data, reason);
  }

  abstract getAll(): Promise<T[]>;
  abstract getById(id: string): Promise<T | null>;
  abstract create(item: T): Promise<T>;
  abstract update(id: string, updates: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;
}
