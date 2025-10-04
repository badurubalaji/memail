import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { MailListComponent } from './mail-list.component';
import { MailService } from '../../core/services/mail.service';
import { SearchService } from '../../core/services/search.service';
import { LabelService } from '../../core/services/label.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ConversationListResponse, ConversationDTO, EmailAction } from '../../shared/models/conversation.models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MailListComponent', () => {
  let component: MailListComponent;
  let fixture: ComponentFixture<MailListComponent>;
  let mailService: jasmine.SpyObj<MailService>;
  let searchService: jasmine.SpyObj<SearchService>;
  let labelService: jasmine.SpyObj<LabelService>;
  let webSocketService: jasmine.SpyObj<WebSocketService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let route: any;

  const mockConversations: ConversationDTO[] = [
    {
      threadId: 'thread-1',
      subject: 'Test Email 1',
      participants: ['sender1@example.com'],
      messageCount: 1,
      lastMessageDate: '2025-01-01T00:00:00',
      hasUnread: true,
      hasAttachments: false,
      preview: 'Test preview 1',
      isStarred: false
    },
    {
      threadId: 'thread-2',
      subject: 'Test Email 2',
      participants: ['sender2@example.com'],
      messageCount: 2,
      lastMessageDate: '2025-01-02T00:00:00',
      hasUnread: false,
      hasAttachments: true,
      preview: 'Test preview 2',
      isStarred: true
    }
  ];

  const mockConversationListResponse: ConversationListResponse = {
    conversations: mockConversations,
    totalCount: 2,
    page: 0,
    size: 50,
    hasMore: false
  };

  beforeEach(async () => {
    const mailServiceSpy = jasmine.createSpyObj('MailService', [
      'getConversations',
      'searchConversations',
      'performEmailActions',
      'toggleStar',
      'getDraft',
      'bulkDeleteDrafts'
    ]);
    const searchServiceSpy = jasmine.createSpyObj('SearchService', [], {
      searchQuery$: new BehaviorSubject<string | null>(null)
    });
    const labelServiceSpy = jasmine.createSpyObj('LabelService', ['applyLabel', 'removeLabel']);
    const webSocketServiceSpy = jasmine.createSpyObj('WebSocketService', ['getNotifications']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    const activatedRouteStub = {
      data: of({ folder: 'INBOX' }),
      params: of({}),
      snapshot: {}
    };

    webSocketServiceSpy.getNotifications.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [MailListComponent, NoopAnimationsModule],
      providers: [
        { provide: MailService, useValue: mailServiceSpy },
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: LabelService, useValue: labelServiceSpy },
        { provide: WebSocketService, useValue: webSocketServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();

    mailService = TestBed.inject(MailService) as jasmine.SpyObj<MailService>;
    searchService = TestBed.inject(SearchService) as jasmine.SpyObj<SearchService>;
    labelService = TestBed.inject(LabelService) as jasmine.SpyObj<LabelService>;
    webSocketService = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    route = TestBed.inject(ActivatedRoute);

    fixture = TestBed.createComponent(MailListComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should load conversations on init', () => {
      mailService.getConversations.and.returnValue(of(mockConversationListResponse));

      fixture.detectChanges(); // ngOnInit

      expect(mailService.getConversations).toHaveBeenCalledWith('INBOX', 0, 50);
      expect(component.conversations.length).toBe(2);
    });

    it('should set folder from route data', () => {
      route.data = of({ folder: 'SENT' });
      mailService.getConversations.and.returnValue(of(mockConversationListResponse));

      fixture.detectChanges();

      expect(component.currentFolder).toBe('SENT');
    });
  });

  describe('loadConversations()', () => {
    it('should load conversations successfully', () => {
      mailService.getConversations.and.returnValue(of(mockConversationListResponse));

      component.loadConversations();

      expect(component.isLoading).toBe(false);
      expect(component.conversations).toEqual(mockConversations);
      expect(component.totalConversations).toBe(2);
    });

    it('should handle error when loading conversations', fakeAsync(() => {
      mailService.getConversations.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Server error' } }))
      );

      component.loadConversations();
      flush(); // Flush all pending microtasks and timers

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBeTruthy();
      expect(snackBar.open).toHaveBeenCalled();
    }));

    it('should search conversations when in search mode', () => {
      component.isSearchMode = true;
      component.currentSearchQuery = 'test query';
      mailService.searchConversations.and.returnValue(of(mockConversationListResponse));

      component.loadConversations();

      expect(mailService.searchConversations).toHaveBeenCalledWith('test query', 'INBOX', 0, 50);
    });
  });

  describe('Selection Management', () => {
    beforeEach(() => {
      mailService.getConversations.and.returnValue(of(mockConversationListResponse));
      fixture.detectChanges();
    });

    it('should select conversation', () => {
      component.toggleConversationSelection('thread-1', { checked: true } as any);

      expect(component.selectedConversations).toContain('thread-1');
      expect(component.someSelected).toBe(true);
    });

    it('should deselect conversation', () => {
      component.selectedConversations = ['thread-1'];
      component.toggleConversationSelection('thread-1', { checked: false } as any);

      expect(component.selectedConversations).not.toContain('thread-1');
      expect(component.someSelected).toBe(false);
    });

    it('should select all conversations', () => {
      component.toggleSelectAll({ checked: true } as any);

      expect(component.selectedConversations.length).toBe(2);
      expect(component.allSelected).toBe(true);
    });

    it('should deselect all conversations', () => {
      component.selectedConversations = ['thread-1', 'thread-2'];
      component.toggleSelectAll({ checked: false } as any);

      expect(component.selectedConversations.length).toBe(0);
      expect(component.allSelected).toBe(false);
    });

    it('should clear selection', () => {
      component.selectedConversations = ['thread-1', 'thread-2'];
      component.clearSelection();

      expect(component.selectedConversations.length).toBe(0);
      expect(component.someSelected).toBe(false);
    });
  });

  describe('Bulk Actions', () => {
    beforeEach(() => {
      mailService.getConversations.and.returnValue(of(mockConversationListResponse));
      fixture.detectChanges();
      component.selectedConversations = ['thread-1', 'thread-2'];
    });

    it('should perform bulk archive', () => {
      mailService.performEmailActions.and.returnValue(of({ message: 'Archived' } as any));

      component.bulkArchive();

      expect(mailService.performEmailActions).toHaveBeenCalledWith({
        messageIds: ['thread-1', 'thread-2'],
        action: EmailAction.ARCHIVE,
        folder: 'INBOX'
      });
    });

    it('should perform bulk mark as read', () => {
      mailService.performEmailActions.and.returnValue(of({ message: 'Marked as read' } as any));

      component.bulkMarkAsRead();

      expect(mailService.performEmailActions).toHaveBeenCalledWith({
        messageIds: ['thread-1', 'thread-2'],
        action: EmailAction.MARK_AS_READ,
        folder: 'INBOX'
      });
    });

    it('should perform bulk mark as unread', () => {
      mailService.performEmailActions.and.returnValue(of({ message: 'Marked as unread' } as any));

      component.bulkMarkAsUnread();

      expect(mailService.performEmailActions).toHaveBeenCalledWith({
        messageIds: ['thread-1', 'thread-2'],
        action: EmailAction.MARK_AS_UNREAD,
        folder: 'INBOX'
      });
    });

    it('should open confirm dialog for bulk delete', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialog.open.and.returnValue(dialogRefSpy);

      mailService.performEmailActions.and.returnValue(of({ message: 'Deleted' } as any));

      component.bulkDelete();

      expect(dialog.open).toHaveBeenCalled();
    });

    it('should not perform action if no items selected', () => {
      component.selectedConversations = [];

      component.bulkArchive();

      expect(mailService.performEmailActions).not.toHaveBeenCalled();
    });
  });

  describe('Star Functionality', () => {
    beforeEach(() => {
      mailService.getConversations.and.returnValue(of(mockConversationListResponse));
      fixture.detectChanges();
    });

    it('should toggle star on', () => {
      const conversation = component.conversations[0];
      mailService.toggleStar.and.returnValue(of({ message: 'Starred' } as any));

      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');

      component.toggleStar(conversation, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(conversation.isStarred).toBe(true);
      expect(mailService.toggleStar).toHaveBeenCalledWith([conversation.threadId], true, 'INBOX');
    });

    it('should toggle star off', () => {
      const conversation = component.conversations[1]; // isStarred: true
      mailService.toggleStar.and.returnValue(of({ message: 'Unstarred' } as any));

      component.toggleStar(conversation, new MouseEvent('click'));

      expect(conversation.isStarred).toBe(false);
      expect(mailService.toggleStar).toHaveBeenCalledWith([conversation.threadId], false, 'INBOX');
    });

    it('should revert star state on error', fakeAsync(() => {
      const conversation = component.conversations[0]; // isStarred: false
      mailService.toggleStar.and.returnValue(throwError(() => new Error('Star failed')));

      component.toggleStar(conversation, new MouseEvent('click'));
      flush(); // Flush all pending microtasks and timers

      expect(conversation.isStarred).toBe(false); // Reverted
      expect(snackBar.open).toHaveBeenCalledWith('Failed to update star status', 'Close', jasmine.any(Object));
    }));
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mailService.getConversations.and.returnValue(of(mockConversationListResponse));
      fixture.detectChanges();
    });

    it('should navigate to conversation detail', () => {
      component.selectConversation(mockConversations[0]);

      expect(router.navigate).toHaveBeenCalledWith(['/inbox', 'thread-1']);
    });

    it('should handle draft editing differently', () => {
      component.currentFolder = 'DRAFTS';
      mailService.getDraft.and.returnValue(of({ messageId: 'draft-1' } as any));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialog.open.and.returnValue(dialogRefSpy);

      const draftConversation = { ...mockConversations[0], messages: [{ messageId: 'draft-1' } as any] };

      component.selectConversation(draftConversation);

      expect(mailService.getDraft).toHaveBeenCalledWith('draft-1');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should handle page change', () => {
      mailService.getConversations.and.returnValue(of(mockConversationListResponse));

      const event = { pageIndex: 1, pageSize: 25 } as any;
      component.onPageChange(event);

      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(25);
      expect(mailService.getConversations).toHaveBeenCalledWith('INBOX', 1, 25);
    });
  });

  describe('Date Formatting', () => {
    it('should format today\'s date as time', () => {
      const today = new Date();
      const formatted = component.formatDate(today.toISOString());

      expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should format yesterday as "Yesterday"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const formatted = component.formatDate(yesterday.toISOString());

      expect(formatted).toBe('Yesterday');
    });

    it('should format recent dates as weekday', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const formatted = component.formatDate(threeDaysAgo.toISOString());

      expect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].some(day => formatted.includes(day))).toBe(true);
    });
  });

  describe('WebSocket Integration', () => {
    it('should refresh conversations on NEW_EMAIL notification', () => {
      const notificationSubject = new BehaviorSubject<any>(null);
      webSocketService.getNotifications.and.returnValue(notificationSubject);

      mailService.getConversations.and.returnValue(of(mockConversationListResponse));
      fixture.detectChanges();

      const initialCallCount = mailService.getConversations.calls.count();

      notificationSubject.next({
        type: 'NEW_EMAIL',
        folder: 'INBOX',
        messageId: 'new-msg'
      });

      expect(mailService.getConversations.calls.count()).toBe(initialCallCount + 1);
    });

    it('should not refresh on NEW_EMAIL for different folder', () => {
      const notificationSubject = new BehaviorSubject<any>(null);
      webSocketService.getNotifications.and.returnValue(notificationSubject);

      mailService.getConversations.and.returnValue(of(mockConversationListResponse));
      fixture.detectChanges();

      const initialCallCount = mailService.getConversations.calls.count();

      notificationSubject.next({
        type: 'NEW_EMAIL',
        folder: 'SENT', // Different folder
        messageId: 'new-msg'
      });

      expect(mailService.getConversations.calls.count()).toBe(initialCallCount);
    });
  });

  describe('trackByThreadId', () => {
    it('should return thread ID for tracking', () => {
      const result = component.trackByThreadId(0, mockConversations[0]);
      expect(result).toBe('thread-1');
    });
  });
});
