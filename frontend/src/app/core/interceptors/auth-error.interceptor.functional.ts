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
      // Don't logout for network errors (offline support)
      if (error.status === 0 || !navigator.onLine) {
        console.log('Network error detected - offline mode. Not logging out.');
        return throwError(() => error);
      }

      // Only force logout on auth endpoint failures (login/logout)
      // This prevents forced logout when server restarts or during normal API errors
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/logout');

      // Check for critical authentication errors
      const isCriticalAuthError =
        (error.status === 401 && isAuthEndpoint) || // Login failed
        // Check for specific auth error messages from the backend
        (error.status === 500 && error.error?.message?.includes('User not authenticated'));

      if (isCriticalAuthError) {
        const errorMessage = error.error?.message || 'Authentication failed';
        console.log(`Critical authentication error detected (${error.status}): ${errorMessage}. Logging out user.`);

        // Force logout without making API call (since we're already getting auth errors)
        authService.forceLogout();

        // Return a user-friendly error message
        return throwError(() => new Error('Your session has expired. Please log in again.'));
      }

      // For 401 errors on regular API endpoints, just log and let the component handle it
      // Don't force logout - this allows offline mode and graceful handling of server restarts
      if (error.status === 401 && !isAuthEndpoint) {
        console.log('API returned 401 - token may be invalid. Consider re-authenticating.');
      }

      // For all other errors, just re-throw them to be handled by the component
      return throwError(() => error);
    })
  );
};