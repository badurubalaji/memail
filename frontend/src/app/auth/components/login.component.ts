import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="logo-icon">email</mat-icon>
            Memail Login
          </mat-card-title>
          <mat-card-subtitle>Sign in to your email account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput
                     type="email"
                     formControlName="email"
                     placeholder="your.email@domain.com"
                     [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              <mat-icon matSuffix>email</mat-icon>
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
                     [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              <button mat-icon-button matSuffix
                      type="button"
                      (click)="hidePassword = !hidePassword">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage">
              <mat-icon>error</mat-icon>
              {{ errorMessage }}
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions class="login-actions">
          <button mat-raised-button
                  color="primary"
                  type="submit"
                  class="full-width login-button"
                  [disabled]="loginForm.invalid || isLoading"
                  (click)="onSubmit()">
            <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
            <span *ngIf="!isLoading">Sign In</span>
          </button>
        </mat-card-actions>

        <mat-card-footer class="login-footer">
          <p class="help-text">
            <mat-icon>info</mat-icon>
            Use your Apache James email credentials to sign in
          </p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }

    .logo-icon {
      margin-right: 8px;
      color: #1976d2;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .login-actions {
      padding: 16px;
    }

    .login-button {
      height: 48px;
      font-size: 16px;
    }

    .error-message {
      color: #f44336;
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .error-message mat-icon {
      margin-right: 8px;
      font-size: 20px;
    }

    .login-footer {
      padding: 16px;
      text-align: center;
    }

    .help-text {
      color: #666;
      font-size: 14px;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .help-text mat-icon {
      margin-right: 8px;
      font-size: 18px;
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