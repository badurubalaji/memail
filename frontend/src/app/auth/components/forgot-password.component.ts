import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
    <div class="forgot-password-container">
      <mat-card class="forgot-password-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>lock_reset</mat-icon>
            Forgot Password
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div *ngIf="!submitted" class="form-container">
            <p class="instruction-text">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form #forgotForm="ngForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input
                  matInput
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  email
                  placeholder="your@email.com"
                  [disabled]="loading"
                />
                <mat-icon matPrefix>email</mat-icon>
              </mat-form-field>

              <div *ngIf="error" class="error-message">
                <mat-icon>error</mat-icon>
                {{ error }}
              </div>

              <button
                mat-raised-button
                color="primary"
                type="submit"
                class="full-width submit-button"
                [disabled]="loading || !forgotForm.valid"
              >
                <mat-spinner *ngIf="loading" diameter="20" class="button-spinner"></mat-spinner>
                <span *ngIf="!loading">Send Reset Link</span>
              </button>
            </form>

            <div class="back-to-login">
              <a routerLink="/login">
                <mat-icon>arrow_back</mat-icon>
                Back to Login
              </a>
            </div>
          </div>

          <div *ngIf="submitted" class="success-message">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h3>Check Your Email</h3>
            <p>
              If an account exists for <strong>{{ email }}</strong>,
              you will receive a password reset link shortly.
            </p>
            <p class="note">
              The link will expire in 30 minutes.
            </p>
            <button
              mat-raised-button
              color="primary"
              routerLink="/login"
              class="full-width"
            >
              Back to Login
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .forgot-password-card {
      max-width: 450px;
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

    .back-to-login {
      text-align: center;
      margin-top: 20px;
    }

    .back-to-login a {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #667eea;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }

    .back-to-login a:hover {
      color: #764ba2;
    }

    .success-message {
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

    .success-message h3 {
      margin: 0 0 16px 0;
      color: #333;
    }

    .success-message p {
      color: #666;
      margin-bottom: 12px;
      line-height: 1.6;
    }

    .success-message .note {
      font-size: 14px;
      color: #999;
      margin-bottom: 24px;
    }

    .success-message strong {
      color: #333;
    }
  `]
})
export class ForgotPasswordComponent {
  email: string = '';
  loading: boolean = false;
  error: string = '';
  submitted: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
      },
      error: (error) => {
        this.loading = false;
        // Don't show specific error to prevent email enumeration
        this.submitted = true;
      }
    });
  }
}
