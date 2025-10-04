import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User } from '../../shared/models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'memail_token';
  private readonly USER_KEY = 'memail_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (token && user && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      console.log('Auth initialized with stored token');
    } else {
      // Don't call logout() here - just clear local data silently
      // This prevents force logout on page refresh when token is missing/expired
      console.log('No valid auth token found - user will need to login');
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          const user: User = {
            email: response.email,
            displayName: response.email.split('@')[0]
          };
          this.setUser(user);
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      // Call backend logout endpoint
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
        complete: () => this.clearAuthData(),
        error: () => this.clearAuthData()
      });
    } else {
      this.clearAuthData();
    }
  }

  /**
   * Force logout without making API call.
   * Used when we receive 401 errors (token already invalid on server).
   */
  forceLogout(): void {
    console.log('Force logout triggered - clearing local auth data and redirecting');
    this.clearAuthData();
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}