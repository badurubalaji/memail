import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MailService } from '../../core/services/mail.service';
import { SearchService } from '../../core/services/search.service';
import { LabelService, Label } from '../../core/services/label.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { EmailHeader, EmailListResponse } from '../../shared/models/email.models';
import { ConversationDTO, ConversationListResponse, EmailAction, EmailActionRequest } from '../../shared/models/conversation.models';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LabelDropdownComponent } from '../../shared/components/label-dropdown/label-dropdown.component';
import { ConversationSkeletonComponent } from '../../shared/components/conversation-skeleton/conversation-skeleton.component';
import { EnhancedComposeComponent } from './enhanced-compose.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

interface DraftData {
  messageId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  attachments?: any[];
}

interface MatCheckboxChangeEvent {
  checked: boolean;
  source: any;
}

@Component({
  selector: 'app-mail-list',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    ErrorStateComponent,
    EmptyStateComponent,
    LabelDropdownComponent,
    ConversationSkeletonComponent
  ],
  template: `
    <div class="gmail-mail-list">
      <!-- Bulk Actions Toolbar -->
      <mat-toolbar *ngIf="selectedConversations.length > 0" class="bulk-actions-toolbar">
        <span class="selection-count">{{ selectedConversations.length }} selected</span>
        <div class="bulk-actions">
          <button mat-icon-button matTooltip="Archive" (click)="bulkArchive()">
            <mat-icon>archive</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Delete" (click)="bulkDelete()">
            <mat-icon>delete</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Mark as read" (click)="bulkMarkAsRead()">
            <mat-icon>mark_email_read</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Mark as unread" (click)="bulkMarkAsUnread()">
            <mat-icon>mark_email_unread</mat-icon>
          </button>
          <app-label-dropdown
            [messageUids]="selectedConversations"
            [folder]="currentFolder"
            (labelApplied)="onLabelApplied($event)"
            (labelRemoved)="onLabelRemoved($event)">
          </app-label-dropdown>
          <button mat-icon-button matTooltip="More actions" [matMenuTriggerFor]="bulkMenu">
            <mat-icon>more_vert</mat-icon>
          </button>
        </div>
        <button mat-icon-button (click)="clearSelection()" matTooltip="Clear selection">
          <mat-icon>close</mat-icon>
        </button>
      </mat-toolbar>

      <!-- Loading State -->
      <app-conversation-skeleton
        *ngIf="isLoading && conversations.length === 0"
        [count]="8">
      </app-conversation-skeleton>

      <!-- Error State -->
      <app-error-state
        *ngIf="errorMessage && conversations.length === 0"
        title="Unable to load conversations"
        [message]="errorMessage"
        (retry)="refreshConversations()">
      </app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && conversations.length === 0 && !errorMessage"
        title="No conversations found"
        message="This folder is empty or you don't have any conversations yet."
        icon="inbox">
      </app-empty-state>

      <!-- Conversations List -->
      <div *ngIf="conversations.length > 0" class="conversations-list">
        <!-- Select All Checkbox -->
        <div class="select-all-bar" *ngIf="conversations.length > 0">
          <mat-checkbox
            [checked]="allSelected"
            [indeterminate]="someSelected && !allSelected"
            (change)="toggleSelectAll($event)">
          </mat-checkbox>
          <span class="select-all-label">Select all</span>
        </div>

        <!-- Conversation Rows -->
        <div class="conversation-rows">
          <div *ngFor="let conversation of conversations; trackBy: trackByThreadId"
               class="conversation-row"
               [class.selected]="isConversationSelected(conversation.threadId)"
               [class.unread]="conversation.hasUnread"
               (click)="onConversationClick(conversation, $event)">

            <!-- Selection Checkbox -->
            <div class="selection-cell">
              <mat-checkbox
                [checked]="isConversationSelected(conversation.threadId)"
                (change)="toggleConversationSelection(conversation.threadId, $event)"
                (click)="$event.stopPropagation()">
              </mat-checkbox>
            </div>

            <!-- Star/Important -->
            <div class="star-cell">
              <button mat-icon-button
                      class="star-button"
                      [class.starred]="conversation.isStarred"
                      (click)="toggleStar(conversation, $event)"
                      matTooltip="Star">
                <mat-icon>{{ conversation.isStarred ? 'star' : 'star_border' }}</mat-icon>
              </button>
            </div>

            <!-- Sender -->
            <div class="sender-cell" [class.unread]="conversation.hasUnread">
              {{ getParticipantsDisplay(conversation.participants) }}
            </div>

            <!-- Content (Subject + Preview) -->
            <div class="content-cell">
              <div class="subject-preview">
                <span class="subject" [class.unread]="conversation.hasUnread">
                  {{ conversation.subject || '(No Subject)' }}
                </span>
                <span class="preview" *ngIf="conversation.preview">
                  - {{ conversation.preview }}
                </span>
              </div>
            </div>

            <!-- Attachments -->
            <div class="attachment-cell" *ngIf="conversation.hasAttachments">
              <mat-icon class="attachment-icon" matTooltip="Has attachments">
                attach_file
              </mat-icon>
            </div>

            <!-- Date -->
            <div class="date-cell">
              {{ formatDate(conversation.lastMessageDate) }}
            </div>

            <!-- Unread indicator -->
            <div class="unread-indicator" *ngIf="conversation.hasUnread">
              <div class="unread-dot"></div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <mat-paginator
          [length]="totalConversations"
          [pageSize]="pageSize"
          [pageSizeOptions]="[25, 50, 100]"
          [pageIndex]="currentPage"
          (page)="onPageChange($event)"
          class="gmail-paginator">
        </mat-paginator>
      </div>

      <!-- Bulk Actions Menu -->
      <mat-menu #bulkMenu="matMenu">
        <button mat-menu-item (click)="bulkAddLabel()">
          <mat-icon>label</mat-icon>
          Add label
        </button>
        <button mat-menu-item (click)="bulkMoveToFolder()">
          <mat-icon>folder</mat-icon>
          Move to
        </button>
      </mat-menu>
    </div>
  `,
  styles: [`
    .gmail-mail-list {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #ffffff;
    }

    /* Bulk Actions Toolbar */
    .bulk-actions-toolbar {
      background: #f0f4f8;
      border-bottom: 1px solid #dadce0;
      min-height: 56px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    }

    .selection-count {
      font-size: 14px;
      color: #5f6368;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .bulk-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex: 1;
    }

    .bulk-actions button {
      color: #5f6368;
      width: 48px;
      height: 48px;
      min-width: 48px;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      padding: 0;
      margin: 0;
      border: none;
      background: transparent;
      overflow: visible;
    }

    .bulk-actions button:hover {
      background-color: rgba(95, 99, 104, 0.1);
    }

    .bulk-actions button mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      line-height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bulk-actions-toolbar > button {
      width: 48px;
      height: 48px;
      min-width: 48px;
      min-height: 48px;
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
      flex-shrink: 0;
    }

    .bulk-actions-toolbar > button:hover {
      background-color: rgba(95, 99, 104, 0.1);
    }

    .bulk-actions-toolbar > button mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      line-height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Select All Bar */
    .select-all-bar {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #dadce0;
      background: #fafafa;
    }

    .select-all-label {
      margin-left: 12px;
      font-size: 13px;
      color: #5f6368;
    }

    /* Conversations List */
    .conversations-list {
      flex: 1;
      overflow: auto;
    }

    .conversation-rows {
      min-height: 0;
    }

    /* Individual Conversation Row */
    .conversation-row {
      display: flex;
      align-items: center;
      padding: 0 12px;
      min-height: 40px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.1s ease;
      position: relative;
    }

    .conversation-row:hover {
      background-color: #f5f5f5;
      box-shadow: inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0;
    }

    .conversation-row.selected {
      background-color: #fce8e6;
    }

    .conversation-row.unread {
      background-color: #ffffff;
      font-weight: 600;
    }

    /* Row Cells */
    .selection-cell {
      width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .star-cell {
      width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 4px;
    }

    .star-button {
      width: 32px;
      height: 32px;
      min-width: 32px;
      min-height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8e8e93;
      border-radius: 50%;
      padding: 0;
      margin: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      overflow: visible;
    }

    .star-button mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      line-height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit;
    }

    .star-button.starred {
      color: #fbbc04;
    }

    .star-button.starred mat-icon {
      color: #fbbc04;
    }

    .star-button:hover {
      background-color: rgba(95, 99, 104, 0.1);
      color: #5f6368;
    }

    .star-button:hover.starred {
      color: #fbbc04;
    }

    .sender-cell {
      width: 200px;
      flex-shrink: 0;
      padding-right: 16px;
      font-size: 14px;
      color: #202124;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sender-cell.unread {
      font-weight: 600;
    }

    .content-cell {
      flex: 1;
      min-width: 0;
      padding-right: 16px;
    }

    .subject-preview {
      font-size: 14px;
      line-height: 20px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .subject {
      color: #202124;
    }

    .subject.unread {
      font-weight: 600;
    }

    .preview {
      color: #5f6368;
      margin-left: 4px;
    }

    .attachment-cell {
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-right: 8px;
    }

    .attachment-icon {
      font-size: 16px;
      color: #5f6368;
    }

    .date-cell {
      width: 100px;
      flex-shrink: 0;
      text-align: right;
      font-size: 12px;
      color: #5f6368;
      padding-right: 8px;
    }

    .unread-indicator {
      width: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .unread-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #1a73e8;
    }

    /* Paginator */
    .gmail-paginator {
      border-top: 1px solid #dadce0;
      background: #fafafa;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .sender-cell {
        width: 120px;
      }

      .date-cell {
        width: 80px;
      }

      .attachment-cell {
        display: none;
      }

      .conversation-row {
        padding: 0 8px;
        min-height: 48px;
      }
    }

    @media (max-width: 480px) {
      .sender-cell {
        width: 80px;
      }

      .star-cell {
        display: none;
      }

      .selection-cell {
        width: 32px;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .conversation-row {
        border-bottom: 1px solid #000;
      }

      .conversation-row:hover {
        background-color: #e8f0fe;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .conversation-row {
        transition: none;
      }
    }
  `]
})
export class MailListComponent implements OnInit, OnDestroy {
  conversations: ConversationDTO[] = [];
  isLoading = false;
  errorMessage = '';
  currentFolder = 'INBOX';
  currentPage = 0;
  pageSize = 50;
  totalConversations = 0;

  // Selection state
  selectedConversations: string[] = [];
  allSelected = false;
  someSelected = false;

  // Search state
  currentSearchQuery = '';
  isSearchMode = false;

  private destroy$ = new Subject<void>();

  constructor(
    private mailService: MailService,
    private searchService: SearchService,
    private labelService: LabelService,
    private webSocketService: WebSocketService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Get folder from route data if available
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data['folder']) {
        this.currentFolder = data['folder'];
      }
    });

    // Subscribe to search queries
    this.searchService.searchQuery$.pipe(takeUntil(this.destroy$)).subscribe(query => {
      this.currentSearchQuery = query || '';
      this.isSearchMode = !!query;
      this.currentPage = 0; // Reset pagination
      this.loadConversations();
    });

    // Subscribe to WebSocket notifications for real-time updates
    this.webSocketService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        if (notification) {
          console.log('Mail list received notification:', notification);

          // Auto-refresh the mail list when new email arrives or email state changes
          if (notification.type === 'NEW_EMAIL' && notification.folder === this.currentFolder) {
            // Only refresh if we're viewing the folder where the new email arrived
            this.loadConversations();
          } else if (notification.type === 'EMAIL_READ' || notification.type === 'EMAIL_DELETED') {
            // Refresh for read/delete actions
            this.loadConversations();
          }
        }
      });

    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConversations(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Use search or regular conversation loading based on search mode
    const operation = this.isSearchMode
      ? this.mailService.searchConversations(this.currentSearchQuery, this.currentFolder, this.currentPage, this.pageSize)
      : this.mailService.getConversations(this.currentFolder, this.currentPage, this.pageSize);

    operation.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ConversationListResponse) => {
          this.conversations = response.conversations;
          this.totalConversations = response.totalCount;
          this.isLoading = false;
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Error loading conversations:', error);

          // Check if this is an authentication-related error that wasn't caught by the interceptor
          const isAuthError = error.message?.includes('session has expired') ||
                              error.message?.includes('not authenticated') ||
                              error.message?.includes('connection lost');

          if (error.status === 401 || isAuthError) {
            this.errorMessage = 'Your session has expired. Please log in again.';
          } else if (error.status === 0) {
            this.errorMessage = 'Unable to connect to server. Please check your connection.';
          } else {
            this.errorMessage = error.error?.message || 'Failed to load conversations. Please try again.';
          }

          this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
      });
  }

  refreshConversations(): void {
    this.currentPage = 0;
    this.loadConversations();
  }

  selectConversation(conversation: ConversationDTO): void {
    // Special handling for drafts - open compose dialog instead of navigating
    if (this.currentFolder === 'DRAFTS') {
      this.editDraft(conversation);
    } else {
      // Navigate to conversation detail view based on current folder
      const folderPath = this.currentFolder.toLowerCase();
      this.router.navigate([`/${folderPath}`, conversation.threadId]);
    }
  }

  private editDraft(conversation: ConversationDTO): void {
    // Extract the first (and likely only) message from the conversation
    if (!conversation.messages || conversation.messages.length === 0) {
      // If no messages in conversation, try using threadId as messageId
      if (conversation.threadId) {
        this.mailService.getDraft(conversation.threadId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (draftData) => {
              this.openComposeDialog(draftData);
            },
            error: (error) => {
              console.error('Error fetching draft details:', error);
              this.snackBar.open('Unable to load draft. Please try again.', 'Close', { duration: 3000 });
            }
          });
      } else {
        this.snackBar.open('Unable to edit draft: No message content found', 'Close', { duration: 3000 });
      }
      return;
    }

    const draftMessage = conversation.messages[0];

    // Fetch the full draft details
    this.mailService.getDraft(draftMessage.messageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (draftData) => {
          console.log('Draft data loaded:', draftData);
          this.openComposeDialog(draftData);
        },
        error: (error) => {
          console.error('Error fetching draft details:', error);
          // Fallback: open compose with conversation data
          console.log('Using fallback - converting conversation to draft');
          this.openComposeDialog(this.convertConversationToDraft(conversation));
        }
      });
  }

  private convertConversationToDraft(conversation: ConversationDTO): DraftData {
    // Convert conversation data to draft format as fallback
    const message = conversation.messages![0];
    return {
      messageId: message.messageId,
      to: Array.isArray(message.to) ? message.to : (message.to ? [message.to] : []),
      cc: Array.isArray(message.cc) ? message.cc : (message.cc ? [message.cc] : []),
      bcc: Array.isArray(message.bcc) ? message.bcc : (message.bcc ? [message.bcc] : []),
      subject: conversation.subject || '',
      htmlContent: message.htmlContent || '',
      textContent: message.textContent || '',
      attachments: message.attachments || []
    };
  }

  private openComposeDialog(draftData: DraftData): void {
    const dialogRef = this.dialog.open(EnhancedComposeComponent, {
      width: '600px',
      height: '600px',
      disableClose: false,
      autoFocus: true,
      hasBackdrop: false,
      panelClass: 'compose-dialog',
      data: {
        mode: 'edit-draft',
        draftData: draftData
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'sent' || result === 'saved') {
        // Refresh the drafts list after sending or saving
        this.refreshConversations();
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadConversations();
  }

  getCurrentFolderDisplayName(): string {
    const folderNames: { [key: string]: string } = {
      'INBOX': 'Inbox',
      'SENT': 'Sent',
      'DRAFTS': 'Drafts',
      'TRASH': 'Trash'
    };
    return folderNames[this.currentFolder] || this.currentFolder;
  }


  trackByThreadId(index: number, conversation: ConversationDTO): string {
    return conversation.threadId;
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

  private extractDisplayName(email: string): string {
    // Extract display name from email format "Name <email@domain.com>" or just return email
    const match = email.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim() : email;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();

    // Check if it's today (same day)
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();

    if (isToday) {
      // Show time for today's emails
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    // Check if it's within the last 7 days
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  // Selection methods
  isConversationSelected(threadId: string): boolean {
    return this.selectedConversations.includes(threadId);
  }

  toggleConversationSelection(threadId: string, event: MatCheckboxChangeEvent): void {
    if (event.checked) {
      this.selectedConversations.push(threadId);
    } else {
      this.selectedConversations = this.selectedConversations.filter(id => id !== threadId);
    }
    this.updateSelectionState();
  }

  toggleSelectAll(event: MatCheckboxChangeEvent): void {
    if (event.checked) {
      this.selectedConversations = this.conversations.map(c => c.threadId);
    } else {
      this.selectedConversations = [];
    }
    this.updateSelectionState();
  }

  private updateSelectionState(): void {
    this.allSelected = this.selectedConversations.length === this.conversations.length && this.conversations.length > 0;
    this.someSelected = this.selectedConversations.length > 0;
  }

  clearSelection(): void {
    this.selectedConversations = [];
    this.updateSelectionState();
  }

  // Conversation click handler
  onConversationClick(conversation: ConversationDTO, event: MouseEvent): void {
    // Don't navigate if clicking on checkbox or star
    const target = event.target as HTMLElement;
    if (target.closest('mat-checkbox') || target.closest('.star-button')) {
      return;
    }

    this.selectConversation(conversation);
  }

  // Star functionality
  toggleStar(conversation: ConversationDTO, event: MouseEvent): void {
    event.stopPropagation();

    const newStarredState = !conversation.isStarred;
    const messageIds = this.getConversationMessageIds(conversation);

    // Optimistically update UI
    conversation.isStarred = newStarredState;

    // Call backend to persist the change
    this.mailService.toggleStar(messageIds, newStarredState, this.currentFolder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Email ${newStarredState ? 'starred' : 'unstarred'} successfully`);
        },
        error: (error) => {
          // Revert on error
          conversation.isStarred = !newStarredState;
          console.error('Error toggling star:', error);
          this.snackBar.open('Failed to update star status', 'Close', { duration: 3000 });
        }
      });
  }

  private getConversationMessageIds(conversation: ConversationDTO): string[] {
    // For now, we'll use the threadId as a placeholder
    // In a real implementation, you'd fetch all message IDs in the thread
    return [conversation.threadId];
  }

  // Bulk actions
  bulkArchive(): void {
    if (this.selectedConversations.length === 0) return;

    this.performBulkAction(EmailAction.ARCHIVE, 'archived');
  }

  bulkDelete(): void {
    if (this.selectedConversations.length === 0) return;

    const dialogData: ConfirmDialogData = {
      title: 'Delete Emails',
      message: `Are you sure you want to delete ${this.selectedConversations.length} email(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'warn'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // For drafts, use the delete draft endpoint
        if (this.currentFolder === 'DRAFTS') {
          this.bulkDeleteDrafts();
        } else {
          this.performBulkAction(EmailAction.DELETE, 'deleted');
        }
      }
    });
  }

  private bulkDeleteDrafts(): void {
    const deletedIds = [...this.selectedConversations];

    // Optimistically remove from UI
    this.conversations = this.conversations.filter(
      conv => !deletedIds.includes(conv.threadId)
    );

    // Use bulk delete endpoint for better performance
    this.mailService.bulkDeleteDrafts(deletedIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackBar.open(
            `${deletedIds.length} draft(s) deleted successfully`,
            'Close',
            { duration: 3000 }
          );
          this.clearSelection();
          // Reload to ensure we're in sync with server
          this.loadConversations();
        },
        error: (error) => {
          console.error('Error deleting drafts:', error);
          this.snackBar.open('Failed to delete drafts', 'Close', { duration: 3000 });
          // Reload to revert optimistic update
          this.loadConversations();
        }
      });
  }

  private performBulkAction(action: EmailAction, actionName: string): void {
    const request: EmailActionRequest = {
      messageIds: this.selectedConversations,
      action: action,
      folder: this.currentFolder
    };

    this.mailService.performEmailActions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `${this.selectedConversations.length} email(s) ${actionName} successfully`,
            'Close',
            { duration: 3000 }
          );
          this.clearSelection();
          this.refreshConversations();
        },
        error: (error) => {
          console.error(`Error performing bulk ${actionName}:`, error);
          this.snackBar.open(`Failed to ${actionName} emails`, 'Close', { duration: 3000 });
        }
      });
  }

  bulkMarkAsRead(): void {
    if (this.selectedConversations.length === 0) return;

    this.performBulkAction(EmailAction.MARK_AS_READ, 'marked as read');
  }

  bulkMarkAsUnread(): void {
    if (this.selectedConversations.length === 0) return;

    this.performBulkAction(EmailAction.MARK_AS_UNREAD, 'marked as unread');
  }

  bulkAddLabel(): void {
    if (this.selectedConversations.length === 0) return;

    // Show a simple snackbar message since the label dropdown in the toolbar already provides this functionality
    this.snackBar.open(
      'Use the label button in the toolbar to add labels to selected emails',
      'Close',
      { duration: 3000 }
    );
  }

  bulkMoveToFolder(): void {
    if (this.selectedConversations.length === 0) return;

    const dialogData: ConfirmDialogData = {
      title: 'Move to Folder',
      message: `Select destination folder for ${this.selectedConversations.length} conversation(s):`,
      confirmText: 'Move',
      cancelText: 'Cancel',
      options: [
        { value: 'INBOX', label: 'Inbox' },
        { value: 'Archive', label: 'Archive' },
        { value: 'Spam', label: 'Spam' },
        { value: 'Trash', label: 'Trash' },
        { value: 'Drafts', label: 'Drafts' }
      ]
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: string | undefined) => {
      if (result) {
        this.moveConversationsToFolder(result);
      }
    });
  }

  private moveConversationsToFolder(targetFolder: string): void {
    // Determine the action based on target folder
    let action: EmailAction;
    switch (targetFolder) {
      case 'INBOX':
        action = EmailAction.MOVE_TO_INBOX;
        break;
      case 'Spam':
        action = EmailAction.MOVE_TO_SPAM;
        break;
      case 'Trash':
        action = EmailAction.MOVE_TO_TRASH;
        break;
      case 'Archive':
        action = EmailAction.ARCHIVE;
        break;
      default:
        this.snackBar.open('Invalid folder selected', 'Close', { duration: 3000 });
        return;
    }

    const request: EmailActionRequest = {
      messageIds: this.selectedConversations,
      action,
      folder: this.currentFolder
    };

    this.mailService.performEmailActions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `${this.selectedConversations.length} conversation(s) moved to ${targetFolder}`,
            'Close',
            { duration: 3000 }
          );
          this.clearSelection();
          this.refreshConversations();
        },
        error: (error) => {
          console.error('Error moving conversations:', error);
          this.snackBar.open('Failed to move conversations', 'Close', { duration: 3000 });
        }
      });
  }

  // Label event handlers
  onLabelApplied(event: { label: Label, messageUids: string[] }): void {
    const { label, messageUids } = event;

    this.labelService.applyLabel(messageUids, label.id, this.currentFolder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`Label "${label.name}" applied successfully`, 'Close', { duration: 3000 });
          this.refreshConversations();
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
          this.refreshConversations();
        },
        error: (error: any) => {
          console.error('Error removing label:', error);
          this.snackBar.open('Failed to remove label', 'Close', { duration: 3000 });
        }
      });
  }
}