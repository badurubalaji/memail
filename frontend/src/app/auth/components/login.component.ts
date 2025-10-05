import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../shared/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  template: `
    <div class="login-container">
      <div class="login-card-wrapper">
        <div class="branding-section">
          <div class="branding-content">
            <mat-icon class="brand-logo">mail</mat-icon>
            <h1 class="brand-name">Memail</h1>
            <p class="brand-tagline">Professional Email Management</p>
          </div>
        </div>

        <mat-card class="login-card">
          <mat-card-content>
            <div class="login-header">
              <h2>Welcome Back</h2>
              <p class="subtitle">Sign in to continue to your inbox</p>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
              <div class="error-message" *ngIf="errorMessage">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMessage }}</span>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email Address</mat-label>
                <input matInput
                       type="email"
                       formControlName="email"
                       placeholder="your.email@domain.com"
                       autocomplete="email">
                <mat-icon matPrefix>email</mat-icon>
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput
                       [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password"
                       placeholder="Enter your password"
                       autocomplete="current-password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix
                        type="button"
                        (click)="hidePassword = !hidePassword"
                        tabindex="-1">
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                  Password is required
                </mat-error>
              </mat-form-field>

              <div class="forgot-password-row">
                <a routerLink="/forgot-password" class="forgot-link">Forgot Password?</a>
              </div>

              <button mat-raised-button
                      color="primary"
                      type="submit"
                      class="full-width login-button"
                      [disabled]="loginForm.invalid || isLoading">
                <span *ngIf="!isLoading" class="button-content">
                  <mat-icon>login</mat-icon>
                  Sign In
                </span>
                <mat-spinner *ngIf="isLoading" diameter="20" class="button-spinner"></mat-spinner>
              </button>
            </form>

            <div class="login-footer">
              <mat-icon class="info-icon">info_outline</mat-icon>
              <span>Use your email credentials to sign in</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
      padding: 20px;
    }

    .login-card-wrapper {
      display: flex;
      width: 100%;
      max-width: 900px;
      min-height: 550px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      border-radius: 16px;
      overflow: hidden;
      background: white;
    }

    .branding-section {
      flex: 1;
      background: linear-gradient(135deg, #1976d2 0%, #1557b0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 40px;
      position: relative;
      overflow: hidden;
    }

    .branding-section::before {
      content: '';
      position: absolute;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 30px 30px;
      opacity: 0.3;
      animation: drift 30s linear infinite;
    }

    @keyframes drift {
      from {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      to {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }

    .branding-content {
      position: relative;
      text-align: center;
      color: white;
      z-index: 1;
    }

    .brand-logo {
      font-size: 80px;
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      display: block;
      color: white;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
    }

    .brand-name {
      font-size: 48px;
      font-weight: 700;
      margin: 0 0 12px 0;
      letter-spacing: 1px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .brand-tagline {
      font-size: 18px;
      margin: 0;
      opacity: 0.95;
      font-weight: 300;
      letter-spacing: 0.5px;
    }

    .login-card {
      flex: 1;
      box-shadow: none;
      border-radius: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px 50px;
    }

    .login-card mat-card-content {
      padding: 0;
    }

    .login-header {
      margin-bottom: 32px;
      text-align: center;
    }

    .login-header h2 {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #1a1a1a;
    }

    .login-header .subtitle {
      font-size: 15px;
      color: #666;
      margin: 0;
      font-weight: 400;
    }

    .login-form {
      margin-top: 24px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      font-size: 14px;
      border-left: 4px solid #c62828;
    }

    .error-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .forgot-password-row {
      text-align: right;
      margin-bottom: 24px;
      margin-top: -8px;
    }

    .forgot-link {
      color: #1976d2;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .forgot-link:hover {
      color: #1557b0;
      text-decoration: underline;
    }

    .login-button {
      height: 52px;
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #1976d2 0%, #1557b0 100%) !important;
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
      transition: all 0.3s ease;
    }

    .login-button:not([disabled]):hover {
      background: linear-gradient(135deg, #1557b0 0%, #104a8e 100%) !important;
      box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
      transform: translateY(-1px);
    }

    .login-button[disabled] {
      background: #dadce0 !important;
      opacity: 0.6;
    }

    .button-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .button-content mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .button-spinner {
      margin: 0 auto;
    }

    .login-footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #666;
      font-size: 13px;
    }

    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .login-card-wrapper {
        flex-direction: column;
        max-width: 100%;
        min-height: auto;
      }

      .branding-section {
        padding: 40px 20px;
        min-height: 200px;
      }

      .brand-logo {
        font-size: 60px;
        width: 60px;
        height: 60px;
      }

      .brand-name {
        font-size: 36px;
      }

      .brand-tagline {
        font-size: 16px;
      }

      .login-card {
        padding: 40px 24px;
      }

      .login-header h2 {
        font-size: 24px;
      }
    }

    @media (max-width: 480px) {
      .login-container {
        padding: 12px;
      }

      .login-card {
        padding: 32px 20px;
      }

      .branding-section {
        padding: 30px 16px;
        min-height: 150px;
      }

      .brand-logo {
        font-size: 50px;
        width: 50px;
        height: 50px;
      }

      .brand-name {
        font-size: 28px;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginRequest: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
          this.router.navigate(['/inbox']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login failed:', error);

          if (error.status === 401) {
            this.errorMessage = 'Invalid email or password. Please try again.';
          } else if (error.status === 0) {
            this.errorMessage = 'Unable to connect to server. Please check your connection.';
          } else {
            this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          }
        }
      });
    }
  }
}