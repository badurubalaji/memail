import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmailAttachment } from '../../shared/models/email.models';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MailService } from '../../core/services/mail.service';
import { DraftEmail } from '../../shared/models/email.models';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-draft-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    LoadingStateComponent,
    ErrorStateComponent
  ],
  template: `
    <div class="draft-editor-container">
      <app-loading-state
        *ngIf="isLoading && !draftForm"
        message="Loading draft...">
      </app-loading-state>

      <app-error-state
        *ngIf="errorMessage && !draftForm"
        title="Unable to load draft"
        [message]="errorMessage"
        (retry)="loadDraft()">
      </app-error-state>

      <mat-card *ngIf="draftForm && !isLoading" class="draft-card">
        <mat-card-header>
          <mat-card-title>
            <div class="header-actions">
              <span>Edit Draft</span>
              <div class="actions">
                <button mat-icon-button
                        (click)="goBack()"
                        matTooltip="Back to drafts"
                        type="button">
                  <mat-icon>arrow_back</mat-icon>
                </button>
              </div>
            </div>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="draftForm" (ngSubmit)="sendDraft()">
            <!-- Recipients Section -->
            <div class="recipients-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>To</mat-label>
                <input matInput
                       formControlName="to"
                       placeholder="Enter email addresses separated by commas">
                <mat-error *ngIf="draftForm.get('to')?.hasError('required')">
                  At least one recipient is required
                </mat-error>
              </mat-form-field>

              <div class="cc-bcc-section" *ngIf="showCcBcc">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>CC</mat-label>
                  <input matInput
                         formControlName="cc"
                         placeholder="Enter CC email addresses separated by commas">
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>BCC</mat-label>
                  <input matInput
                         formControlName="bcc"
                         placeholder="Enter BCC email addresses separated by commas">
                </mat-form-field>
              </div>

              <div class="cc-bcc-toggle" *ngIf="!showCcBcc">
                <button mat-button
                        type="button"
                        (click)="toggleCcBcc()"
                        class="cc-bcc-button">
                  <mat-icon>add</mat-icon>
                  CC/BCC
                </button>
              </div>
            </div>

            <!-- Subject -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Subject</mat-label>
              <input matInput
                     formControlName="subject"
                     placeholder="Enter subject">
              <mat-error *ngIf="draftForm.get('subject')?.hasError('required')">
                Subject is required
              </mat-error>
            </mat-form-field>

            <!-- Message Body -->
            <mat-form-field appearance="outline" class="full-width message-body">
              <mat-label>Message</mat-label>
              <textarea matInput
                        formControlName="body"
                        rows="12"
                        placeholder="Compose your message..."></textarea>
              <mat-error *ngIf="draftForm.get('body')?.hasError('required')">
                Message body is required
              </mat-error>
            </mat-form-field>

            <!-- Attachments Section -->
            <div class="attachments-section" *ngIf="attachments.length > 0">
              <h4>Attachments</h4>
              <div class="attachment-list">
                <mat-chip-listbox>
                  <mat-chip *ngFor="let attachment of attachments; let i = index"
                           (removed)="removeAttachment(i)">
                    <mat-icon matChipAvatar>attach_file</mat-icon>
                    {{ getAttachmentName(attachment) }}
                    <button matChipRemove>
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip>
                </mat-chip-listbox>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="isSending || draftForm.invalid">
                <mat-spinner *ngIf="isSending" diameter="20"></mat-spinner>
                <mat-icon *ngIf="!isSending">send</mat-icon>
                {{ isSending ? 'Sending...' : 'Send' }}
              </button>

              <button mat-button
                      type="button"
                      (click)="saveDraft()"
                      [disabled]="isSaving">
                <mat-spinner *ngIf="isSaving" diameter="20"></mat-spinner>
                <mat-icon *ngIf="!isSaving">save</mat-icon>
                {{ isSaving ? 'Saving...' : 'Save Draft' }}
              </button>

              <button mat-button
                      type="button"
                      (click)="deleteDraft()"
                      [disabled]="isDeleting"
                      color="warn">
                <mat-icon>delete</mat-icon>
                {{ isDeleting ? 'Deleting...' : 'Delete Draft' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .draft-editor-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .draft-card {
      margin-bottom: 24px;
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .recipients-section {
      margin-bottom: 16px;
    }

    .cc-bcc-section {
      margin-top: 8px;
    }

    .cc-bcc-toggle {
      margin-bottom: 16px;
    }

    .cc-bcc-button {
      color: #1976d2;
      font-size: 14px;
    }

    .message-body {
      .mat-mdc-form-field-flex {
        align-items: flex-start;
      }

      textarea {
        resize: vertical;
        min-height: 200px;
      }
    }

    .attachments-section {
      margin: 24px 0;

      h4 {
        margin: 0 0 12px 0;
        color: #333;
        font-weight: 500;
      }
    }

    .attachment-list {
      margin-top: 8px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }

    .action-buttons button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-buttons mat-spinner {
      margin-right: 4px;
    }

    @media (max-width: 768px) {
      .draft-editor-container {
        padding: 16px;
      }

      .header-actions {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-buttons button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class DraftEditorComponent implements OnInit, OnDestroy {
  draftForm: FormGroup | null = null;
  attachments: (File | EmailAttachment)[] = [];
  showCcBcc = false;

  isLoading = false;
  isSending = false;
  isSaving = false;
  isDeleting = false;
  errorMessage = '';

  private messageId = '';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mailService: MailService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.messageId = params['threadId']; // Using threadId as messageId for drafts
      this.loadDraft();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDraft(): void {
    if (!this.messageId) {
      this.errorMessage = 'Draft ID not found';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.mailService.getDraft(this.messageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (draft: DraftEmail) => {
          this.initializeForm(draft);
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading draft:', error);
          this.errorMessage = error.error?.message || 'Failed to load draft';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
      });
  }

  private initializeForm(draft: DraftEmail): void {
    this.draftForm = this.fb.group({
      to: [this.arrayToString(draft.to), [Validators.required]],
      cc: [this.arrayToString(draft.cc)],
      bcc: [this.arrayToString(draft.bcc)],
      subject: [draft.subject || '', [Validators.required]],
      body: [draft.htmlContent || draft.textContent || '', [Validators.required]]
    });

    // Show CC/BCC section if there are existing values
    this.showCcBcc = !!(draft.cc?.length || draft.bcc?.length);

    // Set attachments
    this.attachments = draft.attachments || [];
  }

  private arrayToString(arr: string[] | undefined): string {
    return arr ? arr.join(', ') : '';
  }

  private stringToArray(str: string): string[] {
    return str ? str.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
  }

  toggleCcBcc(): void {
    this.showCcBcc = !this.showCcBcc;
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  sendDraft(): void {
    if (this.draftForm?.invalid || this.isSending) {
      return;
    }

    this.isSending = true;
    const formValue = this.draftForm!.value;

    const emailRequest = {
      to: formValue.to,
      cc: formValue.cc,
      bcc: formValue.bcc,
      subject: formValue.subject,
      htmlContent: formValue.body,
      attachments: []
    };

    this.mailService.sendEmail(emailRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSending = false;
          this.snackBar.open('Email sent successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/sent']);
        },
        error: (error) => {
          this.isSending = false;
          console.error('Error sending email:', error);
          this.snackBar.open('Failed to send email. Please try again.', 'Close', { duration: 5000 });
        }
      });
  }

  saveDraft(): void {
    if (this.draftForm?.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    const formValue = this.draftForm!.value;

    const draftRequest = {
      messageId: this.messageId,
      to: this.stringToArray(formValue.to),
      cc: this.stringToArray(formValue.cc),
      bcc: this.stringToArray(formValue.bcc),
      subject: formValue.subject,
      htmlContent: formValue.body,
      textContent: formValue.body,
      attachments: this.attachments
    };

    this.mailService.updateDraft(this.messageId, draftRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.snackBar.open('Draft saved successfully!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error saving draft:', error);
          this.snackBar.open('Failed to save draft. Please try again.', 'Close', { duration: 5000 });
        }
      });
  }

  deleteDraft(): void {
    if (this.isDeleting) {
      return;
    }

    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    if (!this.messageId) {
      this.snackBar.open('Cannot delete draft: Draft ID not found', 'Close', { duration: 3000 });
      return;
    }

    this.isDeleting = true;

    this.mailService.deleteDraft(this.messageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.snackBar.open('Draft deleted successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/drafts']);
        },
        error: (error) => {
          this.isDeleting = false;
          console.error('Error deleting draft:', error);
          this.snackBar.open('Failed to delete draft', 'Close', { duration: 3000 });
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/drafts']);
  }

  getAttachmentName(attachment: File | EmailAttachment): string {
    if (attachment instanceof File) {
      return attachment.name;
    } else {
      return (attachment as EmailAttachment).filename;
    }
  }
}