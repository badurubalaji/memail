import { Component, OnInit, OnDestroy, TrackByFunction } from '@angular/core';
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
import DOMPurify from 'dompurify';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MailService } from '../../core/services/mail.service';
import { LabelService, Label } from '../../core/services/label.service';
import { ConversationDTO, EmailDetailDTO, EmailActionRequest, EmailAction } from '../../shared/models/conversation.models';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LabelDropdownComponent } from '../../shared/components/label-dropdown/label-dropdown.component';
import { InlineReplyComponent, ReplyData, ReplyRequest } from './inline-reply.component';
import { EnhancedComposeComponent } from './enhanced-compose.component';

@Component({
  selector: 'app-mail-detail',
  standalone: true,
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
    ErrorStateComponent,
    LabelDropdownComponent,
    InlineReplyComponent
  ],
  template: `
    <div class="gmail-conversation-view">
      <!-- Conversation Header -->
      <div class="conversation-header" *ngIf="conversation">
        <div class="header-top">
          <button mat-icon-button class="back-button" (click)="goBack()" matTooltip="Back to inbox">
            <mat-icon>arrow_back</mat-icon>
          </button>

          <div class="conversation-actions">
            <button mat-icon-button matTooltip="Archive" (click)="archiveConversation()">
              <mat-icon>archive</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Report spam" (click)="reportSpam()">
              <mat-icon>report</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Delete" (click)="deleteConversation()">
              <mat-icon>delete</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Mark as unread" (click)="markAsUnread()">
              <mat-icon>mark_email_unread</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Snooze" (click)="snoozeConversation()">
              <mat-icon>schedule</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Add to tasks" (click)="addToTasks()">
              <mat-icon>add_task</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Move to" [matMenuTriggerFor]="moveMenu">
              <mat-icon>folder</mat-icon>
            </button>
            <app-label-dropdown
              [messageUids]="getConversationMessageIds()"
              [folder]="currentFolder"
              (labelApplied)="onLabelApplied($event)"
              (labelRemoved)="onLabelRemoved($event)">
            </app-label-dropdown>
            <button mat-icon-button matTooltip="More" [matMenuTriggerFor]="moreActionsMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
          </div>
        </div>

        <div class="header-info">
          <h1 class="conversation-subject">{{ conversation.subject || '(No Subject)' }}</h1>
          <div class="conversation-meta">
            <span class="message-count">{{ conversation.messageCount }} message{{ conversation.messageCount !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-state
        *ngIf="isLoading"
        message="Loading conversation...">
      </app-loading-state>

      <!-- Error State -->
      <app-error-state
        *ngIf="errorMessage"
        title="Unable to load conversation"
        [message]="errorMessage"
        (retry)="loadConversation()">
      </app-error-state>

      <!-- Messages Container -->
      <div *ngIf="conversation && conversation.messages" class="messages-container">
        <!-- Inline Reply (Shown at top when active) -->
        <app-inline-reply
          *ngIf="showInlineReply && currentReplyData"
          [replyData]="currentReplyData"
          (sendReply)="handleSendReply($event)"
          (cancel)="hideInlineReply()"
          (saveDraftEvent)="handleSaveDraft($event)">
        </app-inline-reply>

        <!-- Collapsed Messages Indicator -->
        <div *ngIf="hasCollapsedMessages()" class="collapsed-messages-bar">
          <button mat-button class="expand-all-button" (click)="expandAllMessages()">
            <mat-icon>expand_more</mat-icon>
            {{ getCollapsedMessageCount() }} earlier message{{ getCollapsedMessageCount() > 1 ? 's' : '' }}
          </button>
        </div>

        <!-- Message Thread -->
        <div class="message-thread">
          <div *ngFor="let message of conversation.messages; let i = index; trackBy: trackByMessageId"
               class="message-item"
               [class.expanded]="isMessageExpanded(i)"
               [class.unread]="message.unread">

            <!-- Collapsed Message Preview -->
            <div *ngIf="!isMessageExpanded(i)"
                 class="message-collapsed"
                 (click)="expandMessage(i)">
              <div class="collapsed-avatar">
                <div class="avatar-circle">{{ getInitials(message.from) }}</div>
              </div>
              <div class="collapsed-content">
                <div class="collapsed-header">
                  <span class="sender-name">{{ extractDisplayName(message.from) }}</span>
                  <span class="message-time">{{ formatTime(message.date) }}</span>
                </div>
                <div class="message-snippet">{{ getMessagePreview(message) }}</div>
              </div>
              <div class="collapsed-indicators">
                <mat-icon *ngIf="message.hasAttachments" class="attachment-icon">attach_file</mat-icon>
                <div *ngIf="message.unread" class="unread-dot"></div>
              </div>
            </div>

            <!-- Expanded Message -->
            <div *ngIf="isMessageExpanded(i)" class="message-expanded">
              <!-- Message Header -->
              <div class="message-header">
                <div class="header-left">
                  <div class="sender-avatar">
                    <div class="avatar-circle">{{ getInitials(message.from) }}</div>
                  </div>
                  <div class="sender-info">
                    <div class="sender-name">{{ extractDisplayName(message.from) }}</div>
                    <div class="sender-email">&lt;{{ extractEmailAddress(message.from) }}&gt;</div>
                  </div>
                </div>
                <div class="header-right">
                  <span class="message-date">{{ formatFullDate(message.date) }}</span>
                  <button mat-icon-button class="star-button" matTooltip="Star">
                    <mat-icon>star_border</mat-icon>
                  </button>
                  <button mat-icon-button (click)="startReply(message, 'reply')" matTooltip="Reply">
                    <mat-icon>reply</mat-icon>
                  </button>
                  <button mat-icon-button [matMenuTriggerFor]="messageActionsMenu" matTooltip="More">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Recipients Section -->
              <div *ngIf="message.to || message.cc || message.bcc" class="recipients-section">
                <!-- To Recipients -->
                <div *ngIf="message.to" class="recipients-row">
                  <span class="to-label">to</span>
                  <span class="recipients-list">{{ formatRecipients(message.to) }}</span>
                  <button *ngIf="hasAdditionalRecipients(message)"
                          mat-button
                          class="show-details-btn"
                          (click)="toggleMessageDetails(i)">
                    <mat-icon>{{ showMessageDetails[i] ? 'expand_less' : 'expand_more' }}</mat-icon>
                  </button>
                </div>

                <!-- CC Recipients (always visible when present) -->
                <div *ngIf="message.cc" class="cc-row">
                  <span class="cc-label">cc</span>
                  <span class="cc-list">{{ formatRecipients(message.cc) }}</span>
                </div>

                <!-- BCC Recipients (always visible when present) -->
                <div *ngIf="message.bcc" class="bcc-row">
                  <span class="bcc-label">bcc</span>
                  <span class="bcc-list">{{ formatRecipients(message.bcc) }}</span>
                </div>

                <!-- Additional recipient details when expanded -->
                <div *ngIf="showMessageDetails[i] && hasAdditionalRecipients(message)" class="additional-recipients">
                  <!-- Show full recipient list when there are many recipients -->
                  <div *ngIf="hasMoreThanTwoRecipients(message.to)" class="full-to-row">
                    <span class="to-label">to (full)</span>
                    <span class="recipients-list">{{ formatAllRecipients(message.to) }}</span>
                  </div>
                </div>
              </div>

              <!-- Message Content -->
              <div class="message-body">
                <div class="message-content" [innerHTML]="getMessageContent(message)"></div>
              </div>

              <!-- Message Actions -->
              <div class="message-actions-bar">
                <button mat-button class="reply-button" (click)="startReply(message, 'reply')">
                  <mat-icon>reply</mat-icon>
                  Reply
                </button>
                <button mat-button class="reply-all-button" (click)="startReply(message, 'replyAll')">
                  <mat-icon>reply_all</mat-icon>
                  Reply all
                </button>
                <button mat-button class="forward-button" (click)="startReply(message, 'forward')">
                  <mat-icon>forward</mat-icon>
                  Forward
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Menus -->
      <mat-menu #moveMenu="matMenu">
        <button mat-menu-item (click)="moveToFolder('INBOX')">
          <mat-icon>inbox</mat-icon>
          <span>Inbox</span>
        </button>
        <button mat-menu-item (click)="moveToFolder('SPAM')">
          <mat-icon>report</mat-icon>
          <span>Spam</span>
        </button>
        <button mat-menu-item (click)="moveToFolder('TRASH')">
          <mat-icon>delete</mat-icon>
          <span>Trash</span>
        </button>
      </mat-menu>

      <mat-menu #labelsMenu="matMenu">
        <button mat-menu-item>Important</button>
        <button mat-menu-item>Work</button>
        <button mat-menu-item>Personal</button>
      </mat-menu>

      <mat-menu #moreActionsMenu="matMenu">
        <button mat-menu-item (click)="markAllAsRead()">Mark all as read</button>
        <button mat-menu-item (click)="markAllAsUnread()">Mark all as unread</button>
        <button mat-menu-item>Filter messages like these</button>
        <button mat-menu-item>Mute</button>
      </mat-menu>

      <mat-menu #messageActionsMenu="matMenu">
        <button mat-menu-item>Reply</button>
        <button mat-menu-item>Reply all</button>
        <button mat-menu-item>Forward</button>
        <button mat-menu-item>Delete this message</button>
        <button mat-menu-item>Report spam</button>
        <button mat-menu-item>Show original</button>
      </mat-menu>
    </div>
  `,
  styles: [`
    .gmail-conversation-view {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* Conversation Header */
    .conversation-header {
      background: #ffffff;
      padding: 8px 16px;
      flex-shrink: 0;
      box-sizing: border-box;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      min-height: 48px;
    }

    .back-button {
      color: #5f6368;
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      padding: 0;
      margin-right: 8px;
      border: none;
      background: transparent;
      overflow: visible;
      transition: background-color 0.2s ease;
      flex-shrink: 0;
    }

    .back-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
    }

    .back-button:hover {
      background-color: rgba(95, 99, 104, 0.15);
      cursor: pointer;
    }

    .conversation-actions {
      display: flex;
      gap: 4px;
      align-items: center;
      flex-wrap: nowrap;
      overflow-x: auto;
    }

    .conversation-actions button {
      color: #5f6368;
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      padding: 0;
      margin: 0;
      border: none;
      background: transparent;
      overflow: visible;
      transition: background-color 0.2s ease;
      flex-shrink: 0;
    }

    .conversation-actions button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .conversation-actions button:hover {
      background-color: rgba(95, 99, 104, 0.15);
      cursor: pointer;
    }

    .header-info {
      padding-left: 48px;
      padding-bottom: 0;
      margin-bottom: 0;
    }

    .conversation-subject {
      font-size: 22px;
      font-weight: 400;
      color: #202124;
      margin: 0 0 4px 0;
      line-height: 28px;
    }

    .conversation-meta {
      font-size: 13px;
      color: #5f6368;
    }

    /* Messages Container */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      background: #ffffff;
      box-sizing: border-box;
    }

    .collapsed-messages-bar {
      padding: 12px 24px;
      border-bottom: 1px solid #f0f0f0;
      text-align: center;
    }

    .expand-all-button {
      color: #1a73e8;
      font-size: 13px;
    }

    .message-thread {
      max-width: 900px;
      margin: 0 auto;
      padding: 16px 24px;
      box-sizing: border-box;
    }

    .message-item {
      margin: 16px 0;
      position: relative;
    }

    /* Collapsed Message */
    .message-collapsed {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      cursor: pointer;
      transition: box-shadow 0.2s ease;
    }

    .message-collapsed:hover {
      box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3);
    }

    .collapsed-avatar {
      margin-right: 12px;
    }

    .collapsed-content {
      flex: 1;
      min-width: 0;
    }

    .collapsed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .sender-name {
      font-weight: 500;
      color: #202124;
      font-size: 14px;
    }

    .message-time {
      color: #5f6368;
      font-size: 12px;
    }

    .message-snippet {
      color: #5f6368;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .collapsed-indicators {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 12px;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #1a73e8;
    }

    /* Expanded Message */
    .message-expanded {
      border: 1px solid #e8eaed;
      border-radius: 8px;
      background: #ffffff;
      overflow: hidden;
      box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.1), 0 1px 3px 1px rgba(60, 64, 67, 0.08);
      margin-bottom: 12px;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sender-avatar {
      flex-shrink: 0;
    }

    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #1a73e8;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 13px;
    }

    .sender-info {
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
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .header-right button {
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #5f6368;
      border-radius: 50%;
      padding: 0;
      margin: 0;
      border: none;
      background: transparent;
      overflow: visible;
    }

    .header-right button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-right button:hover {
      background-color: rgba(95, 99, 104, 0.1);
    }

    .message-date {
      color: #5f6368;
      font-size: 12px;
      margin-right: 8px;
    }

    .star-button {
      color: #dadce0;
    }

    .star-button:hover {
      color: #fbbc04;
    }

    /* Recipients Section */
    .recipients-section {
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e8eaed;
    }

    .recipients-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .to-label, .cc-label, .bcc-label {
      color: #5f6368;
      font-weight: 500;
      min-width: 30px;
      text-transform: lowercase;
    }

    .recipients-list, .cc-list, .bcc-list {
      color: #202124;
      flex: 1;
      word-break: break-word;
    }

    .show-details-btn {
      color: #5f6368;
      font-size: 12px;
      min-height: auto;
      padding: 2px 4px;
    }

    .additional-recipients {
      margin-top: 4px;
    }

    .cc-row, .bcc-row, .full-to-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      margin: 2px 0;
    }

    .cc-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      margin-top: 4px;
      padding: 4px 8px;
      background-color: rgba(26, 115, 232, 0.08);
      border-radius: 4px;
      border-left: 3px solid #1a73e8;
    }

    .bcc-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      margin-top: 4px;
      padding: 4px 8px;
      background-color: rgba(219, 68, 55, 0.08);
      border-radius: 4px;
      border-left: 3px solid #db4437;
    }

    /* Message Body */
    .message-body {
      padding: 16px;
      min-height: 100px;
    }

    .message-content {
      line-height: 1.6;
      color: #202124;
      font-size: 14px;
      word-wrap: break-word;
      word-break: break-word;
      overflow-wrap: break-word;
      padding: 0;
      margin: 0;
    }

    .message-content img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 12px 0;
    }

    .message-content p {
      margin: 0 0 12px 0;
      line-height: 1.6;
    }

    .message-content p:last-child {
      margin-bottom: 0;
    }

    .message-content a {
      color: #1a73e8;
      text-decoration: none;
    }

    .message-content a:hover {
      text-decoration: underline;
    }

    .message-content blockquote {
      margin: 12px 0;
      padding: 8px 16px;
      border-left: 3px solid #e8eaed;
      background: #f8f9fa;
      color: #5f6368;
    }

    .message-content pre {
      background: #f8f9fa;
      border: 1px solid #e8eaed;
      border-radius: 4px;
      padding: 12px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }

    .message-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
    }

    .message-content table td,
    .message-content table th {
      border: 1px solid #e8eaed;
      padding: 8px;
      text-align: left;
    }

    .message-content table th {
      background: #f8f9fa;
      font-weight: 500;
    }

    .message-content ul,
    .message-content ol {
      margin: 8px 0;
      padding-left: 24px;
    }

    .message-content li {
      margin: 4px 0;
    }

    .message-content:empty::before {
      content: 'No message content';
      color: #5f6368;
      font-style: italic;
    }

    /* Message Actions */
    .message-actions-bar {
      padding: 12px 16px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      gap: 12px;
      align-items: center;
      background: #fafafa;
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
    }

    .reply-button, .reply-all-button, .forward-button {
      color: #202124;
      font-size: 13px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 16px;
      border-radius: 18px;
      background: transparent;
      border: 1px solid #dadce0;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: none;
      letter-spacing: 0.25px;
      line-height: 36px;
    }

    .reply-button:hover, .reply-all-button:hover, .forward-button:hover {
      background-color: rgba(26, 115, 232, 0.04);
      border-color: #c6c6c6;
      box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    }

    .reply-button mat-icon, .reply-all-button mat-icon, .forward-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #5f6368;
    }

    .attachment-icon {
      color: #5f6368;
      font-size: 16px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .conversation-header {
        padding: 8px 16px;
      }

      .header-info {
        padding-left: 48px;
      }

      .conversation-subject {
        font-size: 18px;
      }

      .message-thread {
        padding: 0 16px;
      }

      .conversation-actions {
        gap: 2px;
      }

      .conversation-actions button {
        width: 36px;
        height: 36px;
      }

      .message-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .header-right {
        align-self: flex-end;
      }
    }

    @media (max-width: 480px) {
      .conversation-actions {
        flex-wrap: wrap;
      }

      .message-collapsed {
        padding: 6px 8px;
      }

      .avatar-circle {
        width: 28px;
        height: 28px;
        font-size: 12px;
      }
    }
  `]
})
export class MailDetailComponent implements OnInit, OnDestroy {
  conversation: ConversationDTO | null = null;
  isLoading = false;
  errorMessage = '';
  selectedMessages: string[] = [];
  isPerformingAction = false;

  // New properties for threaded view
  expandedMessages: Set<number> = new Set();
  showMessageDetails: boolean[] = [];
  showInlineReply = false;
  currentReplyData: ReplyData | null = null;
  currentMenuMessage: EmailDetailDTO | null = null;

  private destroy$ = new Subject<void>();
  private threadId = '';
  currentFolder = 'INBOX'; // Made public for template access

  constructor(
    private mailService: MailService,
    private labelService: LabelService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.threadId = params['threadId'];
      if (this.threadId) {
        this.loadConversation();
      }
    });

    // Detect current folder from the route
    this.route.url.pipe(takeUntil(this.destroy$)).subscribe(urlSegments => {
      if (urlSegments.length > 0) {
        const folderPath = urlSegments[0].path;
        switch (folderPath) {
          case 'inbox':
            this.currentFolder = 'INBOX';
            break;
          case 'sent':
            this.currentFolder = 'SENT';
            break;
          case 'drafts':
            this.currentFolder = 'DRAFTS';
            break;
          case 'trash':
            this.currentFolder = 'TRASH';
            break;
          default:
            this.currentFolder = 'INBOX';
        }
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
          // Reverse messages to show latest first
          if (conversation.messages) {
            conversation.messages = conversation.messages.reverse();
          }
          this.conversation = conversation;
          this.initializeThreadView();
          // Don't automatically mark as read - let users manually mark if desired
          // this.markUnreadMessagesAsRead();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading conversation:', error);

          if (error.status === 401) {
            this.errorMessage = 'Authentication failed. Please log in again.';
          } else if (error.status === 404) {
            this.errorMessage = 'Conversation not found.';
          } else if (error.status === 0) {
            this.errorMessage = 'Unable to connect to server. Please check your connection.';
          } else {
            this.errorMessage = error.error?.message || 'Failed to load conversation. Please try again.';
          }

          this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
      });
  }

  goBack(): void {
    const folderRoute = this.currentFolder.toLowerCase();
    this.router.navigate([`/${folderRoute}`]);
  }

  getParticipantsDisplay(participants: string[]): string {
    if (!participants || participants.length === 0) {
      return 'Unknown';
    }

    if (participants.length === 1) {
      return this.extractDisplayName(participants[0]);
    }

    if (participants.length === 2) {
      return participants.map(p => this.extractDisplayName(p)).join(', ');
    }

    const first = this.extractDisplayName(participants[0]);
    return `${first} and ${participants.length - 1} other${participants.length > 2 ? 's' : ''}`;
  }

  extractDisplayName(email: string): string {
    const match = email.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim() : email.split('@')[0];
  }

  extractEmailAddress(email: string): string {
    const match = email.match(/<(.+)>$/);
    return match ? match[1] : email;
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

  trackByMessageId: TrackByFunction<EmailDetailDTO> = (index: number, message: EmailDetailDTO): string => {
    return message.messageId;
  }

  isMessageSelected(messageId: string): boolean {
    return this.selectedMessages.includes(messageId);
  }

  toggleMessageSelection(messageId: string, selected: boolean): void {
    if (selected) {
      if (!this.selectedMessages.includes(messageId)) {
        this.selectedMessages.push(messageId);
      }
    } else {
      this.selectedMessages = this.selectedMessages.filter(id => id !== messageId);
    }
  }

  clearSelection(): void {
    this.selectedMessages = [];
  }

  hasUnreadMessages(): boolean {
    return this.conversation?.messages?.some(msg => msg.unread) || false;
  }

  hasReadMessages(): boolean {
    return this.conversation?.messages?.some(msg => !msg.unread) || false;
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

  markSelectedAsRead(): void {
    this.performEmailAction([...this.selectedMessages], EmailAction.MARK_AS_READ);
  }

  markSelectedAsUnread(): void {
    this.performEmailAction([...this.selectedMessages], EmailAction.MARK_AS_UNREAD);
  }

  deleteSelected(): void {
    this.performEmailAction([...this.selectedMessages], EmailAction.DELETE);
  }

  deleteMessage(messageId: string): void {
    this.performEmailAction([messageId], EmailAction.DELETE);
  }

  toggleMessageReadStatus(message: EmailDetailDTO): void {
    const action = message.unread ? EmailAction.MARK_AS_READ : EmailAction.MARK_AS_UNREAD;
    this.performEmailAction([message.messageId], action);
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

  private performEmailAction(messageIds: string[], action: EmailAction): void {
    if (messageIds.length === 0) return;

    this.isPerformingAction = true;
    const request: EmailActionRequest = { messageIds, action };

    this.mailService.performEmailActions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isPerformingAction = false;

          // Update local state based on action
          if (this.conversation?.messages) {
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
                    // Remove deleted messages from the conversation
                    this.conversation!.messages = this.conversation!.messages!.filter(
                      msg => msg.messageId !== messageId
                    );
                    break;
                }
              }
            });
          }

          // Clear selection after action
          this.selectedMessages = [];

          // Show success message
          const actionName = action.toLowerCase().replace('_', ' ');
          this.snackBar.open(`Action "${actionName}" completed successfully`, 'Close', { duration: 3000 });

          // If conversation is deleted or archived, go back
          if (action === EmailAction.DELETE || action === EmailAction.ARCHIVE) {
            if (!this.conversation?.messages || this.conversation.messages.length === 0) {
              this.goBack();
            }
          }
        },
        error: (error) => {
          this.isPerformingAction = false;
          console.error('Error performing email action:', error);

          const errorMessage = error.error?.message || 'Failed to perform action. Please try again.';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
      });
  }

  // New threading-related methods
  private initializeThreadView(): void {
    if (!this.conversation?.messages) return;

    // Initialize message details array - false by default (collapsed details)
    this.showMessageDetails = new Array(this.conversation.messages.length).fill(false);

    // By default, expand ALL messages to ensure content is visible
    for (let i = 0; i < this.conversation.messages.length; i++) {
      this.expandedMessages.add(i);
    }

    // Debug logging for content
    this.conversation.messages.forEach((message, index) => {
      console.log(`Message ${index} (${message.messageId}):`, {
        hasHtml: !!message.htmlContent,
        hasText: !!message.textContent,
        htmlLength: message.htmlContent?.length || 0,
        textLength: message.textContent?.length || 0,
        subject: message.subject
      });
    });
  }

  isMessageExpanded(index: number): boolean {
    return this.expandedMessages.has(index);
  }

  expandMessage(index: number): void {
    this.expandedMessages.add(index);
  }

  collapseMessage(index: number): void {
    // Don't allow collapsing the only expanded message
    if (this.expandedMessages.size > 1) {
      this.expandedMessages.delete(index);
    }
  }

  expandAllMessages(): void {
    if (!this.conversation?.messages) return;
    for (let i = 0; i < this.conversation.messages.length; i++) {
      this.expandedMessages.add(i);
    }
  }

  hasCollapsedMessages(): boolean {
    return this.conversation?.messages ?
      this.expandedMessages.size < this.conversation.messages.length : false;
  }

  getCollapsedMessageCount(): number {
    return this.conversation?.messages ?
      this.conversation.messages.length - this.expandedMessages.size : 0;
  }

  toggleMessageDetails(index: number): void {
    this.showMessageDetails[index] = !this.showMessageDetails[index];
  }

  hasAdditionalRecipients(message: EmailDetailDTO): boolean {
    let hasMultipleTo = false;
    if (message.to) {
      if (Array.isArray(message.to)) {
        hasMultipleTo = message.to.length > 1;
      } else {
        // Handle case where backend sends as string despite interface definition
        const toStr = message.to as any as string;
        hasMultipleTo = toStr.includes(',');
      }
    }
    return !!(message.cc || message.bcc || hasMultipleTo);
  }

  formatRecipients(recipients: string | string[]): string {
    if (!recipients) return '';
    const emailList = Array.isArray(recipients)
      ? recipients
      : recipients.split(',').map(email => email.trim());
    if (emailList.length <= 2) {
      return emailList.map(email => this.extractDisplayName(email)).join(', ');
    }
    return `${this.extractDisplayName(emailList[0])}, ${this.extractDisplayName(emailList[1])} and ${emailList.length - 2} more`;
  }

  getInitials(email: string): string {
    const displayName = this.extractDisplayName(email);
    if (displayName.includes(' ')) {
      const parts = displayName.split(' ');
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  getMessagePreview(message: EmailDetailDTO): string {
    const content = message.textContent || this.stripHtml(message.htmlContent || '');
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  private stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  getMessageContent(message: EmailDetailDTO): string {
    let content = '';

    // Try HTML content first (most emails have HTML)
    if (message.htmlContent && message.htmlContent.trim()) {
      content = message.htmlContent;
    }
    // Fall back to text content if no HTML
    else if (message.textContent && message.textContent.trim()) {
      // Convert plain text to HTML with proper formatting
      content = this.convertTextToHtml(message.textContent);
    }

    // If no content available, show a friendly message
    if (!content || content.trim() === '') {
      return '<div style="color: #5f6368; font-style: italic; padding: 20px; text-align: center; border: 1px dashed #e8eaed; border-radius: 8px; background: #fafafa;">' +
             '<mat-icon style="font-size: 48px; color: #dadce0;">mail_outline</mat-icon><br>' +
             'This message has no content to display</div>';
    }

    // Sanitize and return
    return this.sanitizeHtml(content);
  }

  convertTextToHtml(text: string): string {
    if (!text) return '';

    // Escape HTML entities first
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Convert URLs to clickable links
    escaped = escaped.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Convert email addresses to mailto links
    escaped = escaped.replace(
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g,
      '<a href="mailto:$1">$1</a>'
    );

    // Convert line breaks to HTML: double newlines become paragraphs, single newlines become <br>
    escaped = escaped
      .split('\n\n')
      .map(para => {
        const lines = para.split('\n').join('<br>');
        return `<p style="margin: 8px 0;">${lines}</p>`;
      })
      .join('');

    return `<div style="white-space: pre-wrap; word-wrap: break-word;">${escaped}</div>`;
  }

  sanitizeHtml(html: string): string {
    if (!html || html.trim() === '') {
      return '<div style="color: #5f6368; font-style: italic; padding: 20px; text-align: center;">This message has no content to display</div>';
    }

    // Use DOMPurify for comprehensive HTML sanitization
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'div',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'a', 'img',
        'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption',
        'blockquote', 'pre', 'code', 'kbd', 'samp',
        'font', 'center', 'hr', 'sup', 'sub', 'mark', 'del', 'ins'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'style', 'class', 'id',
        'width', 'height', 'align', 'border', 'color', 'size',
        'face', 'target', 'rel', 'colspan', 'rowspan',
        'cellpadding', 'cellspacing', 'bgcolor'
      ],
      ALLOW_DATA_ATTR: false,
      SANITIZE_DOM: true,
      FORCE_BODY: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      // Add hooks to ensure external links open in new tab
      ADD_ATTR: ['target'],
      // Allow style attributes for email formatting
      ALLOW_UNKNOWN_PROTOCOLS: false
    });

    // If sanitization completely removed content, show a warning
    if (!sanitized || sanitized.trim() === '') {
      return '<div style="color: #d93025; font-style: italic; padding: 20px; text-align: center; border: 1px solid #fce8e6; border-radius: 8px; background: #fef7f7;">' +
             'This message contains content that could not be displayed safely</div>';
    }

    return sanitized;
  }

  getCurrentMessage(): EmailDetailDTO | null {
    return this.currentMenuMessage;
  }

  // Reply functionality
  startReply(message: EmailDetailDTO, type: 'reply' | 'replyAll' | 'forward'): void {
    // Close any existing reply first
    if (this.showInlineReply) {
      this.hideInlineReply();
    }

    const replyData: ReplyData = {
      type,
      originalMessage: message,
      to: this.getReplyRecipients(message, type),
      cc: this.getReplyCc(message, type),
      subject: this.getReplySubject(message, type),
      body: this.getReplyBody(message, type)
    };

    this.currentReplyData = replyData;
    this.showInlineReply = true;

    // Scroll to reply area after a short delay to ensure DOM is updated
    setTimeout(() => {
      const replyElement = document.querySelector('app-inline-reply');
      if (replyElement) {
        replyElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }

  private getReplyRecipients(message: EmailDetailDTO, type: string): string[] {
    switch (type) {
      case 'reply':
        return [message.from];
      case 'replyAll':
        const recipients = [message.from];
        if (message.to) {
          const toRecipients = Array.isArray(message.to) ? message.to : [message.to];
          recipients.push(...toRecipients);
        }
        // Remove current user's email from recipients
        return recipients.filter((email, index, self) => self.indexOf(email) === index);
      case 'forward':
        return [];
      default:
        return [message.from];
    }
  }

  private getReplyCc(message: EmailDetailDTO, type: string): string[] {
    if (type === 'replyAll' && message.cc) {
      return Array.isArray(message.cc) ? message.cc : [message.cc];
    }
    return [];
  }

  private getReplySubject(message: EmailDetailDTO, type: string): string {
    const subject = message.subject || '(No Subject)';
    switch (type) {
      case 'reply':
      case 'replyAll':
        return subject.startsWith('Re:') ? subject : `Re: ${subject}`;
      case 'forward':
        return subject.startsWith('Fwd:') ? subject : `Fwd: ${subject}`;
      default:
        return `Re: ${subject}`;
    }
  }

  private getReplyBody(message: EmailDetailDTO, type: string): string {
    if (type === 'forward') {
      return '\n\n'; // Empty body for forward, original message will be in quoted content
    }
    return '\n\n'; // Empty body for replies, original message will be in quoted content
  }

  hideInlineReply(): void {
    this.showInlineReply = false;
    this.currentReplyData = null;
  }

  handleSendReply(replyData: ReplyRequest): void {
    this.mailService.sendReply(replyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Reply sent successfully!', 'Close', { duration: 3000 });
          this.hideInlineReply();
          // Refresh conversation to show the new message
          this.loadConversation();
        },
        error: (error) => {
          console.error('Error sending reply:', error);
          this.snackBar.open('Failed to send reply', 'Close', { duration: 5000 });
        }
      });
  }

  handleSaveDraft(draftData: ReplyRequest): void {
    // Convert to the format expected by the backend
    const draftRequest = {
      ...draftData,
      saveDraft: true
    };

    this.mailService.sendReply(draftRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Reply saved as draft', 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error saving draft:', error);
          this.snackBar.open('Failed to save draft', 'Close', { duration: 3000 });
        }
      });
  }

  // Gmail-style formatting methods
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  hasMultipleRecipients(message: EmailDetailDTO): boolean {
    if (!message.to) return false;

    if (Array.isArray(message.to)) {
      return message.to.length > 1 || !!(message.cc) || !!(message.bcc);
    } else {
      // Handle case where backend sends as string
      const toStr = message.to as any as string;
      return toStr.includes(',') || !!(message.cc) || !!(message.bcc);
    }
  }

  hasMoreThanTwoRecipients(recipients: string | string[]): boolean {
    if (!recipients) return false;
    if (Array.isArray(recipients)) {
      return recipients.length > 2;
    } else {
      const recipientList = recipients.split(',').map(email => email.trim());
      return recipientList.length > 2;
    }
  }

  formatAllRecipients(recipients: string | string[]): string {
    if (!recipients) return '';
    const emailList = Array.isArray(recipients)
      ? recipients
      : recipients.split(',').map(email => email.trim());
    return emailList.map(email => this.extractDisplayName(email)).join(', ');
  }

  // Gmail-style action methods
  reportSpam(): void {
    if (!this.conversation?.messages) return;
    // In a real implementation, this would call a spam reporting API
    this.snackBar.open('Conversation reported as spam', 'Close', { duration: 3000 });
    this.goBack();
  }

  snoozeConversation(): void {
    // In a real implementation, this would open a snooze dialog
    this.snackBar.open('Snooze functionality not yet implemented', 'Close', { duration: 3000 });
  }

  addToTasks(): void {
    // In a real implementation, this would add to Google Tasks or similar
    this.snackBar.open('Added to tasks', 'Close', { duration: 3000 });
  }

  moveToFolder(folder: string): void {
    if (!this.conversation?.messages) return;

    const messageIds = this.conversation.messages.map(msg => msg.messageId);
    let action: EmailAction;

    switch (folder) {
      case 'INBOX':
        action = EmailAction.MOVE_TO_INBOX;
        break;
      case 'SPAM':
        action = EmailAction.MOVE_TO_SPAM;
        break;
      case 'TRASH':
        action = EmailAction.MOVE_TO_TRASH;
        break;
      default:
        this.snackBar.open('Invalid folder specified', 'Close', { duration: 3000 });
        return;
    }

    this.performEmailAction(messageIds, action);
    this.snackBar.open(`Conversation moved to ${folder}`, 'Close', { duration: 3000 });
    this.goBack();
  }

  markAsUnread(): void {
    if (!this.conversation?.messages) return;
    const messageIds = this.conversation.messages.map(msg => msg.messageId);
    this.performEmailAction(messageIds, EmailAction.MARK_AS_UNREAD);
  }

  private markUnreadMessagesAsRead(): void {
    if (!this.conversation?.messages) return;

    // Get only unread messages
    const unreadMessageIds = this.conversation.messages
      .filter(msg => msg.unread)
      .map(msg => msg.messageId);

    if (unreadMessageIds.length > 0) {
      this.performEmailAction(unreadMessageIds, EmailAction.MARK_AS_READ);
    }
  }

  // Helper method for label dropdown
  getConversationMessageIds(): string[] {
    return this.conversation?.messages?.map(msg => msg.messageId) || [];
  }

  // Label event handlers
  onLabelApplied(event: { label: Label, messageUids: string[] }): void {
    const { label, messageUids } = event;

    this.labelService.applyLabel(messageUids, label.id, this.currentFolder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`Label "${label.name}" applied successfully`, 'Close', { duration: 3000 });
          this.loadConversation(); // Reload to reflect label changes
        },
        error: (error: any) => {
          console.error('Error applying label:', error);
          this.snackBar.open('Failed to apply label', 'Close', { duration: 3000 });
        }
      });
  }

  onLabelRemoved(event: { label: Label, messageUids: string[] }): void {
    const { label, messageUids } = event;

    this.labelService.removeLabel(messageUids, label.id, this.currentFolder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`Label "${label.name}" removed successfully`, 'Close', { duration: 3000 });
          this.loadConversation(); // Reload to reflect label changes
        },
        error: (error: any) => {
          console.error('Error removing label:', error);
          this.snackBar.open('Failed to remove label', 'Close', { duration: 3000 });
        }
      });
  }
}