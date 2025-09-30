import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional Auth Error Interceptor that handles HTTP errors related to authentication.
 * Handles 401 Unauthorized responses and specific authentication error messages from server.
 * When authentication errors occur, it automatically logs out the user and redirects to the login page.
 * This provides a seamless user experience when JWT tokens become invalid due to server restarts or token expiration.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check for various authentication-related errors
      const isAuthError =
        error.status === 401 || // Unauthorized
        error.status === 403 || // Forbidden (token might be invalid)
        // Check for specific auth error messages from the backend
        (error.status === 500 && error.error?.message?.includes('not authenticated')) ||
        (error.status === 500 && error.error?.message?.includes('connection lost')) ||
        (error.status === 500 && error.error?.message?.includes('User not authenticated'));

      if (isAuthError) {
        const errorMessage = error.error?.message || 'Token may be invalid or expired';
        console.log(`Authentication error detected (${error.status}): ${errorMessage}. Logging out user.`);

        // Force logout without making API call (since we're already getting auth errors)
        authService.forceLogout();

        // Return a user-friendly error message
        return throwError(() => new Error('Your session has expired. Please log in again.'));
      }

      // For all other errors, just re-throw them to be handled by the component
      return throwError(() => error);
    })
  );
};