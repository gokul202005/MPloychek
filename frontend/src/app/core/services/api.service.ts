import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: any): Observable<{ success: boolean; data: T }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<{ success: boolean; data: T }>(`${this.baseUrl}${path}`, {
      params: httpParams
    });
  }

  post<T>(path: string, body: any): Observable<{ success: boolean; message?: string; data: T }> {
    return this.http.post<{ success: boolean; message?: string; data: T }>(
      `${this.baseUrl}${path}`,
      body
    );
  }

  patch<T>(path: string, body: any): Observable<{ success: boolean; message?: string; data: T }> {
    return this.http.patch<{ success: boolean; message?: string; data: T }>(
      `${this.baseUrl}${path}`,
      body
    );
  }

  delete<T>(path: string): Observable<{ success: boolean; message?: string; data: T }> {
    return this.http.delete<{ success: boolean; message?: string; data: T }>(
      `${this.baseUrl}${path}`
    );
  }

  upload<T>(path: string, formData: FormData): Observable<{ success: boolean; message?: string; data: T }> {
    return this.http.post<{ success: boolean; message?: string; data: T }>(
      `${this.baseUrl}${path}`,
      formData
    );
  }

  getBlob(path: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${path}`, {
      responseType: 'blob'
    });
  }
}
