import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { User, PaginatedResponse } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class UserAdminService {
  constructor(private api: ApiService) {}

  getUsers(params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    return this.api.get<PaginatedResponse<User>>('/users', params);
  }

  getUserById(id: string) {
    return this.api.get<User>(`/users/${id}`);
  }

  createUser(payload: any) {
    return this.api.post<User>('/users', payload);
  }

  updateUser(id: string, updates: Partial<User>) {
    return this.api.patch<User>(`/users/${id}`, updates);
  }

  updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE', reason: string) {
    return this.api.patch<User>(`/users/${id}/status`, { status, reason });
  }

  deleteUser(id: string) {
    return this.api.delete<any>(`/users/${id}`);
  }
}
