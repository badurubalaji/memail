import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="reset-password-container">
      <mat-card class="reset-password-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>vpn_key</mat-icon>
            Reset Password
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div *ngIf="!success && !invalidToken" class="form-container">
            <p class="instruction-text">
              Enter your new password below.
            </p>

            <form #resetForm="ngForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input
                  matInput
                  [type]="hidePassword ? 'password' : 'text'"
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
                  (click)="hidePassword = !hidePassword"
                  type="button"
                  [disabled]="loading"
                >
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm Password</mat-label>
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

              <button
                mat-raised-button
                color="primary"
                type="submit"
                class="full-width submit-button"
                [disabled]="loading || !resetForm.valid || passwordMismatch"
              >
                <mat-spinner *ngIf="loading" diameter="20" class="button-spinner"></mat-spinner>
                <span *ngIf="!loading">Reset Password</span>
              </button>
            </form>
          </div>

          <div *ngIf="success" class="success-message">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h3>Password Reset Successful</h3>
            <p>
              Your password has been reset successfully.
              You can now log in with your new password.
            </p>
            <button
              mat-raised-button
              color="primary"
              routerLink="/login"
              class="full-width"
            >
              Go to Login
            </button>
          </div>

          <div *ngIf="invalidToken" class="error-container">
            <mat-icon class="error-icon">error</mat-icon>
            <h3>Invalid or Expired Link</h3>
            <p>
              This password reset link is invalid or has expired.
              Please request a new password reset link.
            </p>
            <button
              mat-raised-button
              color="primary"
              routerLink="/forgot-password"
              class="full-width"
            >
              Request New Link
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reset-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .reset-password-card {
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

    .form-container {
      padding: 10px 0;
    }

    .instruction-text {
      color: #666;
      margin-bottom: 24px;
      text-align: center;
      line-height: 1.5;
    }

    .full-width {
      width: 100%;
    }

    .submit-button {
      margin-top: 16px;
      height: 48px;
      font-size: 16px;
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
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      margin-top: 16px;
      font-size: 14px;
    }

    .password-requirements p {
      margin: 0 0 8px 0;
      color: #666;
    }

    .password-requirements ul {
      margin: 0;
      padding-left: 20px;
      color: #666;
    }

    .password-requirements li {
      margin: 4px 0;
    }

    .success-message, .error-container {
      text-align: center;
      padding: 20px;
    }

    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
      margin-bottom: 16px;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .success-message h3, .error-container h3 {
      margin: 0 0 16px 0;
      color: #333;
    }

    .success-message p, .error-container p {
      color: #666;
      margin-bottom: 24px;
      line-height: 1.6;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  loading: boolean = false;
  error: string = '';
  success: boolean = false;
  invalidToken: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get token from query parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.invalidToken = true;
      }
    });
  }

  get passwordMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.newPassword !== this.confirmPassword;
  }

  onSubmit(): void {
    if (!this.newPassword || !this.confirmPassword || this.passwordMismatch) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.confirmPasswordReset(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 400) {
          this.error = error.error?.message || 'Invalid or expired reset token';
          if (this.error.includes('expired') || this.error.includes('Invalid')) {
            this.invalidToken = true;
          }
        } else {
          this.error = 'Failed to reset password. Please try again.';
        }
      }
    });
  }
}
