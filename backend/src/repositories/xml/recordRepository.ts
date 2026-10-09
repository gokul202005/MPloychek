import { BaseXmlRepository } from './baseXmlRepository';
import { EmploymentRecord, SafeEmploymentRecord, VerificationStatus, EmploymentType } from '../../types';

export interface RecordQueryParams {
  search?: string;
  status?: VerificationStatus;
  department?: string;
  organizationId?: string;
  employmentType?: EmploymentType;
  sortBy?: 'employeeName' | 'startDate' | 'createdAt' | 'confidenceScore' | 'verificationStatus';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  userRole?: 'ADMIN' | 'USER';
  userId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class RecordRepository extends BaseXmlRepository<EmploymentRecord> {
  async getAll(): Promise<EmploymentRecord[]> {
    const data = await this.getFullData();
    return data.employmentRecords;
  }

  async getById(id: string): Promise<EmploymentRecord | null> {
    const data = await this.getFullData();
    return data.employmentRecords.find(r => r.id === id) || null;
  }

  async query(params: RecordQueryParams): Promise<PaginatedResult<EmploymentRecord>> {
    const data = await this.getFullData();
    let records = [...data.employmentRecords];

    // Filter by organization if specified
    if (params.organizationId) {
      records = records.filter(r => r.organizationId === params.organizationId);
    }

    // Role-based visibility: If general user, restrict to records created by them or assigned to them
    if (params.userRole === 'USER' && params.userId) {
      records = records.filter(r => r.createdBy === params.userId || r.assignedReviewerId === params.userId);
    }

    // Text search (name or ID)
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      records = records.filter(
        r =>
          r.employeeName.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.jobTitle.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (params.status) {
      records = records.filter(r => r.verificationStatus === params.status);
    }

    // Department filter
    if (params.department) {
      records = records.filter(r => r.department.toLowerCase() === params.department?.toLowerCase());
    }

    // Employment type filter
    if (params.employmentType) {
      records = records.filter(r => r.employmentType === params.employmentType);
    }

    // Sorting
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    records.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (typeof valA === 'number') {
        return sortOrder === 'asc' ? valA - (valB || 0) : (valB || 0) - valA;
      }

      return 0;
    });

    const total = records.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = records.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(record: EmploymentRecord): Promise<EmploymentRecord> {
    const data = await this.getFullData();
    if (data.employmentRecords.some(r => r.id === record.id)) {
      throw new Error(`Record with ID ${record.id} already exists`);
    }
    data.employmentRecords.push(record);
    await this.saveFullData(data, `Create Employment Record ${record.id} (${record.employeeName})`);
    return record;
  }

  async update(id: string, updates: Partial<EmploymentRecord>): Promise<EmploymentRecord | null> {
    const data = await this.getFullData();
    const index = data.employmentRecords.findIndex(r => r.id === id);
    if (index === -1) return null;

    data.employmentRecords[index] = {
      ...data.employmentRecords[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.saveFullData(data, `Update Employment Record ${id}`);
    return data.employmentRecords[index];
  }

  async delete(id: string): Promise<boolean> {
    const data = await this.getFullData();
    const initialLen = data.employmentRecords.length;
    data.employmentRecords = data.employmentRecords.filter(r => r.id !== id);
    if (data.employmentRecords.length !== initialLen) {
      await this.saveFullData(data, `Delete Employment Record ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Strips confidential fields (compensationGrade, internalAssessmentNotes)
   * for General Users as required by Section 4 & 6.
   */
  toSafeRecord(record: EmploymentRecord): SafeEmploymentRecord {
    const { compensationGrade, internalAssessmentNotes, ...safe } = record;
    return safe;
  }
}
