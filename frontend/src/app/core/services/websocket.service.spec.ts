import { TestBed } from '@angular/core/testing';
import { WebSocketService, EmailNotification } from './websocket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebSocketService]
    });
    service = TestBed.inject(WebSocketService);
  });

  afterEach(() => {
    // Clean up any active connections
    if (service.isConnected()) {
      service.disconnect();
    }
  });

  describe('Initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should not be connected initially', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should have notifications observable', (done) => {
      service.getNotifications().subscribe(notification => {
        expect(notification).toBeNull(); // Initial value
        done();
      });
    });
  });

  describe('connect()', () => {
    it('should set user email and attempt connection', () => {
      const userEmail = 'test@example.com';

      // Create spy on stompClient.activate
      spyOn(service['stompClient'], 'activate');

      service.connect(userEmail);

      expect(service['userEmail']).toBe(userEmail);
      expect(service['stompClient'].activate).toHaveBeenCalled();
    });

    it('should set correct broker URL', () => {
      const userEmail = 'test@example.com';

      service.connect(userEmail);

      expect(service['stompClient'].brokerURL).toBe('ws://localhost:8585/api/ws');
    });

    it('should set connection headers with user email', () => {
      const userEmail = 'test@example.com';

      service.connect(userEmail);

      expect(service['stompClient'].connectHeaders['user']).toBe(userEmail);
    });

    it('should not connect if already connected', () => {
      const userEmail = 'test@example.com';

      // Mock connected state
      service['connected'] = true;

      spyOn(service['stompClient'], 'activate');

      service.connect(userEmail);

      expect(service['stompClient'].activate).not.toHaveBeenCalled();
    });

    it('should not connect if already connecting (active)', () => {
      const userEmail = 'test@example.com';

      // Mock active state
      spyOn(service['stompClient'], 'activate');
      Object.defineProperty(service['stompClient'], 'active', {
        value: true,
        writable: true
      });

      service.connect(userEmail);

      expect(service['stompClient'].activate).not.toHaveBeenCalled();
    });
  });

  describe('disconnect()', () => {
    it('should deactivate client and reset state', () => {
      const userEmail = 'test@example.com';

      // Set initial state
      service['connected'] = true;
      service['userEmail'] = userEmail;

      spyOn(service['stompClient'], 'deactivate');

      service.disconnect();

      expect(service['stompClient'].deactivate).toHaveBeenCalled();
      expect(service['connected']).toBe(false);
      expect(service['userEmail']).toBeNull();
    });

    it('should not deactivate if not connected and not active', () => {
      spyOn(service['stompClient'], 'deactivate');

      service.disconnect();

      expect(service['stompClient'].deactivate).not.toHaveBeenCalled();
    });
  });

  describe('isConnected()', () => {
    it('should return false when not connected', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should return true when connected', () => {
      service['connected'] = true;
      expect(service.isConnected()).toBe(true);
    });
  });

  describe('getNotifications()', () => {
    it('should return observable of notifications', (done) => {
      service.getNotifications().subscribe(notification => {
        expect(notification).toBeDefined();
        done();
      });
    });

    it('should emit notifications when received', (done) => {
      const testNotification: EmailNotification = {
        type: 'NEW_EMAIL',
        messageId: 'msg-123',
        from: 'sender@example.com',
        subject: 'Test Email',
        folder: 'INBOX',
        preview: 'Test preview',
        timestamp: Date.now()
      };

      service.getNotifications().subscribe(notification => {
        if (notification) {
          expect(notification).toEqual(testNotification);
          done();
        }
      });

      // Simulate notification
      service['notificationsSubject'].next(testNotification);
    });
  });

  describe('Connection State Management', () => {
    it('should update connected state on successful connection', () => {
      expect(service['connected']).toBe(false);

      // Simulate onConnect callback
      service['stompClient'].onConnect({} as any);

      expect(service['connected']).toBe(true);
    });

    it('should update connected state on disconnect', () => {
      service['connected'] = true;

      // Simulate onDisconnect callback
      service['stompClient'].onDisconnect({} as any);

      expect(service['connected']).toBe(false);
    });

    it('should reset connection attempts on successful connection', () => {
      service['connectionAttempts'] = 5;

      // Simulate onConnect callback
      service['stompClient'].onConnect({} as any);

      expect(service['connectionAttempts']).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle STOMP errors', () => {
      service['connected'] = true;

      // Simulate onStompError callback
      service['stompClient'].onStompError({} as any);

      expect(service['connected']).toBe(false);
    });

    it('should handle WebSocket close', () => {
      service['connected'] = true;

      // Simulate onWebSocketClose callback
      service['stompClient'].onWebSocketClose({} as any);

      expect(service['connected']).toBe(false);
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should attempt reconnection on error if user email is set', () => {
      service['userEmail'] = 'test@example.com';
      service['connectionAttempts'] = 0;
      service['maxReconnectAttempts'] = 10;

      spyOn(service, 'connect');

      // Trigger reconnection
      service['attemptReconnect']();

      expect(service['connectionAttempts']).toBe(1);

      // Fast-forward time
      jasmine.clock().tick(5001);

      expect(service.connect).toHaveBeenCalledWith('test@example.com');
    });

    it('should not reconnect if max attempts reached', () => {
      service['userEmail'] = 'test@example.com';
      service['connectionAttempts'] = 10;
      service['maxReconnectAttempts'] = 10;

      spyOn(service, 'connect');

      service['attemptReconnect']();

      jasmine.clock().tick(5001);

      expect(service.connect).not.toHaveBeenCalled();
    });

    it('should not reconnect if user email is null', () => {
      service['userEmail'] = null;
      service['connectionAttempts'] = 0;

      spyOn(service, 'connect');

      service['attemptReconnect']();

      jasmine.clock().tick(5001);

      expect(service.connect).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe to notifications after connection', () => {
      service['userEmail'] = 'test@example.com';

      spyOn(service['stompClient'], 'subscribe');

      // Call private method
      service['subscribeToNotifications']();

      expect(service['stompClient'].subscribe).toHaveBeenCalledWith(
        '/user/queue/notifications',
        jasmine.any(Function)
      );
    });

    it('should not subscribe if user email is null', () => {
      service['userEmail'] = null;

      spyOn(service['stompClient'], 'subscribe');

      service['subscribeToNotifications']();

      expect(service['stompClient'].subscribe).not.toHaveBeenCalled();
    });

    it('should parse and emit notifications from subscription', (done) => {
      service['userEmail'] = 'test@example.com';

      const testNotification: EmailNotification = {
        type: 'NEW_EMAIL',
        messageId: 'msg-123',
        from: 'sender@example.com',
        subject: 'Test',
        timestamp: Date.now()
      };

      service.getNotifications().subscribe(notification => {
        if (notification) {
          expect(notification.type).toBe('NEW_EMAIL');
          expect(notification.messageId).toBe('msg-123');
          done();
        }
      });

      // Mock subscribe callback
      let subscriptionCallback: any;
      spyOn(service['stompClient'], 'subscribe').and.callFake((destination, callback) => {
        subscriptionCallback = callback;
        return {} as any;
      });

      service['subscribeToNotifications']();

      // Simulate message received
      if (subscriptionCallback) {
        subscriptionCallback({
          body: JSON.stringify(testNotification)
        });
      }
    });
  });

  describe('Notification Types', () => {
    it('should handle NEW_EMAIL notification', (done) => {
      const notification: EmailNotification = {
        type: 'NEW_EMAIL',
        messageId: 'msg-123',
        from: 'sender@example.com',
        subject: 'New Email',
        folder: 'INBOX',
        preview: 'Email preview',
        timestamp: Date.now()
      };

      service.getNotifications().subscribe(n => {
        if (n) {
          expect(n.type).toBe('NEW_EMAIL');
          expect(n.folder).toBe('INBOX');
          done();
        }
      });

      service['notificationsSubject'].next(notification);
    });

    it('should handle EMAIL_READ notification', (done) => {
      const notification: EmailNotification = {
        type: 'EMAIL_READ',
        messageId: 'msg-123',
        timestamp: Date.now()
      };

      service.getNotifications().subscribe(n => {
        if (n) {
          expect(n.type).toBe('EMAIL_READ');
          done();
        }
      });

      service['notificationsSubject'].next(notification);
    });

    it('should handle EMAIL_DELETED notification', (done) => {
      const notification: EmailNotification = {
        type: 'EMAIL_DELETED',
        messageId: 'msg-123',
        timestamp: Date.now()
      };

      service.getNotifications().subscribe(n => {
        if (n) {
          expect(n.type).toBe('EMAIL_DELETED');
          done();
        }
      });

      service['notificationsSubject'].next(notification);
    });
  });
});
