import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EmailDetailDTO } from '../../shared/models/conversation.models';
import { MailService } from '../../core/services/mail.service';
import { expandCollapse } from '../../shared/animations/route-animations';

export interface ReplyData {
  type: 'reply' | 'replyAll' | 'forward';
  originalMessage: EmailDetailDTO;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
}

export interface ReplyRequest {
  type: string;
  to: string[];
  cc?: string[];
  subject: string;
  htmlContent: string;
  originalMessageId: string;
  threadId?: string;
}

@Component({
  selector: 'app-inline-reply',
  standalone: true,
  animations: [expandCollapse],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-card class="inline-reply-card" [@expandCollapse]>
      <mat-card-header class="reply-header">
        <mat-card-title class="reply-title">
          <mat-icon class="reply-icon">{{ getReplyIcon() }}</mat-icon>
          {{ getReplyTitle() }}
        </mat-card-title>
        <div class="header-actions">
          <button mat-icon-button matTooltip="Expand" (click)="toggleExpanded()">
            <mat-icon>{{ isExpanded ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Close" (click)="onCancel()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </mat-card-header>

      <mat-progress-bar mode="indeterminate" *ngIf="isSending" class="progress-bar"></mat-progress-bar>

      <mat-card-content class="reply-content" [class.expanded]="isExpanded">
        <form [formGroup]="replyForm" (ngSubmit)="onSend()">
          <!-- Recipients -->
          <div class="recipients-section">
            <mat-form-field appearance="outline" class="recipient-field">
              <mat-label>To</mat-label>
              <input matInput formControlName="to" placeholder="Recipients">
              <mat-error *ngIf="replyForm.get('to')?.hasError('required')">
                At least one recipient is required
              </mat-error>
            </mat-form-field>

            <div class="recipient-controls">
              <button type="button" mat-button class="cc-bcc-toggle"
                      (click)="showCcBcc = !showCcBcc"
                      *ngIf="!showCcBcc">
                Cc/Bcc
              </button>
            </div>
          </div>

          <!-- CC/BCC Fields -->
          <div *ngIf="showCcBcc" class="cc-bcc-section" [@expandCollapse]>
            <mat-form-field appearance="outline" class="recipient-field">
              <mat-label>Cc</mat-label>
              <input matInput formControlName="cc" placeholder="Carbon copy">
            </mat-form-field>

            <mat-form-field appearance="outline" class="recipient-field">
              <mat-label>Bcc</mat-label>
              <input matInput formControlName="bcc" placeholder="Blind carbon copy">
            </mat-form-field>
          </div>

          <!-- Subject -->
          <mat-form-field appearance="outline" class="subject-field">
            <mat-label>Subject</mat-label>
            <input matInput formControlName="subject" placeholder="Subject">
          </mat-form-field>

          <!-- Message Body -->
          <mat-form-field appearance="outline" class="message-field">
            <mat-label>Message</mat-label>
            <textarea matInput
                      formControlName="body"
                      placeholder="Type your message..."
                      [rows]="isExpanded ? 12 : 6"
                      cdkTextareaAutosize
                      #autosize="cdkTextareaAutosize">
            </textarea>
          </mat-form-field>

          <!-- Original Message Quote -->
          <div class="quoted-message" *ngIf="quotedContent">
            <mat-divider></mat-divider>
            <div class="quote-header">
              <button type="button" mat-button class="quote-toggle"
                      (click)="showQuote = !showQuote">
                <mat-icon>{{ showQuote ? 'expand_less' : 'expand_more' }}</mat-icon>
                {{ getQuoteHeaderText() }}
              </button>
            </div>
            <div *ngIf="showQuote" class="quote-content" [@expandCollapse]>
              <div [innerHTML]="quotedContent"></div>
            </div>
          </div>

          <!-- Actions -->
          <div class="reply-actions">
            <div class="primary-actions">
              <button mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="replyForm.invalid || isSending">
                <mat-icon>send</mat-icon>
                {{ isSending ? 'Sending...' : 'Send' }}
              </button>

              <button mat-button
                      type="button"
                      (click)="onCancel()"
                      [disabled]="isSending">
                Cancel
              </button>
            </div>

            <div class="secondary-actions">
              <button mat-icon-button
                      matTooltip="Formatting options"
                      [matMenuTriggerFor]="formatMenu">
                <mat-icon>format_color_text</mat-icon>
              </button>

              <button mat-icon-button
                      matTooltip="Attach files"
                      (click)="onAttach()">
                <mat-icon>attach_file</mat-icon>
              </button>

              <button mat-icon-button
                      matTooltip="Insert emoji"
                      (click)="onInsertEmoji()">
                <mat-icon>mood</mat-icon>
              </button>

              <button mat-icon-button
                      matTooltip="More options"
                      [matMenuTriggerFor]="moreMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
            </div>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Format Menu -->
    <mat-menu #formatMenu="matMenu">
      <button mat-menu-item (click)="applyFormat('bold')">
        <mat-icon>format_bold</mat-icon>
        Bold
      </button>
      <button mat-menu-item (click)="applyFormat('italic')">
        <mat-icon>format_italic</mat-icon>
        Italic
      </button>
      <button mat-menu-item (click)="applyFormat('underline')">
        <mat-icon>format_underlined</mat-icon>
        Underline
      </button>
    </mat-menu>

    <!-- More Options Menu -->
    <mat-menu #moreMenu="matMenu">
      <button mat-menu-item (click)="saveDraft()">
        <mat-icon>save</mat-icon>
        Save Draft
      </button>
      <button mat-menu-item (click)="scheduleMessage()">
        <mat-icon>schedule</mat-icon>
        Schedule Send
      </button>
      <button mat-menu-item (click)="insertSignature()">
        <mat-icon>draw</mat-icon>
        Insert Signature
      </button>
    </mat-menu>
  `,
  styles: [`
    .inline-reply-card {
      border: 2px solid #1a73e8;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 16px;
    }

    .reply-header {
      background: #f8f9fa;
      border-bottom: 1px solid #e8eaed;
      padding: 12px 16px;
    }

    .reply-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      color: #1a73e8;
      margin: 0;
    }

    .reply-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .header-actions {
      display: flex;
      gap: 4px;
    }

    .progress-bar {
      height: 2px;
    }

    .reply-content {
      padding: 16px;
    }

    .reply-content.expanded {
      min-height: 500px;
    }

    .recipients-section {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .recipient-field {
      flex: 1;
    }

    .recipient-controls {
      display: flex;
      align-items: center;
      padding-top: 8px;
    }

    .cc-bcc-toggle {
      color: #1a73e8;
      font-size: 12px;
    }

    .cc-bcc-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 12px;
    }

    .subject-field {
      width: 100%;
      margin-bottom: 12px;
    }

    .message-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .message-field textarea {
      min-height: 120px;
      resize: vertical;
    }

    .quoted-message {
      margin-top: 16px;
    }

    .quote-header {
      margin: 8px 0;
    }

    .quote-toggle {
      color: #5f6368;
      font-size: 12px;
      padding: 4px 8px;
      min-height: auto;
    }

    .quote-content {
      background: #f8f9fa;
      border-left: 3px solid #e8eaed;
      padding: 16px;
      margin: 8px 0;
      font-size: 13px;
      color: #5f6368;
      max-height: 200px;
      overflow-y: auto;
    }

    .reply-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e8eaed;
    }

    .primary-actions {
      display: flex;
      gap: 8px;
    }

    .secondary-actions {
      display: flex;
      gap: 4px;
    }

    .secondary-actions button {
      color: #5f6368;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .recipients-section {
        flex-direction: column;
        gap: 8px;
      }

      .recipient-controls {
        padding-top: 0;
      }

      .reply-actions {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .secondary-actions {
        justify-content: center;
      }
    }

    /* Animation Support */
    .mat-mdc-form-field {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class InlineReplyComponent implements OnInit, OnDestroy {
  @Input() replyData!: ReplyData;
  @Output() sendReply = new EventEmitter<ReplyRequest>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saveDraftEvent = new EventEmitter<ReplyRequest>();

  replyForm!: FormGroup;
  isExpanded = false;
  showCcBcc = false;
  showQuote = false;
  isSending = false;
  quotedContent = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private mailService: MailService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.prepareQuotedContent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.replyForm = this.fb.group({
      to: [this.replyData.to.join(', '), [Validators.required]],
      cc: [this.replyData.cc.join(', ')],
      bcc: [''],
      subject: [this.replyData.subject, [Validators.required]],
      body: [this.replyData.body]
    });

    // Show CC/BCC if they have values
    this.showCcBcc = this.replyData.cc.length > 0;
  }

  private prepareQuotedContent(): void {
    const original = this.replyData.originalMessage;
    const date = new Date(original.date).toLocaleString();
    const from = original.from;

    if (this.replyData.type === 'forward') {
      this.quotedContent = `
        <div style="margin: 16px 0; padding: 16px; border-left: 3px solid #ccc; background: #f9f9f9;">
          <div style="font-weight: bold; margin-bottom: 8px;">---------- Forwarded message ---------</div>
          <div><strong>From:</strong> ${from}</div>
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Subject:</strong> ${original.subject || '(No Subject)'}</div>
          ${original.to ? `<div><strong>To:</strong> ${original.to.join(', ')}</div>` : ''}
          <br>
          <div>${original.htmlContent || original.textContent}</div>
        </div>
      `;
    } else {
      this.quotedContent = `
        <div style="margin: 16px 0; padding: 16px; border-left: 3px solid #ccc; background: #f9f9f9;">
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
            On ${date}, ${from} wrote:
          </div>
          <div style="margin-left: 20px;">
            ${original.htmlContent || original.textContent}
          </div>
        </div>
      `;
    }
  }

  getReplyIcon(): string {
    switch (this.replyData.type) {
      case 'reply': return 'reply';
      case 'replyAll': return 'reply_all';
      case 'forward': return 'forward';
      default: return 'reply';
    }
  }

  getReplyTitle(): string {
    switch (this.replyData.type) {
      case 'reply': return 'Reply';
      case 'replyAll': return 'Reply All';
      case 'forward': return 'Forward';
      default: return 'Reply';
    }
  }

  getQuoteHeaderText(): string {
    const date = new Date(this.replyData.originalMessage.date).toLocaleDateString();
    const from = this.extractDisplayName(this.replyData.originalMessage.from);

    if (this.replyData.type === 'forward') {
      return `Forwarded message from ${from}`;
    }
    return `${from} wrote on ${date}`;
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  onSend(): void {
    if (this.replyForm.invalid || this.isSending) return;

    this.isSending = true;
    const formValue = this.replyForm.value;

    const emailData: ReplyRequest = {
      to: this.parseRecipients(formValue.to),
      cc: this.parseRecipients(formValue.cc),
      subject: formValue.subject,
      htmlContent: this.combineBodyWithQuote(formValue.body),
      originalMessageId: this.replyData.originalMessage.messageId,
      type: this.replyData.type,
      threadId: this.replyData.originalMessage.threadId
    };

    this.sendReply.emit(emailData);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onAttach(): void {
    // Implement file attachment
  }

  onInsertEmoji(): void {
    // Implement emoji insertion
  }

  applyFormat(format: string): void {
    // Implement text formatting
  }

  saveDraft(): void {
    const formValue = this.replyForm.value;

    const draftData: ReplyRequest = {
      to: this.parseRecipients(formValue.to),
      cc: this.parseRecipients(formValue.cc),
      subject: formValue.subject,
      htmlContent: formValue.body,
      originalMessageId: this.replyData.originalMessage.messageId,
      type: this.replyData.type,
      threadId: this.replyData.originalMessage.threadId
    };

    this.saveDraftEvent.emit(draftData);
  }

  scheduleMessage(): void {
    // Implement message scheduling
  }

  insertSignature(): void {
    // Implement signature insertion
    const currentBody = this.replyForm.get('body')?.value || '';
    const signature = '\n\n--\nBest regards,\n[Your Name]';
    this.replyForm.patchValue({ body: currentBody + signature });
  }

  private parseRecipients(recipients: string): string[] {
    if (!recipients) return [];
    return recipients.split(',').map(email => email.trim()).filter(email => email);
  }

  private combineBodyWithQuote(body: string): string {
    return body + (this.showQuote ? '\n\n' + this.quotedContent : '');
  }

  private extractDisplayName(email: string): string {
    const match = email.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim() : email.split('@')[0];
  }
}