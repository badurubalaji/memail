import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { authErrorInterceptor } from './auth-error.interceptor.functional';
import { AuthService } from '../services/auth.service';

describe('AuthErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['forceLogout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideHttpClient(
          withInterceptors([authErrorInterceptor])
        ),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Network Errors', () => {
    it('should not force logout on network error (status 0)', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(0);
          expect(authService.forceLogout).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'), { status: 0 });
    });

    it('should not force logout when offline', () => {
      // Mock navigator.onLine
      spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);

      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(authService.forceLogout).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'), { status: 0 });
    });
  });

  describe('Auth Endpoint Failures', () => {
    it('should force logout on 401 error from /auth/login', () => {
      httpClient.post('/auth/login', {}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('session has expired');
          expect(authService.forceLogout).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/auth/login');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should force logout on 401 error from /auth/logout', () => {
      httpClient.post('/auth/logout', {}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(authService.forceLogout).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/auth/logout');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should force logout on 500 error with "User not authenticated" message', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(authService.forceLogout).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(
        { message: 'User not authenticated' },
        { status: 500, statusText: 'Server Error' }
      );
    });
  });

  describe('Non-Auth Endpoint 401 Errors', () => {
    it('should NOT force logout on 401 from regular API endpoint', () => {
      httpClient.get('/api/emails').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(authService.forceLogout).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/emails');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should log warning but not force logout on API 401', () => {
      spyOn(console, 'log');

      httpClient.get('/api/emails').subscribe({
        next: () => fail('should have failed'),
        error: () => {
          expect(console.log).toHaveBeenCalledWith(
            jasmine.stringContaining('API returned 401')
          );
          expect(authService.forceLogout).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/emails');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Other HTTP Errors', () => {
    it('should pass through 400 errors without forcing logout', () => {
      httpClient.post('/api/test', {}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(authService.forceLogout).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should pass through 403 errors without forcing logout', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          expect(authService.forceLogout).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should pass through 404 errors without forcing logout', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(authService.forceLogout).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should pass through 500 errors without specific auth message', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(authService.forceLogout).not.toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(
        { message: 'Internal server error' },
        { status: 500, statusText: 'Server Error' }
      );
    });
  });

  describe('Successful Requests', () => {
    it('should pass through successful requests', () => {
      const testData = { data: 'test' };

      httpClient.get('/api/test').subscribe(response => {
        expect(response).toEqual(testData);
        expect(authService.forceLogout).not.toHaveBeenCalled();
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(testData);
    });
  });

  describe('Error Message Handling', () => {
    it('should use error message from response when available', () => {
      const errorMessage = 'Custom authentication error';

      httpClient.post('/auth/login', {}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('session has expired');
        }
      });

      const req = httpMock.expectOne('/auth/login');
      req.flush(
        { message: errorMessage },
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('should handle errors without message property', () => {
      httpClient.post('/auth/login', {}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(authService.forceLogout).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne('/auth/login');
      req.flush('Plain error string', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Logging', () => {
    it('should log critical authentication errors', () => {
      spyOn(console, 'log');

      httpClient.post('/auth/login', {}).subscribe({
        next: () => fail('should have failed'),
        error: () => {
          expect(console.log).toHaveBeenCalledWith(
            jasmine.stringContaining('Critical authentication error')
          );
        }
      });

      const req = httpMock.expectOne('/auth/login');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should log network errors', () => {
      spyOn(console, 'log');

      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => {
          expect(console.log).toHaveBeenCalledWith(
            jasmine.stringContaining('Network error detected')
          );
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'), { status: 0 });
    });
  });
});
