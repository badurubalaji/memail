import { Injectable, ErrorHandler } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {

  constructor(
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  handleError(error: any): void {
    console.error('Global error handler caught an error:', error);

    // Handle different types of errors
    if (error?.status === 401) {
      this.handleAuthError();
    } else if (error?.status === 403) {
      this.handleForbiddenError();
    } else if (error?.status === 404) {
      this.handleNotFoundError();
    } else if (error?.status === 500) {
      this.handleServerError();
    } else if (error?.status === 0 || !navigator.onLine) {
      this.handleNetworkError();
    } else {
      this.handleUnknownError(error);
    }
  }

  private handleAuthError(): void {
    this.snackBar.open(
      'Your session has expired. Please log in again.',
      'Login',
      {
        duration: 5000,
        panelClass: ['error-snackbar']
      }
    ).onAction().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  private handleForbiddenError(): void {
    this.snackBar.open(
      'You do not have permission to perform this action.',
      'Close',
      {
        duration: 5000,
        panelClass: ['error-snackbar']
      }
    );
  }

  private handleNotFoundError(): void {
    this.snackBar.open(
      'The requested resource was not found.',
      'Close',
      {
        duration: 5000,
        panelClass: ['error-snackbar']
      }
    );
  }

  private handleServerError(): void {
    this.snackBar.open(
      'Server error occurred. Please try again later.',
      'Close',
      {
        duration: 5000,
        panelClass: ['error-snackbar']
      }
    );
  }

  private handleNetworkError(): void {
    this.snackBar.open(
      'Network connection error. Please check your internet connection.',
      'Retry',
      {
        duration: 10000,
        panelClass: ['error-snackbar']
      }
    ).onAction().subscribe(() => {
      window.location.reload();
    });
  }

  private handleUnknownError(error: any): void {
    let message = 'An unexpected error occurred.';

    if (error?.message) {
      message = error.message;
    } else if (error?.error?.message) {
      message = error.error.message;
    }

    this.snackBar.open(
      message,
      'Close',
      {
        duration: 5000,
        panelClass: ['error-snackbar']
      }
    );
  }
}