import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';
import { ApiService } from '../services/api.service';
import { User } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'mploychek_jwt_token';
  private readonly USER_KEY = 'mploychek_user';

  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(this.getStoredToken());

  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  login(email: string, pass: string) {
    return this.api.post<{ token: string; user: User }>('/auth/login', { email, password: pass }).pipe(
      tap(res => {
        if (res.data) {
          this.setSession(res.data.token, res.data.user);
        }
      })
    );
  }

  register(payload: {
    name: string;
    email: string;
    password: string;
    department: string;
    title: string;
    phone?: string;
  }) {
    return this.api.post<{ token: string; user: User }>('/auth/register', payload).pipe(
      tap(res => {
        if (res.data) {
          this.setSession(res.data.token, res.data.user);
        }
      })
    );
  }

  fetchMe() {
    return this.api.get<User>('/auth/me').pipe(
      tap(res => {
        if (res.data) {
          this.currentUser.set(res.data);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
        }
      }),
      catchError(err => {
        this.clearSession();
        return of(null);
      })
    );
  }

  logout() {
    this.api.post('/auth/logout', {}).subscribe({
      next: () => {},
      error: () => {}
    });
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private setSession(token: string, user: User) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  private clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }
}
