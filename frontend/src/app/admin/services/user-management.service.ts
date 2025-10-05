import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  email: string;
  role: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastConnectionAt?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role?: string;
  enabled?: boolean;
}

export interface UpdateUserRequest {
  password?: string;
  role?: string;
  enabled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Get all users
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  /**
   * Create new user
   */
  createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, request);
  }

  /**
   * Update user
   */
  updateUser(id: number, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, request);
  }

  /**
   * Delete user
   */
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  /**
   * Enable user
   */
  enableUser(id: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/${id}/enable`, {});
  }

  /**
   * Disable user
   */
  disableUser(id: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/${id}/disable`, {});
  }
}
