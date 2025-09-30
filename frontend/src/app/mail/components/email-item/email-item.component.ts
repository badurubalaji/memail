import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { EmailHeader } from '../../../shared/models/email.models';

@Component({
  selector: 'app-email-item',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="email-card"
              [class.unread]="email.unread"
              (click)="emailSelected.emit(email)">
      <mat-card-content>
        <div class="email-header">
          <div class="email-from">
            <strong>{{ email.from }}</strong>
            <mat-icon *ngIf="email.hasAttachments"
                     class="attachment-icon"
                     matTooltip="Has attachments">
              attach_file
            </mat-icon>
          </div>
          <div class="email-date">
            {{ formatDate(email.date) }}
          </div>
        </div>

        <div class="email-subject">
          {{ email.subject || '(No Subject)' }}
        </div>

        <div class="email-preview" *ngIf="email.preview">
          {{ sanitizePreview(email.preview) }}
        </div>

        <div class="email-status" *ngIf="email.unread">
          <mat-chip color="primary">New</mat-chip>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .email-card {
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
      margin-bottom: 8px;
    }

    .email-card:hover {
      background-color: #f5f5f5;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .email-card.unread {
      border-left-color: #1976d2;
      background-color: #f8f9ff;
    }

    .email-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .email-from {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .email-from strong {
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .attachment-icon {
      color: #666;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .email-date {
      color: #666;
      font-size: 14px;
      white-space: nowrap;
    }

    .email-subject {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .email-preview {
      color: #666;
      font-size: 14px;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 8px;
    }

    .email-status {
      display: flex;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .email-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `]
})
export class EmailItemComponent {
  @Input() email!: EmailHeader;
  @Output() emailSelected = new EventEmitter<EmailHeader>();

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  sanitizePreview(preview: string): string {
    if (!preview) return '';

    // Remove any remaining HTML tags that might have slipped through backend processing
    return preview
      .replace(/<[^>]*>/g, '')  // Remove HTML tags
      .replace(/&nbsp;/g, ' ')  // Handle HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')     // Replace multiple whitespace with single space
      .trim();
  }
}