import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserPreferences, DEFAULT_PREFERENCES } from '../../shared/models/user-preferences.models';

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private readonly baseUrl = `${environment.apiUrl}/preferences`;
  private preferencesSubject = new BehaviorSubject<UserPreferences>(DEFAULT_PREFERENCES);

  public preferences$ = this.preferencesSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadUserPreferences(userEmail: string): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.baseUrl}/${encodeURIComponent(userEmail)}`)
      .pipe(
        tap(preferences => {
          this.preferencesSubject.next(preferences);
        })
      );
  }

  updateUserPreferences(userEmail: string, preferences: UserPreferences): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${this.baseUrl}/${encodeURIComponent(userEmail)}`, preferences)
      .pipe(
        tap(updatedPreferences => {
          this.preferencesSubject.next(updatedPreferences);
        })
      );
  }

  getCurrentPreferences(): UserPreferences {
    return this.preferencesSubject.value;
  }

  // Theme-specific methods
  getTheme(): string {
    return this.getCurrentPreferences().theme;
  }

  setTheme(theme: 'light' | 'dark' | 'auto'): Observable<UserPreferences> {
    const currentPrefs = this.getCurrentPreferences();
    const updatedPrefs = { ...currentPrefs, theme };
    return this.updateUserPreferences(currentPrefs.userEmail, updatedPrefs);
  }

  // Auto mark read methods
  getAutoMarkRead(): boolean {
    return this.getCurrentPreferences().autoMarkRead;
  }

  setAutoMarkRead(autoMarkRead: boolean): Observable<UserPreferences> {
    const currentPrefs = this.getCurrentPreferences();
    const updatedPrefs = { ...currentPrefs, autoMarkRead };
    return this.updateUserPreferences(currentPrefs.userEmail, updatedPrefs);
  }

  // Notification methods
  getDesktopNotifications(): boolean {
    return this.getCurrentPreferences().desktopNotifications;
  }

  setDesktopNotifications(desktopNotifications: boolean): Observable<UserPreferences> {
    const currentPrefs = this.getCurrentPreferences();
    const updatedPrefs = { ...currentPrefs, desktopNotifications };
    return this.updateUserPreferences(currentPrefs.userEmail, updatedPrefs);
  }

  getNotificationSound(): boolean {
    return this.getCurrentPreferences().notificationSound;
  }

  setNotificationSound(notificationSound: boolean): Observable<UserPreferences> {
    const currentPrefs = this.getCurrentPreferences();
    const updatedPrefs = { ...currentPrefs, notificationSound };
    return this.updateUserPreferences(currentPrefs.userEmail, updatedPrefs);
  }

  // View preferences
  getCompactView(): boolean {
    return this.getCurrentPreferences().compactView;
  }

  setCompactView(compactView: boolean): Observable<UserPreferences> {
    const currentPrefs = this.getCurrentPreferences();
    const updatedPrefs = { ...currentPrefs, compactView };
    return this.updateUserPreferences(currentPrefs.userEmail, updatedPrefs);
  }

  getPreviewPane(): boolean {
    return this.getCurrentPreferences().previewPane;
  }

  setPreviewPane(previewPane: boolean): Observable<UserPreferences> {
    const currentPrefs = this.getCurrentPreferences();
    const updatedPrefs = { ...currentPrefs, previewPane };
    return this.updateUserPreferences(currentPrefs.userEmail, updatedPrefs);
  }

  // Pagination
  getEmailsPerPage(): number {
    return this.getCurrentPreferences().emailsPerPage;
  }

  setEmailsPerPage(emailsPerPage: number): Observable<UserPreferences> {
    const currentPrefs = this.getCurrentPreferences();
    const updatedPrefs = { ...currentPrefs, emailsPerPage };
    return this.updateUserPreferences(currentPrefs.userEmail, updatedPrefs);
  }
}