import { Component, OnInit, OnDestroy, TrackByFunction, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MailService } from '../../core/services/mail.service';
import { ConversationDTO, EmailDetailDTO, EmailActionRequest, EmailAction } from '../../shared/models/conversation.models';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { fadeInOut, expandCollapse } from '../../shared/animations/route-animations';

@Component({
  selector: 'app-enhanced-mail-detail',
  standalone: true,
  animations: [fadeInOut, expandCollapse],
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatMenuModule,
    MatExpansionModule,
    MatDividerModule,
    LoadingStateComponent,
    ErrorStateComponent
  ],
  template: `
    <div class="enhanced-mail-detail" [@fadeInOut]>
      <div class="detail-header">
        <button mat-icon-button (click)="goBack()" matTooltip="Back to conversations" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>

        <div class="conversation-info" *ngIf="conversation">
          <h2>{{ conversation.subject || '(No Subject)' }}</h2>
          <p class="participants">{{ getParticipantsDisplay(conversation.participants) }}</p>
        </div>

        <div class="action-buttons" *ngIf="conversation">
          <button mat-icon-button matTooltip="Archive" (click)="archiveConversation()">
            <mat-icon>archive</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Delete" (click)="deleteConversation()">
            <mat-icon>delete</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Mark as unread" (click)="markAllAsUnread()">
            <mat-icon>mark_email_unread</mat-icon>
          </button>
          <button mat-icon-button [matMenuTriggerFor]="actionsMenu" matTooltip="More actions">
            <mat-icon>more_vert</mat-icon>
          </button>

          <mat-menu #actionsMenu="matMenu">
            <button mat-menu-item (click)="markAllAsRead()" *ngIf="hasUnreadMessages()">
              <mat-icon>mark_email_read</mat-icon>
              Mark all as read
            </button>
            <button mat-menu-item (click)="addLabel()">
              <mat-icon>label</mat-icon>
              Add label
            </button>
            <button mat-menu-item (click)="moveToFolder()">
              <mat-icon>folder</mat-icon>
              Move to
            </button>
          </mat-menu>
        </div>
      </div>

      <app-loading-state
        *ngIf="isLoading"
        message="Loading conversation...">
      </app-loading-state>

      <app-error-state
        *ngIf="errorMessage"
        title="Unable to load conversation"
        [message]="errorMessage"
        (retry)="loadConversation()">
      </app-error-state>

      <div *ngIf="conversation && conversation.messages" class="conversation-container">
        <!-- Collapsed messages summary -->
        <div *ngIf="collapsedMessages.length > 0" class="collapsed-summary" [@expandCollapse]>
          <button mat-button class="expand-button" (click)="expandAllMessages()">
            <mat-icon>expand_more</mat-icon>
            Show {{ collapsedMessages.length }} earlier message{{ collapsedMessages.length > 1 ? 's' : '' }}
          </button>
        </div>

        <!-- Expanded/visible messages -->
        <div class="messages-list">
          <div *ngFor="let message of visibleMessages; trackBy: trackByMessageId; let last = last"
               class="message-wrapper"
               [@fadeInOut]>

            <mat-card class="message-card"
                      [class.unread]="message.unread"
                      [class.expanded]="isMessageExpanded(message.messageId)"
                      [class.last-message]="last">

              <!-- Message Header -->
              <mat-card-header class="message-header" (click)="toggleMessage(message.messageId)">
                <div class="sender-info">
                  <div class="avatar">
                    <mat-icon>account_circle</mat-icon>
                  </div>
                  <div class="sender-details">
                    <div class="sender-name">{{ extractDisplayName(message.from) }}</div>
                    <div class="sender-email">{{ extractEmailAddress(message.from) }}</div>
                    <div class="recipients" *ngIf="message.to && message.to.length > 0">
                      to {{ getRecipientsPreview(message.to) }}
                    </div>
                  </div>
                </div>

                <div class="message-meta">
                  <span class="message-date">{{ formatDateTime(message.date) }}</span>
                  <mat-icon *ngIf="message.hasAttachments" class="attachment-icon" matTooltip="Has attachments">
                    attach_file
                  </mat-icon>
                  <mat-icon class="expand-icon" [class.expanded]="isMessageExpanded(message.messageId)">
                    {{ isMessageExpanded(message.messageId) ? 'expand_less' : 'expand_more' }}
                  </mat-icon>
                </div>
              </mat-card-header>

              <!-- Message Content (expanded) -->
              <mat-card-content *ngIf="isMessageExpanded(message.messageId)"
                               class="message-content"
                               [@expandCollapse]>

                <!-- Full recipient details -->
                <div class="full-recipients" *ngIf="message.to || message.cc || message.bcc">
                  <div class="recipient-row" *ngIf="message.to && message.to.length > 0">
                    <span class="recipient-label">to:</span>
                    <span class="recipient-list">{{ message.to.join(', ') }}</span>
                  </div>
                  <div class="recipient-row" *ngIf="message.cc && message.cc.length > 0">
                    <span class="recipient-label">cc:</span>
                    <span class="recipient-list">{{ message.cc.join(', ') }}</span>
                  </div>
                  <div class="recipient-row" *ngIf="message.bcc && message.bcc.length > 0">
                    <span class="recipient-label">bcc:</span>
                    <span class="recipient-list">{{ message.bcc.join(', ') }}</span>
                  </div>
                </div>

                <mat-divider *ngIf="message.to || message.cc || message.bcc" class="content-divider"></mat-divider>

                <!-- Message body -->
                <div class="message-body" [innerHTML]="getSafeHtml(message.htmlContent || message.textContent)"></div>

                <!-- Attachments -->
                <div *ngIf="message.attachments && message.attachments.length > 0" class="attachments-section">
                  <mat-divider class="content-divider"></mat-divider>
                  <h4>Attachments</h4>
                  <div class="attachments-list">
                    <mat-chip *ngFor="let attachment of message.attachments" class="attachment-chip">
                      <mat-icon>attach_file</mat-icon>
                      {{ attachment.filename }}
                      <span class="file-size">({{ formatFileSize(attachment.size) }})</span>
                    </mat-chip>
                  </div>
                </div>

                <!-- Message actions -->
                <div class="message-actions">
                  <button mat-button (click)="replyToMessage(message)" [disabled]="currentFolder === 'DRAFTS'">
                    <mat-icon>reply</mat-icon>
                    Reply
                  </button>
                  <button mat-button (click)="replyAllToMessage(message)" [disabled]="currentFolder === 'DRAFTS'">
                    <mat-icon>reply_all</mat-icon>
                    Reply All
                  </button>
                  <button mat-button (click)="forwardMessage(message)">
                    <mat-icon>forward</mat-icon>
                    Forward
                  </button>
                  <button mat-icon-button [matMenuTriggerFor]="messageMenu" matTooltip="More actions">
                    <mat-icon>more_vert</mat-icon>
                  </button>

                  <mat-menu #messageMenu="matMenu">
                    <button mat-menu-item (click)="toggleMessageReadStatus(message)">
                      <mat-icon>{{ message.unread ? 'mark_email_read' : 'mark_email_unread' }}</mat-icon>
                      {{ message.unread ? 'Mark as read' : 'Mark as unread' }}
                    </button>
                    <button mat-menu-item (click)="deleteMessage(message.messageId)">
                      <mat-icon>delete</mat-icon>
                      Delete
                    </button>
                    <button mat-menu-item (click)="printMessage(message)">
                      <mat-icon>print</mat-icon>
                      Print
                    </button>
                  </mat-menu>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>

        <!-- Inline Reply Component Placeholder -->
        <div *ngIf="showInlineReply" class="inline-reply-container" [@expandCollapse]>
          <!-- This will be replaced with the actual InlineReplyComponent -->
          <mat-card class="reply-card">
            <mat-card-header>
              <mat-card-title>{{ replyType === 'reply' ? 'Reply' : replyType === 'replyAll' ? 'Reply All' : 'Forward' }}</mat-card-title>
              <button mat-icon-button (click)="cancelInlineReply()">
                <mat-icon>close</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content>
              <p>Inline reply component will be implemented here</p>
              <div class="reply-actions">
                <button mat-raised-button color="primary">Send</button>
                <button mat-button (click)="cancelInlineReply()">Cancel</button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .enhanced-mail-detail {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #f8f9fa;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #e8eaed;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-button {
      color: #5f6368;
    }

    .conversation-info {
      flex: 1;
      min-width: 0;
    }

    .conversation-info h2 {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 400;
      color: #202124;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .participants {
      margin: 0;
      color: #5f6368;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .action-buttons button {
      color: #5f6368;
    }

    .conversation-container {
      flex: 1;
      overflow-y: auto;
      padding: 0 24px 24px;
    }

    .collapsed-summary {
      margin: 16px 0;
      display: flex;
      justify-content: center;
    }

    .expand-button {
      color: #1a73e8;
      font-weight: 500;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .message-wrapper {
      transition: all 0.2s ease;
    }

    .message-card {
      border: 1px solid #e8eaed;
      border-radius: 8px;
      transition: all 0.2s ease;
      overflow: hidden;
    }

    .message-card:hover {
      box-shadow: 0 1px 3px rgba(60, 64, 67, 0.12), 0 1px 2px rgba(60, 64, 67, 0.24);
    }

    .message-card.unread {
      border-left: 4px solid #1a73e8;
      background: #f8f9ff;
    }

    .message-card.last-message {
      border-left: 4px solid #34a853;
    }

    .message-header {
      cursor: pointer;
      padding: 16px;
      border-bottom: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .message-header:hover {
      background: rgba(26, 115, 232, 0.04);
    }

    .message-card.expanded .message-header {
      border-bottom-color: #e8eaed;
    }

    .sender-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex: 1;
    }

    .avatar {
      color: #5f6368;
    }

    .avatar mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .sender-details {
      flex: 1;
      min-width: 0;
    }

    .sender-name {
      font-weight: 500;
      color: #202124;
      font-size: 14px;
    }

    .sender-email {
      color: #5f6368;
      font-size: 12px;
      margin-top: 2px;
    }

    .recipients {
      color: #5f6368;
      font-size: 12px;
      margin-top: 2px;
    }

    .message-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #5f6368;
    }

    .message-date {
      font-size: 12px;
      white-space: nowrap;
    }

    .attachment-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .expand-icon {
      transition: transform 0.2s ease;
    }

    .expand-icon.expanded {
      transform: rotate(0deg);
    }

    .message-content {
      padding: 0 16px 16px;
    }

    .full-recipients {
      margin-bottom: 16px;
    }

    .recipient-row {
      display: flex;
      gap: 8px;
      margin-bottom: 4px;
      font-size: 13px;
    }

    .recipient-label {
      color: #5f6368;
      min-width: 24px;
      font-weight: 500;
    }

    .recipient-list {
      color: #202124;
      word-break: break-all;
    }

    .content-divider {
      margin: 16px 0;
    }

    .message-body {
      line-height: 1.6;
      color: #202124;
      font-size: 14px;
      word-wrap: break-word;
    }

    .message-body img {
      max-width: 100%;
      height: auto;
    }

    .attachments-section h4 {
      color: #5f6368;
      font-size: 13px;
      font-weight: 500;
      margin: 0 0 8px 0;
    }

    .attachments-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .attachment-chip {
      background: #f1f3f4;
      color: #5f6368;
    }

    .file-size {
      margin-left: 4px;
      font-size: 11px;
    }

    .message-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e8eaed;
    }

    .message-actions button {
      color: #5f6368;
    }

    .inline-reply-container {
      margin-top: 16px;
    }

    .reply-card {
      border: 2px solid #1a73e8;
    }

    .reply-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    @media (max-width: 768px) {
      .detail-header {
        padding: 12px 16px;
        flex-wrap: wrap;
      }

      .conversation-container {
        padding: 0 16px 16px;
      }

      .sender-info {
        flex-direction: column;
        gap: 8px;
      }

      .message-meta {
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .message-actions {
        flex-wrap: wrap;
      }
    }
  `]
})
export class EnhancedMailDetailComponent implements OnInit, OnDestroy {
  conversation: ConversationDTO | null = null;
  isLoading = false;
  errorMessage = '';

  // Message visibility and expansion
  visibleMessages: EmailDetailDTO[] = [];
  collapsedMessages: EmailDetailDTO[] = [];
  expandedMessageIds: Set<string> = new Set();

  // Inline reply state
  showInlineReply = false;
  replyType: 'reply' | 'replyAll' | 'forward' = 'reply';
  selectedReplyMessage: EmailDetailDTO | null = null;

  private destroy$ = new Subject<void>();
  private threadId = '';
  currentFolder = 'INBOX';

  constructor(
    private mailService: MailService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.threadId = params['threadId'];
      if (this.threadId) {
        this.loadConversation();
      }
    });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data['folder']) {
        this.currentFolder = data['folder'];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConversation(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.mailService.getConversationThread(this.threadId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversation: ConversationDTO) => {
          this.conversation = conversation;
          this.setupMessageVisibility();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
  }

  private setupMessageVisibility(): void {
    if (!this.conversation?.messages) return;

    const messages = [...this.conversation.messages].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (messages.length <= 1) {
      this.visibleMessages = messages;
      this.collapsedMessages = [];
      // Expand the only message
      if (messages.length === 1) {
        this.expandedMessageIds.add(messages[0].messageId);
      }
    } else {
      // Show only the most recent message expanded by default
      const lastMessage = messages[messages.length - 1];
      this.visibleMessages = [lastMessage];
      this.collapsedMessages = messages.slice(0, -1);
      this.expandedMessageIds.add(lastMessage.messageId);
    }
  }

  expandAllMessages(): void {
    if (!this.conversation?.messages) return;

    this.visibleMessages = [...this.conversation.messages].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    this.collapsedMessages = [];

    // Expand all messages
    this.visibleMessages.forEach(msg => this.expandedMessageIds.add(msg.messageId));
  }

  isMessageExpanded(messageId: string): boolean {
    return this.expandedMessageIds.has(messageId);
  }

  toggleMessage(messageId: string): void {
    if (this.expandedMessageIds.has(messageId)) {
      this.expandedMessageIds.delete(messageId);
    } else {
      this.expandedMessageIds.add(messageId);
    }
  }

  getSafeHtml(content: string): SafeHtml {
    // Basic sanitization - you might want to use a more robust solution
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  // Reply functions
  replyToMessage(message: EmailDetailDTO): void {
    this.replyType = 'reply';
    this.selectedReplyMessage = message;
    this.showInlineReply = true;
  }

  replyAllToMessage(message: EmailDetailDTO): void {
    this.replyType = 'replyAll';
    this.selectedReplyMessage = message;
    this.showInlineReply = true;
  }

  forwardMessage(message: EmailDetailDTO): void {
    this.replyType = 'forward';
    this.selectedReplyMessage = message;
    this.showInlineReply = true;
  }

  cancelInlineReply(): void {
    this.showInlineReply = false;
    this.selectedReplyMessage = null;
  }

  // Utility functions
  trackByMessageId: TrackByFunction<EmailDetailDTO> = (index: number, message: EmailDetailDTO): string => {
    return message.messageId;
  }

  extractDisplayName(email: string): string {
    const match = email.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim() : email.split('@')[0];
  }

  extractEmailAddress(email: string): string {
    const match = email.match(/<(.+)>$/);
    return match ? match[1] : email;
  }

  getRecipientsPreview(recipients: string[]): string {
    if (!recipients || recipients.length === 0) return '';

    if (recipients.length === 1) {
      return this.extractDisplayName(recipients[0]);
    }

    return `${this.extractDisplayName(recipients[0])} and ${recipients.length - 1} other${recipients.length > 2 ? 's' : ''}`;
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 2) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getParticipantsDisplay(participants: string[]): string {
    if (!participants || participants.length === 0) return 'Unknown';

    if (participants.length === 1) {
      return this.extractDisplayName(participants[0]);
    }

    if (participants.length === 2) {
      return participants.map(p => this.extractDisplayName(p)).join(', ');
    }

    const first = this.extractDisplayName(participants[0]);
    return `${first} and ${participants.length - 1} other${participants.length > 2 ? 's' : ''}`;
  }

  // Action methods
  goBack(): void {
    const folderRoute = this.currentFolder.toLowerCase();
    this.router.navigate([`/${folderRoute}`]);
  }

  hasUnreadMessages(): boolean {
    return this.conversation?.messages?.some(msg => msg.unread) || false;
  }

  markAllAsRead(): void {
    if (!this.conversation?.messages) return;
    const messageIds = this.conversation.messages.map(msg => msg.messageId);
    this.performEmailAction(messageIds, EmailAction.MARK_AS_READ);
  }

  markAllAsUnread(): void {
    if (!this.conversation?.messages) return;
    const messageIds = this.conversation.messages.map(msg => msg.messageId);
    this.performEmailAction(messageIds, EmailAction.MARK_AS_UNREAD);
  }

  archiveConversation(): void {
    if (!this.conversation?.messages) return;
    const messageIds = this.conversation.messages.map(msg => msg.messageId);
    this.performEmailAction(messageIds, EmailAction.ARCHIVE);
  }

  deleteConversation(): void {
    if (!this.conversation?.messages) return;
    const messageIds = this.conversation.messages.map(msg => msg.messageId);
    this.performEmailAction(messageIds, EmailAction.DELETE);
  }

  deleteMessage(messageId: string): void {
    this.performEmailAction([messageId], EmailAction.DELETE);
  }

  toggleMessageReadStatus(message: EmailDetailDTO): void {
    const action = message.unread ? EmailAction.MARK_AS_READ : EmailAction.MARK_AS_UNREAD;
    this.performEmailAction([message.messageId], action);
  }

  addLabel(): void {
    // Implement label addition
    this.snackBar.open('Label functionality to be implemented', 'Close', { duration: 3000 });
  }

  moveToFolder(): void {
    // Implement folder move
    this.snackBar.open('Move to folder functionality to be implemented', 'Close', { duration: 3000 });
  }

  printMessage(message: EmailDetailDTO): void {
    // Implement print functionality
    this.snackBar.open('Print functionality to be implemented', 'Close', { duration: 3000 });
  }

  private performEmailAction(messageIds: string[], action: EmailAction): void {
    if (messageIds.length === 0) return;

    const request: EmailActionRequest = { messageIds, action };

    this.mailService.performEmailActions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.updateLocalState(messageIds, action);
          const actionName = action.toLowerCase().replace('_', ' ');
          this.snackBar.open(`Action "${actionName}" completed successfully`, 'Close', { duration: 3000 });

          if (action === EmailAction.DELETE || action === EmailAction.ARCHIVE) {
            if (!this.conversation?.messages || this.conversation.messages.length === 0) {
              this.goBack();
            }
          }
        },
        error: (error) => {
          this.handleError(error);
        }
      });
  }

  private updateLocalState(messageIds: string[], action: EmailAction): void {
    if (!this.conversation?.messages) return;

    messageIds.forEach(messageId => {
      const message = this.conversation!.messages!.find(msg => msg.messageId === messageId);
      if (message) {
        switch (action) {
          case EmailAction.MARK_AS_READ:
            message.unread = false;
            break;
          case EmailAction.MARK_AS_UNREAD:
            message.unread = true;
            break;
          case EmailAction.DELETE:
            this.conversation!.messages = this.conversation!.messages!.filter(
              msg => msg.messageId !== messageId
            );
            break;
        }
      }
    });

    // Update visible messages after state change
    this.setupMessageVisibility();
  }

  private handleError(error: any): void {
    console.error('Error in mail detail:', error);

    if (error.status === 401) {
      this.errorMessage = 'Authentication failed. Please log in again.';
    } else if (error.status === 404) {
      this.errorMessage = 'Conversation not found.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to server. Please check your connection.';
    } else {
      this.errorMessage = error.error?.message || 'An error occurred. Please try again.';
    }

    this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
  }
}