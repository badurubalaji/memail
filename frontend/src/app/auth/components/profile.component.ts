import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { User } from '../../shared/models/auth.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="profile-container">
      <mat-card class="profile-card">
        <mat-card-header>
          <div class="header-content">
            <div class="avatar">
              <mat-icon>account_circle</mat-icon>
            </div>
            <div class="user-info">
              <h2>{{ getDisplayName() }}</h2>
              <p>{{ profile?.email }}</p>
            </div>
            <button
              mat-icon-button
              *ngIf="!isEditMode && !loading"
              (click)="toggleEditMode()"
              matTooltip="Edit Profile"
              class="edit-button"
            >
              <mat-icon>edit</mat-icon>
            </button>
          </div>
        </mat-card-header>

        <mat-divider></mat-divider>

        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading profile...</p>
          </div>

          <div *ngIf="!loading && !isEditMode">
            <!-- View Mode -->
            <h3>Personal Information</h3>
            <mat-list>
              <mat-list-item>
                <mat-icon matListItemIcon>person</mat-icon>
                <div matListItemTitle>First Name</div>
                <div matListItemLine>{{ profile?.firstName || 'Not set' }}</div>
              </mat-list-item>

              <mat-list-item>
                <mat-icon matListItemIcon>person</mat-icon>
                <div matListItemTitle>Last Name</div>
                <div matListItemLine>{{ profile?.lastName || 'Not set' }}</div>
              </mat-list-item>

              <mat-list-item>
                <mat-icon matListItemIcon>cake</mat-icon>
                <div matListItemTitle>Date of Birth</div>
                <div matListItemLine>{{ formatDate(profile?.dateOfBirth) || 'Not set' }}</div>
              </mat-list-item>

              <mat-list-item>
                <mat-icon matListItemIcon>wc</mat-icon>
                <div matListItemTitle>Gender</div>
                <div matListItemLine>{{ profile?.gender || 'Not set' }}</div>
              </mat-list-item>

              <mat-list-item>
                <mat-icon matListItemIcon>phone</mat-icon>
                <div matListItemTitle>Phone</div>
                <div matListItemLine>{{ profile?.phone || 'Not set' }}</div>
              </mat-list-item>

              <mat-list-item>
                <mat-icon matListItemIcon>alternate_email</mat-icon>
                <div matListItemTitle>Backup Email</div>
                <div matListItemLine>{{ profile?.backupEmail || 'Not set' }}</div>
              </mat-list-item>
            </mat-list>

            <mat-divider style="margin: 20px 0;"></mat-divider>

            <h3>Account Information</h3>
            <mat-list>
              <mat-list-item>
                <mat-icon matListItemIcon>email</mat-icon>
                <div matListItemTitle>Email</div>
                <div matListItemLine>{{ profile?.email }}</div>
              </mat-list-item>

              <mat-list-item>
                <mat-icon matListItemIcon>badge</mat-icon>
                <div matListItemTitle>Role</div>
                <div matListItemLine>
                  <span class="role-badge" [class.admin-badge]="isAdmin">
                    {{ profile?.role || 'USER' }}
                  </span>
                </div>
              </mat-list-item>
            </mat-list>

            <mat-divider style="margin: 20px 0;"></mat-divider>

            <h3>Security</h3>
            <div class="action-buttons">
              <button
                mat-raised-button
                color="primary"
                routerLink="/change-password"
                class="action-button"
              >
                <mat-icon>lock</mat-icon>
                Change Password
              </button>

              <button
                mat-raised-button
                (click)="logout()"
                class="action-button logout-button"
              >
                <mat-icon>logout</mat-icon>
                Logout
              </button>
            </div>

            <div *ngIf="isAdmin" class="admin-section">
              <mat-divider style="margin: 20px 0;"></mat-divider>
              <h3>Admin</h3>
              <button
                mat-raised-button
                color="accent"
                routerLink="/admin/users"
                class="action-button"
              >
                <mat-icon>admin_panel_settings</mat-icon>
                User Management
              </button>
            </div>
          </div>

          <div *ngIf="!loading && isEditMode" [formGroup]="profileForm">
            <!-- Edit Mode -->
            <h3>Edit Personal Information</h3>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" placeholder="Enter first name">
                <mat-icon matPrefix>person</mat-icon>
                <mat-error *ngIf="profileForm.get('firstName')?.hasError('maxlength')">
                  First name must not exceed 100 characters
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" placeholder="Enter last name">
                <mat-icon matPrefix>person</mat-icon>
                <mat-error *ngIf="profileForm.get('lastName')?.hasError('maxlength')">
                  Last name must not exceed 100 characters
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Date of Birth</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="dateOfBirth" placeholder="Select date of birth">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-icon matPrefix>cake</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Gender</mat-label>
                <mat-select formControlName="gender" placeholder="Select gender">
                  <mat-option value="Male">Male</mat-option>
                  <mat-option value="Female">Female</mat-option>
                  <mat-option value="Other">Other</mat-option>
                  <mat-option value="Prefer not to say">Prefer not to say</mat-option>
                </mat-select>
                <mat-icon matPrefix>wc</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" placeholder="Enter phone number">
                <mat-icon matPrefix>phone</mat-icon>
                <mat-error *ngIf="profileForm.get('phone')?.hasError('pattern')">
                  Phone must be 10-15 digits, optionally starting with +
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Backup Email</mat-label>
                <input matInput formControlName="backupEmail" type="email" placeholder="Enter backup email">
                <mat-icon matPrefix>alternate_email</mat-icon>
                <mat-error *ngIf="profileForm.get('backupEmail')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
                <mat-error *ngIf="profileForm.get('backupEmail')?.hasError('maxlength')">
                  Backup email must not exceed 255 characters
                </mat-error>
                <mat-error *ngIf="profileForm.get('backupEmail')?.hasError('sameAsEmail')">
                  Backup email cannot be the same as primary email
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button
                mat-raised-button
                color="primary"
                (click)="saveProfile()"
                [disabled]="saving || !profileForm.valid"
              >
                <mat-icon>save</mat-icon>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
              <button
                mat-raised-button
                (click)="cancelEdit()"
                [disabled]="saving"
              >
                <mat-icon>cancel</mat-icon>
                Cancel
              </button>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button
            mat-button
            routerLink="/mail/inbox"
          >
            <mat-icon>arrow_back</mat-icon>
            Back to Inbox
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: #f5f5f5;
    }

    .profile-card {
      max-width: 800px;
      width: 100%;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 20px;
      width: 100%;
      padding: 20px;
      position: relative;
    }

    .avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .avatar mat-icon {
      font-size: 60px;
      width: 60px;
      height: 60px;
      color: white;
    }

    .user-info {
      flex: 1;
    }

    .user-info h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .user-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .edit-button {
      position: absolute;
      top: 20px;
      right: 20px;
    }

    mat-card-content {
      padding: 20px;
    }

    mat-card-content h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 16px;
    }

    .loading-container p {
      color: #666;
      font-size: 14px;
    }

    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background: #e0e0e0;
      color: #666;
    }

    .admin-badge {
      background: #ff9800;
      color: white;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .form-grid mat-form-field {
      width: 100%;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-start;
      margin-top: 16px;
    }

    .form-actions button {
      gap: 8px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-button {
      justify-content: flex-start;
      gap: 10px;
    }

    .logout-button {
      background: #f44336;
      color: white;
    }

    .logout-button:hover {
      background: #d32f2f;
    }

    .admin-section {
      margin-top: 20px;
    }

    mat-card-actions {
      padding: 16px;
      display: flex;
      justify-content: flex-start;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-wrap: wrap;
      }

      .edit-button {
        position: static;
        margin-left: auto;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profile: UserProfile | null = null;
  isAdmin: boolean = false;
  isEditMode: boolean = false;
  loading: boolean = true;
  saving: boolean = false;
  profileForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadProfile();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.maxLength(100)]],
      lastName: ['', [Validators.maxLength(100)]],
      dateOfBirth: [null],
      gender: [''],
      phone: ['', [Validators.pattern(/^[+]?[0-9]{10,15}$/)]],
      backupEmail: ['', [Validators.email, Validators.maxLength(255)]]
    });
  }

  loadProfile(): void {
    this.loading = true;
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
        this.populateForm();
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private populateForm(): void {
    if (!this.profile) return;

    this.profileForm.patchValue({
      firstName: this.profile.firstName || '',
      lastName: this.profile.lastName || '',
      dateOfBirth: this.profile.dateOfBirth ? new Date(this.profile.dateOfBirth) : null,
      gender: this.profile.gender || '',
      phone: this.profile.phone || '',
      backupEmail: this.profile.backupEmail || ''
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.populateForm();
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.populateForm();
  }

  saveProfile(): void {
    if (!this.profileForm.valid) {
      this.snackBar.open('Please fix form errors', 'Close', { duration: 3000 });
      return;
    }

    // Check if backup email is same as primary email
    const backupEmail = this.profileForm.get('backupEmail')?.value;
    if (backupEmail && backupEmail.toLowerCase() === this.profile?.email.toLowerCase()) {
      this.snackBar.open('Backup email cannot be the same as primary email', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;
    const formValue = this.profileForm.value;

    // Convert date to string format (YYYY-MM-DD)
    const request: any = {
      firstName: formValue.firstName || null,
      lastName: formValue.lastName || null,
      dateOfBirth: formValue.dateOfBirth ? this.formatDateForBackend(formValue.dateOfBirth) : null,
      gender: formValue.gender || null,
      phone: formValue.phone || null,
      backupEmail: formValue.backupEmail || null
    };

    this.profileService.updateUserProfile(request).subscribe({
      next: (updatedProfile) => {
        this.profile = updatedProfile;
        this.saving = false;
        this.isEditMode = false;
        this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        const errorMessage = error.error?.message || 'Failed to update profile';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.saving = false;
      }
    });
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDisplayName(): string {
    if (this.profile?.firstName && this.profile?.lastName) {
      return `${this.profile.firstName} ${this.profile.lastName}`;
    } else if (this.profile?.firstName) {
      return this.profile.firstName;
    } else if (this.profile?.lastName) {
      return this.profile.lastName;
    }
    return this.profile?.email || 'User';
  }

  logout(): void {
    this.authService.logout();
  }
}
