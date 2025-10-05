import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="change-password-container">
      <mat-card class="change-password-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>lock</mat-icon>
            Change Password
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form #changeForm="ngForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Current Password</mat-label>
              <input
                matInput
                [type]="hideCurrentPassword ? 'password' : 'text'"
                [(ngModel)]="currentPassword"
                name="currentPassword"
                required
                placeholder="Enter current password"
                [disabled]="loading"
              />
              <mat-icon matPrefix>lock_open</mat-icon>
              <button
                mat-icon-button
                matSuffix
                (click)="hideCurrentPassword = !hideCurrentPassword"
                type="button"
                [disabled]="loading"
              >
                <mat-icon>{{ hideCurrentPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New Password</mat-label>
              <input
                matInput
                [type]="hideNewPassword ? 'password' : 'text'"
                [(ngModel)]="newPassword"
                name="newPassword"
                required
                minlength="8"
                placeholder="Enter new password"
                [disabled]="loading"
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                (click)="hideNewPassword = !hideNewPassword"
                type="button"
                [disabled]="loading"
              >
                <mat-icon>{{ hideNewPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm New Password</mat-label>
              <input
                matInput
                [type]="hideConfirmPassword ? 'password' : 'text'"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                required
                placeholder="Confirm new password"
                [disabled]="loading"
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                (click)="hideConfirmPassword = !hideConfirmPassword"
                type="button"
                [disabled]="loading"
              >
                <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <div *ngIf="passwordMismatch" class="error-message">
              <mat-icon>error</mat-icon>
              Passwords do not match
            </div>

            <div *ngIf="error" class="error-message">
              <mat-icon>error</mat-icon>
              {{ error }}
            </div>

            <div class="password-requirements">
              <p><strong>Password must contain:</strong></p>
              <ul>
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
            </div>

            <div class="button-row">
              <button
                mat-button
                type="button"
                (click)="onCancel()"
                [disabled]="loading"
              >
                Cancel
              </button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="loading || !changeForm.valid || passwordMismatch"
              >
                <mat-spinner *ngIf="loading" diameter="20" class="button-spinner"></mat-spinner>
                <span *ngIf="!loading">Change Password</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .change-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: #f5f5f5;
    }

    .change-password-card {
      max-width: 500px;
      width: 100%;
      padding: 20px;
    }

    mat-card-header {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;
      font-weight: 500;
    }

    .full-width {
      width: 100%;
    }

    .button-row {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .button-spinner {
      display: inline-block;
      margin: 0 auto;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      background: #ffebee;
      padding: 12px;
      border-radius: 4px;
      margin-top: 16px;
      font-size: 14px;
    }

    .error-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .password-requirements {
      background: #e3f2fd;
      padding: 16px;
      border-radius: 4px;
      margin-top: 16px;
      font-size: 14px;
    }

    .password-requirements p {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-weight: 500;
    }

    .password-requirements ul {
      margin: 0;
      padding-left: 20px;
      color: #666;
    }

    .password-requirements li {
      margin: 4px 0;
    }
  `]
})
export class ChangePasswordComponent {
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  hideCurrentPassword: boolean = true;
  hideNewPassword: boolean = true;
  hideConfirmPassword: boolean = true;
  loading: boolean = false;
  error: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  get passwordMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.newPassword !== this.confirmPassword;
  }

  onSubmit(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword || this.passwordMismatch) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Password changed successfully! Please log in again.', 'OK', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        // Force logout and redirect to login
        setTimeout(() => {
          this.authService.forceLogout();
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 400) {
          this.error = error.error?.message || 'Invalid current password or password requirements not met';
        } else {
          this.error = 'Failed to change password. Please try again.';
        }
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/mail/inbox']);
  }
}
