import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  backupEmail: string | null;
  role: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  backupEmail?: string;
}

export interface UserAutocomplete {
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/api/profile`;

  constructor(private http: HttpClient) {}

  /**
   * Get current user's profile
   */
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl);
  }

  /**
   * Update current user's profile
   */
  updateUserProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.apiUrl, request);
  }

  /**
   * Get all users for autocomplete/mention functionality
   */
  getUsersForAutocomplete(): Observable<UserAutocomplete[]> {
    return this.http.get<UserAutocomplete[]>(`${this.apiUrl}/users/autocomplete`);
  }
}
