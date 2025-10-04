import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User } from '../../shared/models/auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  const mockLoginResponse: LoginResponse = {
    token: 'test-jwt-token',
    email: 'test@example.com',
    message: 'Login successful'
  };

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('initializeAuth()', () => {
    it('should initialize with valid stored token', () => {
      const user: User = { email: 'test@example.com', displayName: 'test' };
      // Create a valid JWT token (not expired)
      const payload = { email: 'test@example.com', exp: Math.floor(Date.now() / 1000) + 3600 };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';

      localStorage.setItem('memail_token', token);
      localStorage.setItem('memail_user', JSON.stringify(user));

      // Re-create service to trigger initialization
      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http, router);

      // Check that user and token were restored
      expect(newService.getCurrentUser()).toEqual(user);
      expect(newService.isAuthenticated()).toBe(true);
      expect(newService.getToken()).toBe(token);
    });

    it('should not initialize with missing token', (done) => {
      let userChecked = false;
      let authChecked = false;

      service.currentUser$.subscribe(currentUser => {
        expect(currentUser).toBeNull();
        userChecked = true;
        if (authChecked) done();
      });

      service.isAuthenticated$.subscribe(isAuth => {
        expect(isAuth).toBe(false);
        authChecked = true;
        if (userChecked) done();
      });
    });

    it('should not initialize with expired token', () => {
      const user: User = { email: 'test@example.com', displayName: 'test' };
      // Create an expired JWT token
      const payload = { email: 'test@example.com', exp: Math.floor(Date.now() / 1000) - 3600 };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';

      localStorage.setItem('memail_token', token);
      localStorage.setItem('memail_user', JSON.stringify(user));

      // Re-create service to trigger initialization
      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http, router);

      // Should not authenticate with expired token
      expect(newService.getCurrentUser()).toBeNull();
      expect(newService.isAuthenticated()).toBe(false);
    });

    it('should not initialize with malformed token', () => {
      const user: User = { email: 'test@example.com', displayName: 'test' };
      const token = 'invalid-token-format';

      localStorage.setItem('memail_token', token);
      localStorage.setItem('memail_user', JSON.stringify(user));

      // Re-create service to trigger initialization
      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http, router);

      // Should not authenticate with malformed token
      expect(newService.getCurrentUser()).toBeNull();
      expect(newService.isAuthenticated()).toBe(false);
    });
  });

  describe('login()', () => {
    it('should login successfully and store token', (done) => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockLoginResponse);
        expect(service.getToken()).toBe(mockLoginResponse.token);

        service.currentUser$.subscribe(user => {
          expect(user?.email).toBe('test@example.com');
          done();
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockLoginResponse);
    });

    it('should update authentication state on login', (done) => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe(() => {
        service.isAuthenticated$.subscribe(isAuth => {
          expect(isAuth).toBe(true);
          done();
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });

    it('should handle login error', (done) => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      service.login(credentials).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout()', () => {
    it('should call backend logout and clear auth data', () => {
      const token = 'test-token';
      localStorage.setItem('memail_token', token);

      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      req.flush({});

      expect(service.getToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should clear auth data even if no token exists', () => {
      service.logout();

      // No HTTP request should be made
      httpMock.expectNone(`${environment.apiUrl}/auth/logout`);

      expect(service.getToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should clear auth data even if logout API fails', () => {
      const token = 'test-token';
      localStorage.setItem('memail_token', token);

      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(service.getToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('forceLogout()', () => {
    it('should clear auth data and redirect without API call', () => {
      const token = 'test-token';
      const user: User = { email: 'test@example.com', displayName: 'test' };

      localStorage.setItem('memail_token', token);
      localStorage.setItem('memail_user', JSON.stringify(user));

      service.forceLogout();

      // No HTTP request should be made
      httpMock.expectNone(`${environment.apiUrl}/auth/logout`);

      expect(service.getToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);

      service.currentUser$.subscribe(currentUser => {
        expect(currentUser).toBeNull();
      });

      service.isAuthenticated$.subscribe(isAuth => {
        expect(isAuth).toBe(false);
      });
    });
  });

  describe('getToken()', () => {
    it('should return stored token', () => {
      const token = 'test-token';
      localStorage.setItem('memail_token', token);

      expect(service.getToken()).toBe(token);
    });

    it('should return null if no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getCurrentUser()', () => {
    it('should return current user', (done) => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe(() => {
        const user = service.getCurrentUser();
        expect(user?.email).toBe('test@example.com');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });

    it('should return null when not authenticated', () => {
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('isAuthenticated()', () => {
    it('should return true when user is authenticated', (done) => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe(() => {
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });

    it('should return false when user is not authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('isTokenExpired()', () => {
    it('should return false for valid token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = btoa(JSON.stringify({ exp: futureTime }));
      const token = `header.${payload}.signature`;

      localStorage.setItem('memail_token', token);

      // Access private method through any
      const isExpired = (service as any).isTokenExpired(token);
      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = btoa(JSON.stringify({ exp: pastTime }));
      const token = `header.${payload}.signature`;

      const isExpired = (service as any).isTokenExpired(token);
      expect(isExpired).toBe(true);
    });

    it('should return true for malformed token', () => {
      const token = 'invalid-token';

      const isExpired = (service as any).isTokenExpired(token);
      expect(isExpired).toBe(true);
    });
  });

  describe('Token and User Storage', () => {
    it('should store token in localStorage on login', (done) => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe(() => {
        const storedToken = localStorage.getItem('memail_token');
        expect(storedToken).toBe(mockLoginResponse.token);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });

    it('should store user in localStorage on login', (done) => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe(() => {
        const storedUser = localStorage.getItem('memail_user');
        expect(storedUser).toBeTruthy();

        if (storedUser) {
          const user = JSON.parse(storedUser);
          expect(user.email).toBe('test@example.com');
        }
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });

    it('should clear token and user from localStorage on logout', () => {
      localStorage.setItem('memail_token', 'test-token');
      localStorage.setItem('memail_user', JSON.stringify({ email: 'test@example.com' }));

      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({});

      expect(localStorage.getItem('memail_token')).toBeNull();
      expect(localStorage.getItem('memail_user')).toBeNull();
    });
  });

  describe('Observable Streams', () => {
    it('should emit user changes via currentUser$ observable', (done) => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      let emissionCount = 0;
      service.currentUser$.subscribe(user => {
        emissionCount++;
        if (emissionCount === 2) { // Skip initial null emission
          expect(user?.email).toBe('test@example.com');
          done();
        }
      });

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });

    it('should emit authentication state changes via isAuthenticated$ observable', (done) => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      let emissionCount = 0;
      service.isAuthenticated$.subscribe(isAuth => {
        emissionCount++;
        if (emissionCount === 2) { // Skip initial false emission
          expect(isAuth).toBe(true);
          done();
        }
      });

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });
  });
});
