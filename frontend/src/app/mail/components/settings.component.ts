import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserPreferences } from '../../shared/models/user-preferences.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1><mat-icon>settings</mat-icon> Settings</h1>
        <p>Customize your email experience</p>
      </div>

      <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()">
        <!-- Appearance Settings -->
        <mat-card class="settings-section">
          <mat-card-header>
            <mat-card-title>Appearance</mat-card-title>
            <mat-card-subtitle>Customize the look and feel</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Theme</mat-label>
                <mat-select formControlName="theme">
                  <mat-option value="light">Light</mat-option>
                  <mat-option value="dark">Dark</mat-option>
                  <mat-option value="auto">Auto (System)</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row toggle-row">
              <mat-slide-toggle formControlName="compactView">
                Compact view
              </mat-slide-toggle>
              <span class="toggle-description">Display more items in less space</span>
            </div>

            <div class="form-row toggle-row">
              <mat-slide-toggle formControlName="previewPane">
                Preview pane
              </mat-slide-toggle>
              <span class="toggle-description">Show email preview in list view</span>
            </div>

            <div class="form-row toggle-row">
              <mat-slide-toggle formControlName="conversationView">
                Conversation view
              </mat-slide-toggle>
              <span class="toggle-description">Group related emails together</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Email Behavior -->
        <mat-card class="settings-section">
          <mat-card-header>
            <mat-card-title>Email Behavior</mat-card-title>
            <mat-card-subtitle>Configure how emails are handled</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Emails per page</mat-label>
                <mat-select formControlName="emailsPerPage">
                  <mat-option value="25">25</mat-option>
                  <mat-option value="50">50</mat-option>
                  <mat-option value="100">100</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row toggle-row">
              <mat-slide-toggle formControlName="autoMarkRead">
                Auto mark as read
              </mat-slide-toggle>
              <span class="toggle-description">Automatically mark emails as read when opened</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Notifications -->
        <mat-card class="settings-section">
          <mat-card-header>
            <mat-card-title>Notifications</mat-card-title>
            <mat-card-subtitle>Manage notification preferences</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row toggle-row">
              <mat-slide-toggle formControlName="desktopNotifications">
                Desktop notifications
              </mat-slide-toggle>
              <span class="toggle-description">Show system notifications for new emails</span>
            </div>

            <div class="form-row toggle-row">
              <mat-slide-toggle formControlName="notificationSound">
                Notification sound
              </mat-slide-toggle>
              <span class="toggle-description">Play sound when receiving new emails</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Language and Region -->
        <mat-card class="settings-section">
          <mat-card-header>
            <mat-card-title>Language & Region</mat-card-title>
            <mat-card-subtitle>Localization settings</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Language</mat-label>
                <mat-select formControlName="language">
                  <mat-option value="en">English</mat-option>
                  <mat-option value="es">Español</mat-option>
                  <mat-option value="fr">Français</mat-option>
                  <mat-option value="de">Deutsch</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Timezone</mat-label>
                <mat-select formControlName="timezone">
                  <mat-option value="UTC">UTC</mat-option>
                  <mat-option value="America/New_York">Eastern Time</mat-option>
                  <mat-option value="America/Chicago">Central Time</mat-option>
                  <mat-option value="America/Denver">Mountain Time</mat-option>
                  <mat-option value="America/Los_Angeles">Pacific Time</mat-option>
                  <mat-option value="Europe/London">London</mat-option>
                  <mat-option value="Europe/Paris">Paris</mat-option>
                  <mat-option value="Asia/Tokyo">Tokyo</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Save Button -->
        <div class="settings-actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="!settingsForm.dirty || isLoading">
            <mat-icon>save</mat-icon>
            {{ isLoading ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }

    .settings-header {
      margin-bottom: 32px;
    }

    .settings-header h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 400;
      color: #202124;
    }

    .settings-header p {
      margin: 0;
      color: #5f6368;
      font-size: 16px;
    }

    .settings-section {
      margin-bottom: 24px;
    }

    .settings-section mat-card-header {
      margin-bottom: 16px;
    }

    .form-row {
      margin-bottom: 16px;
    }

    .form-row mat-form-field {
      width: 100%;
      max-width: 300px;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .toggle-description {
      color: #5f6368;
      font-size: 14px;
      margin-left: 16px;
      flex: 1;
    }

    .settings-actions {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #dadce0;
    }

    .settings-actions button {
      min-width: 150px;
    }

    @media (max-width: 768px) {
      .settings-container {
        padding: 16px;
      }

      .toggle-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .toggle-description {
        margin-left: 0;
      }

      .form-row mat-form-field {
        max-width: none;
      }
    }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {
  settingsForm!: FormGroup;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userPreferencesService: UserPreferencesService,
    private authService: AuthService,
    private themeService: ThemeService,
    private snackBar: MatSnackBar
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadUserPreferences();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    this.settingsForm = this.fb.group({
      theme: ['light'],
      emailsPerPage: [50],
      conversationView: [true],
      autoMarkRead: [true],
      notificationSound: [true],
      desktopNotifications: [true],
      compactView: [false],
      previewPane: [true],
      language: ['en'],
      timezone: ['UTC']
    });
  }

  private loadUserPreferences(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.email) {
      this.userPreferencesService.loadUserPreferences(currentUser.email)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (preferences: UserPreferences) => {
            this.settingsForm.patchValue(preferences);
            this.settingsForm.markAsPristine();
          },
          error: (error) => {
            console.error('Error loading preferences:', error);
            this.snackBar.open('Failed to load preferences', 'Close', { duration: 3000 });
          }
        });
    }
  }

  private setupAutoSave(): void {
    this.settingsForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(1000)
      )
      .subscribe((formValue) => {
        if (this.settingsForm.dirty) {
          // Handle theme changes immediately
          if (this.settingsForm.get('theme')?.dirty) {
            this.themeService.setTheme(formValue.theme);
          }
          this.saveSettings(false);
        }
      });
  }

  saveSettings(showMessage: boolean = true): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.email) {
      this.snackBar.open('User not authenticated', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const preferences: UserPreferences = {
      ...this.settingsForm.value,
      userEmail: currentUser.email
    };

    this.userPreferencesService.updateUserPreferences(currentUser.email, preferences)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.settingsForm.markAsPristine();
          if (showMessage) {
            this.snackBar.open('Settings saved successfully', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving preferences:', error);
          this.snackBar.open('Failed to save settings', 'Close', { duration: 3000 });
        }
      });
  }
}