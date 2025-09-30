import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthErrorInterceptor handles HTTP errors, specifically 401 Unauthorized responses.
 * When a 401 error occurs, it automatically logs out the user and redirects to the login page.
 * This provides a seamless user experience when JWT tokens become invalid due to server restarts or token expiration.
 */
@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Check if the error is a 401 Unauthorized
        if (error.status === 401) {
          console.log('401 Unauthorized detected. Token may be invalid or expired. Logging out user.');

          // Force logout without making API call (since we're already getting 401)
          this.authService.forceLogout();

          // Return a user-friendly error message
          return throwError(() => new Error('Your session has expired. Please log in again.'));
        }

        // For all other errors, just re-throw them to be handled by the component
        return throwError(() => error);
      })
    );
  }
}