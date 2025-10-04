import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MailService } from './mail.service';
import { environment } from '../../../environments/environment';
import {
  EmailListResponse,
  HealthCheckResponse,
  SendEmailResponse,
  DraftResponse
} from '../../shared/models/email.models';
import {
  ConversationListResponse,
  ConversationDTO,
  EmailActionRequest,
  EmailAction
} from '../../shared/models/conversation.models';

describe('MailService', () => {
  let service: MailService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MailService]
    });
    service = TestBed.inject(MailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getEmails()', () => {
    it('should retrieve emails from INBOX with default parameters', () => {
      const mockResponse: EmailListResponse = {
        emails: [],
        totalCount: 0,
        page: 0,
        size: 50,
        hasMore: false
      };

      service.getEmails().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails?folder=INBOX&page=0&size=50`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should retrieve emails with custom folder and pagination', () => {
      const mockResponse: EmailListResponse = {
        emails: [],
        totalCount: 0,
        page: 1,
        size: 25,
        hasMore: false
      };

      service.getEmails('SENT', 1, 25).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails?folder=SENT&page=1&size=25`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle errors when fetching emails', () => {
      service.getEmails().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails?folder=INBOX&page=0&size=50`
      );
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getFolders()', () => {
    it('should retrieve available folders', () => {
      const mockFolders = { folders: ['INBOX', 'SENT', 'DRAFTS', 'TRASH'] };

      service.getFolders().subscribe(response => {
        expect(response.folders.length).toBe(4);
        expect(response.folders).toContain('INBOX');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/folders`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFolders);
    });
  });

  describe('healthCheck()', () => {
    it('should perform health check', () => {
      const mockHealth: HealthCheckResponse = {
        status: 'OK',
        timestamp: '2025-01-01T00:00:00',
        services: {
          mail: 'OK'
        }
      };

      service.healthCheck().subscribe(response => {
        expect(response.status).toBe('OK');
        expect(response.services.mail).toBe('OK');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/health`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHealth);
    });
  });

  describe('getEmailSuggestions()', () => {
    it('should retrieve email suggestions', () => {
      const mockSuggestions = {
        suggestions: ['user1@example.com', 'user2@example.com']
      };

      service.getEmailSuggestions('user').subscribe(response => {
        expect(response.suggestions.length).toBe(2);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/suggestions?query=user`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockSuggestions);
    });

    it('should handle empty query', () => {
      const mockSuggestions = { suggestions: [] };

      service.getEmailSuggestions('').subscribe(response => {
        expect(response.suggestions.length).toBe(0);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/suggestions?query=`
      );
      req.flush(mockSuggestions);
    });
  });

  describe('searchEmails()', () => {
    it('should search emails with query', () => {
      const mockResponse: EmailListResponse = {
        emails: [],
        totalCount: 0,
        page: 0,
        size: 50,
        hasMore: false
      };

      service.searchEmails('from:test@example.com').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/search?q=from:test@example.com&folder=INBOX&page=0&size=50`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('sendEmail()', () => {
    it('should send email with FormData', () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<p>Test content</p>'
      };

      const mockResponse: SendEmailResponse = {
        success: true,
        message: 'Email sent successfully',
        messageId: 'msg-123'
      };

      service.sendEmail(emailData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Email sent successfully');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/send`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should send email with attachments', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<p>Test content</p>',
        attachments: [file]
      };

      const mockResponse: SendEmailResponse = {
        success: true,
        message: 'Email sent successfully',
        messageId: 'msg-123'
      };

      service.sendEmail(emailData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Email sent successfully');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/send`);
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });
  });

  describe('getConversations()', () => {
    it('should retrieve conversations', () => {
      const mockResponse: ConversationListResponse = {
        conversations: [],
        totalCount: 0,
        page: 0,
        size: 50,
        hasMore: false
      };

      service.getConversations('INBOX', 0, 50).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/conversations?folder=INBOX&page=0&size=50`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getConversationThread()', () => {
    it('should retrieve conversation thread', () => {
      const threadId = 'thread-123';
      const mockConversation: ConversationDTO = {
        threadId: 'thread-123',
        subject: 'Test',
        participants: ['user@example.com'],
        messageCount: 1,
        lastMessageDate: '2025-01-01T00:00:00',
        hasUnread: false,
        hasAttachments: false,
        preview: 'Test preview',
        messages: []
      };

      service.getConversationThread(threadId).subscribe(response => {
        expect(response.threadId).toBe(threadId);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/conversations/${threadId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockConversation);
    });
  });

  describe('saveDraft()', () => {
    it('should save draft email', () => {
      const draftData = {
        to: 'recipient@example.com',
        subject: 'Draft Subject',
        htmlContent: '<p>Draft content</p>'
      };

      const mockResponse: DraftResponse = {
        messageId: 'draft-123',
        to: ['recipient@example.com'],
        subject: 'Draft Subject',
        htmlContent: '<p>Draft content</p>',
        lastModified: '2025-01-01T00:00:00',
        created: '2025-01-01T00:00:00'
      };

      service.saveDraft(draftData).subscribe(response => {
        expect(response.messageId).toBe('draft-123');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/draft`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('performEmailActions()', () => {
    it('should perform MARK_AS_READ action', () => {
      const request: EmailActionRequest = {
        messageIds: ['msg1', 'msg2'],
        action: EmailAction.MARK_AS_READ,
        folder: 'INBOX'
      };

      const mockResponse = {
        message: 'Action performed successfully'
      };

      service.performEmailActions(request).subscribe(response => {
        expect(response.message).toBe('Action performed successfully');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/actions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should perform DELETE action', () => {
      const request: EmailActionRequest = {
        messageIds: ['msg1'],
        action: EmailAction.DELETE,
        folder: 'INBOX'
      };

      service.performEmailActions(request).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/actions`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Deleted' });
    });
  });

  describe('getDraft()', () => {
    it('should retrieve draft by message ID', () => {
      const messageId = 'draft-123';
      const mockDraft: DraftResponse = {
        messageId: 'draft-123',
        to: ['recipient@example.com'],
        subject: 'Draft Subject',
        htmlContent: '<p>Draft content</p>',
        lastModified: '2025-01-01T00:00:00',
        created: '2025-01-01T00:00:00'
      };

      service.getDraft(messageId).subscribe(response => {
        expect(response.messageId).toBe(messageId);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/drafts/${messageId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockDraft);
    });
  });

  describe('updateDraft()', () => {
    it('should update existing draft', () => {
      const messageId = 'draft-123';
      const draftData = {
        to: 'recipient@example.com',
        subject: 'Updated Draft',
        htmlContent: '<p>Updated content</p>'
      };

      const mockResponse: DraftResponse = {
        messageId: messageId,
        to: ['recipient@example.com'],
        subject: 'Updated Draft',
        htmlContent: '<p>Updated content</p>',
        lastModified: '2025-01-01T00:00:00',
        created: '2025-01-01T00:00:00'
      };

      service.updateDraft(messageId, draftData).subscribe(response => {
        expect(response.messageId).toBe(messageId);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/drafts/${messageId}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(draftData);
      req.flush(mockResponse);
    });
  });

  describe('deleteDraft()', () => {
    it('should delete draft', () => {
      const messageId = 'draft-123';

      service.deleteDraft(messageId).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/drafts/${messageId}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('bulkDeleteDrafts()', () => {
    it('should bulk delete multiple drafts', () => {
      const messageIds = ['draft1', 'draft2', 'draft3'];

      service.bulkDeleteDrafts(messageIds).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/emails/drafts/bulk-delete`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ messageIds });
      req.flush({ message: 'Drafts deleted' });
    });
  });

  describe('sendReply()', () => {
    it('should send reply email', () => {
      const replyData = {
        type: 'reply',
        originalMessageId: 'msg-123',
        to: ['sender@example.com'],
        subject: 'Re: Test',
        htmlContent: '<p>Reply content</p>',
        threadId: 'thread-123'
      };

      const mockResponse: SendEmailResponse = {
        success: true,
        message: 'Reply sent successfully',
        messageId: 'reply-123'
      };

      service.sendReply(replyData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Reply sent successfully');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/reply`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(replyData);
      req.flush(mockResponse);
    });
  });

  describe('toggleStar()', () => {
    it('should star emails', () => {
      const messageIds = ['msg1', 'msg2'];

      service.toggleStar(messageIds, true, 'INBOX').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/actions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.action).toBe(EmailAction.STAR);
      req.flush({ message: 'Starred' });
    });

    it('should unstar emails', () => {
      const messageIds = ['msg1'];

      service.toggleStar(messageIds, false, 'INBOX').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/actions`);
      expect(req.request.body.action).toBe(EmailAction.UNSTAR);
      req.flush({ message: 'Unstarred' });
    });
  });

  describe('markImportant()', () => {
    it('should mark emails as important', () => {
      const messageIds = ['msg1'];

      service.markImportant(messageIds, true, 'INBOX').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/actions`);
      expect(req.request.body.action).toBe(EmailAction.MARK_IMPORTANT);
      req.flush({ message: 'Marked important' });
    });

    it('should unmark emails as important', () => {
      const messageIds = ['msg1'];

      service.markImportant(messageIds, false, 'INBOX').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/emails/actions`);
      expect(req.request.body.action).toBe(EmailAction.UNMARK_IMPORTANT);
      req.flush({ message: 'Unmarked important' });
    });
  });
});
