import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EmailListResponse, HealthCheckResponse, EmailActionResponse, SendEmailResponse, DraftResponse, DraftUpdateData, ReplyData } from '../../shared/models/email.models';
import { ConversationListResponse, ConversationDTO, EmailActionRequest, EmailDetailDTO, EmailAction } from '../../shared/models/conversation.models';

@Injectable({
  providedIn: 'root'
})
export class MailService {

  constructor(private http: HttpClient) {}

  /**
   * Get emails from specified folder with pagination
   */
  getEmails(folder: string = 'INBOX', page: number = 0, size: number = 50): Observable<EmailListResponse> {
    const params = new HttpParams()
      .set('folder', folder)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<EmailListResponse>(`${environment.apiUrl}/emails`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching emails:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get available folders
   */
  getFolders(): Observable<{ folders: string[] }> {
    return this.http.get<{ folders: string[] }>(`${environment.apiUrl}/emails/folders`)
      .pipe(
        catchError(error => {
          console.error('Error fetching folders:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Health check for email service
   */
  healthCheck(): Observable<HealthCheckResponse> {
    return this.http.get<HealthCheckResponse>(`${environment.apiUrl}/emails/health`)
      .pipe(
        catchError(error => {
          console.error('Email service health check failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get email suggestions for autocomplete
   */
  getEmailSuggestions(query: string = ''): Observable<{ suggestions: string[] }> {
    const params = new HttpParams().set('query', query);

    return this.http.get<{ suggestions: string[] }>(`${environment.apiUrl}/emails/suggestions`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching email suggestions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Search emails using query
   */
  searchEmails(query: string, folder: string = 'INBOX', page: number = 0, size: number = 50): Observable<EmailListResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('folder', folder)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<EmailListResponse>(`${environment.apiUrl}/emails/search`, { params })
      .pipe(
        catchError(error => {
          console.error('Error searching emails:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Search conversations using the same endpoint as getConversations but with search query
   */
  searchConversations(query: string, folder: string = 'INBOX', page: number = 0, size: number = 50): Observable<ConversationListResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('folder', folder)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ConversationListResponse>(`${environment.apiUrl}/conversations/search`, { params })
      .pipe(
        catchError(error => {
          console.error('Error searching conversations:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Send email with attachments
   */
  sendEmail(emailData: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    htmlContent: string;
    attachments?: File[];
  }): Observable<SendEmailResponse> {
    const formData = new FormData();

    formData.append('to', emailData.to);
    if (emailData.cc) formData.append('cc', emailData.cc);
    if (emailData.bcc) formData.append('bcc', emailData.bcc);
    formData.append('subject', emailData.subject);
    formData.append('htmlContent', emailData.htmlContent);

    if (emailData.attachments) {
      emailData.attachments.forEach(file => {
        formData.append('attachments', file, file.name);
      });
    }

    return this.http.post<SendEmailResponse>(`${environment.apiUrl}/emails/send`, formData)
      .pipe(
        catchError(error => {
          console.error('Error sending email:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get conversations from specified folder with pagination
   */
  getConversations(folder: string = 'INBOX', page: number = 0, size: number = 50): Observable<ConversationListResponse> {
    const params = new HttpParams()
      .set('folder', folder)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ConversationListResponse>(`${environment.apiUrl}/emails/conversations`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching conversations:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get full conversation thread by thread ID
   */
  getConversationThread(threadId: string): Observable<ConversationDTO> {
    return this.http.get<ConversationDTO>(`${environment.apiUrl}/emails/conversations/${threadId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching conversation thread:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Save email as draft
   */
  saveDraft(draftData: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    htmlContent: string;
    attachments?: File[];
  }): Observable<DraftResponse> {
    const formData = new FormData();

    formData.append('to', draftData.to);
    if (draftData.cc) formData.append('cc', draftData.cc);
    if (draftData.bcc) formData.append('bcc', draftData.bcc);
    formData.append('subject', draftData.subject);
    formData.append('htmlContent', draftData.htmlContent);

    if (draftData.attachments) {
      draftData.attachments.forEach(file => {
        formData.append('attachments', file, file.name);
      });
    }

    return this.http.post<DraftResponse>(`${environment.apiUrl}/emails/draft`, formData)
      .pipe(
        catchError(error => {
          console.error('Error saving draft:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Perform actions on emails (mark as read, delete, archive)
   */
  performEmailActions(request: EmailActionRequest): Observable<EmailActionResponse> {
    const headers = {
      'Content-Type': 'application/json'
    };

    return this.http.post<EmailActionResponse>(
      `${environment.apiUrl}/emails/actions`,
      request,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error performing email actions:', error);
        console.error('Request payload:', request);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get draft email details for editing
   */
  getDraft(messageId: string): Observable<DraftResponse> {
    return this.http.get<DraftResponse>(`${environment.apiUrl}/emails/drafts/${messageId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching draft:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update existing draft
   */
  updateDraft(messageId: string, draftData: DraftUpdateData): Observable<DraftResponse> {
    const headers = {
      'Content-Type': 'application/json'
    };

    return this.http.put<DraftResponse>(
      `${environment.apiUrl}/emails/drafts/${messageId}`,
      draftData,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error updating draft:', error);
        console.error('Request payload:', draftData);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete draft
   */
  deleteDraft(messageId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/emails/drafts/${messageId}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting draft:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Bulk delete drafts in a single API call
   */
  bulkDeleteDrafts(messageIds: string[]): Observable<any> {
    return this.http.post(`${environment.apiUrl}/emails/drafts/bulk-delete`, { messageIds })
      .pipe(
        catchError(error => {
          console.error('Error bulk deleting drafts:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Send reply or forward email
   */
  sendReply(replyData: ReplyData | { type: string; originalMessageId: string; to: string[]; cc?: string[]; subject: string; htmlContent: string; threadId?: string }): Observable<SendEmailResponse> {
    const headers = {
      'Content-Type': 'application/json'
    };

    return this.http.post<SendEmailResponse>(
      `${environment.apiUrl}/emails/reply`,
      replyData,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error sending reply:', error);
        console.error('Request payload:', replyData);
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle star status for emails
   */
  toggleStar(messageIds: string[], starred: boolean, folder: string): Observable<EmailActionResponse> {
    const request: EmailActionRequest = {
      messageIds,
      action: starred ? EmailAction.STAR : EmailAction.UNSTAR,
      folder
    };

    const headers = {
      'Content-Type': 'application/json'
    };

    return this.http.post<EmailActionResponse>(
      `${environment.apiUrl}/emails/actions`,
      request,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error toggling star:', error);
        console.error('Request payload:', request);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mark emails as important
   */
  markImportant(messageIds: string[], important: boolean, folder: string): Observable<EmailActionResponse> {
    const request: EmailActionRequest = {
      messageIds,
      action: important ? EmailAction.MARK_IMPORTANT : EmailAction.UNMARK_IMPORTANT,
      folder
    };

    return this.http.post<EmailActionResponse>(`${environment.apiUrl}/emails/actions`, request)
      .pipe(
        catchError(error => {
          console.error('Error marking as important:', error);
          return throwError(() => error);
        })
      );
  }
}