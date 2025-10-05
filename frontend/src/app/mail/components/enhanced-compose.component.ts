import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Subject, debounceTime, Observable, of, firstValueFrom } from 'rxjs';
import { takeUntil, startWith, map, switchMap, catchError } from 'rxjs/operators';
import { QuillModule } from 'ngx-quill';

import { MailService } from '../../core/services/mail.service';

interface EmailChip {
  email: string;
  valid: boolean;
}

interface AttachmentFile extends File {
  uploading?: boolean;
  progress?: number;
  id?: string;
  isExistingAttachment?: boolean;
  originalData?: any;
}

interface ComposeDialogData {
  mode?: 'new' | 'edit-draft' | 'reply' | 'forward';
  draftData?: {
    messageId: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent?: string;
    textContent?: string;
    attachments?: AttachmentFile[];
  };
  replyData?: {
    type: 'reply' | 'replyAll' | 'forward';
    originalMessage: any;
    to: string[];
    cc?: string[];
    subject: string;
    body: string;
  };
}

@Component({
  selector: 'app-enhanced-compose',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatDividerModule,
    MatMenuModule,
    QuillModule,
    DragDropModule
  ],
  template: `
    <div class="compose-container" [class.minimized]="isMinimized" [class.maximized]="isMaximized">
      <!-- Header -->
      <div class="compose-header" cdkDrag [cdkDragDisabled]="isMaximized" cdkDragRootElement=".cdk-overlay-pane" cdkDragHandle>
        <div class="header-content">
          <div class="header-title">
            <mat-icon class="compose-icon">edit</mat-icon>
            <span>New Message</span>
          </div>
          <div class="header-actions" *ngIf="isDialogMode()">
            <button mat-icon-button (click)="toggleMinimize()" matTooltip="{{ isMinimized ? 'Expand' : 'Minimize' }}">
              <mat-icon>{{ isMinimized ? 'expand_more' : 'minimize' }}</mat-icon>
            </button>
            <button mat-icon-button (click)="toggleMaximize()" matTooltip="{{ isMaximized ? 'Restore' : 'Maximize' }}" *ngIf="!isMinimized">
              <mat-icon>{{ isMaximized ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
            </button>
            <button mat-icon-button (click)="confirmClose()" matTooltip="Close">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content (hidden when minimized) -->
      <div class="compose-content" *ngIf="!isMinimized">

      <!-- Recipients Section -->
      <div class="recipients-section">
        <!-- To Field -->
        <div class="recipient-row">
          <label class="field-label">To</label>
          <div class="field-input">
            <mat-chip-grid #toChipGrid>
              <mat-chip-row *ngFor="let chip of toChips; let i = index"
                           [class.invalid-chip]="!chip.valid"
                           (removed)="removeToChip(i)">
                {{ chip.email }}
                <button matChipRemove><mat-icon>cancel</mat-icon></button>
              </mat-chip-row>
            </mat-chip-grid>
            <input class="chip-input"
                   [formControl]="toInputControl"
                   [matChipInputFor]="toChipGrid"
                   [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                   (matChipInputTokenEnd)="addToChip($event)"
                   placeholder="Add recipients"
                   [matAutocomplete]="autoTo">
            <mat-autocomplete #autoTo="matAutocomplete" (optionSelected)="selectToEmail($event)">
              <mat-option *ngFor="let email of filteredToEmails | async" [value]="email">
                {{ email }}
              </mat-option>
            </mat-autocomplete>
            <div class="cc-bcc-toggle" *ngIf="!showCcBcc">
              <button type="button" class="toggle-link" (click)="toggleCcBcc()">Cc</button>
              <button type="button" class="toggle-link" (click)="toggleCcBcc()">Bcc</button>
            </div>
          </div>
        </div>

        <!-- Cc Field -->
        <div class="recipient-row" *ngIf="showCcBcc">
          <label class="field-label">Cc</label>
          <div class="field-input">
            <mat-chip-grid #ccChipGrid>
              <mat-chip-row *ngFor="let chip of ccChips; let i = index"
                           [class.invalid-chip]="!chip.valid"
                           (removed)="removeCcChip(i)">
                {{ chip.email }}
                <button matChipRemove><mat-icon>cancel</mat-icon></button>
              </mat-chip-row>
            </mat-chip-grid>
            <input class="chip-input"
                   [formControl]="ccInputControl"
                   [matChipInputFor]="ccChipGrid"
                   [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                   (matChipInputTokenEnd)="addCcChip($event)"
                   placeholder="Add Cc recipients"
                   [matAutocomplete]="autoCc">
            <mat-autocomplete #autoCc="matAutocomplete" (optionSelected)="selectCcEmail($event)">
              <mat-option *ngFor="let email of filteredCcEmails | async" [value]="email">
                {{ email }}
              </mat-option>
            </mat-autocomplete>
          </div>
        </div>

        <!-- Bcc Field -->
        <div class="recipient-row" *ngIf="showCcBcc">
          <label class="field-label">Bcc</label>
          <div class="field-input">
            <mat-chip-grid #bccChipGrid>
              <mat-chip-row *ngFor="let chip of bccChips; let i = index"
                           [class.invalid-chip]="!chip.valid"
                           (removed)="removeBccChip(i)">
                {{ chip.email }}
                <button matChipRemove><mat-icon>cancel</mat-icon></button>
              </mat-chip-row>
            </mat-chip-grid>
            <input class="chip-input"
                   [formControl]="bccInputControl"
                   [matChipInputFor]="bccChipGrid"
                   [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                   (matChipInputTokenEnd)="addBccChip($event)"
                   placeholder="Add Bcc recipients"
                   [matAutocomplete]="autoBcc">
            <mat-autocomplete #autoBcc="matAutocomplete" (optionSelected)="selectBccEmail($event)">
              <mat-option *ngFor="let email of filteredBccEmails | async" [value]="email">
                {{ email }}
              </mat-option>
            </mat-autocomplete>
          </div>
        </div>

        <!-- Subject Field -->
        <div class="subject-row">
          <input type="text"
                 [formControl]="subjectControl"
                 placeholder="Subject"
                 class="subject-input"
                 (input)="onSubjectChange()">
        </div>
      </div>

      <!-- Attachments Preview -->
      <div class="attachments-section" *ngIf="attachments.length > 0">
        <div class="attachments-header">
          <mat-icon>attach_file</mat-icon>
          <span>{{ attachments.length }} attachment{{ attachments.length > 1 ? 's' : '' }}</span>
        </div>
        <div class="attachment-list">
          <div class="attachment-item" *ngFor="let file of attachments; let i = index">
            <mat-icon class="file-icon">{{ getFileIcon(file.type) }}</mat-icon>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
            </div>
            <button mat-icon-button (click)="removeAttachment(i)" class="remove-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Rich Text Editor -->
      <div class="editor-section">
        <quill-editor
          [formControl]="contentControl"
          [modules]="quillModules"
          [styles]="editorStyles"
          placeholder="Compose your email..."
          (onContentChanged)="onContentChanged($event)">
        </quill-editor>
      </div>

      <!-- Footer Actions -->
      <div class="compose-footer">
        <div class="main-actions">
          <button mat-flat-button
                  color="primary"
                  class="send-btn"
                  (click)="sendEmail()"
                  [disabled]="!isReadyToSend"
                  [matTooltip]="isReadyToSend ? 'Send email' : 'Please add at least one recipient'">
            <mat-icon *ngIf="isSending">hourglass_empty</mat-icon>
            {{ isSending ? 'Sending...' : 'Send' }}
          </button>

          <button mat-button class="format-btn" [matMenuTriggerFor]="formatMenu">
            <mat-icon>text_format</mat-icon>
            Formatting
          </button>
        </div>

        <div class="secondary-actions">
          <button mat-icon-button
                  (click)="openFileSelector()"
                  matTooltip="Attach files"
                  class="action-btn">
            <mat-icon>attach_file</mat-icon>
          </button>

          <button mat-icon-button
                  (click)="insertEmoji()"
                  matTooltip="Insert emoji"
                  class="action-btn">
            <mat-icon>mood</mat-icon>
          </button>

          <button mat-icon-button
                  (click)="insertLink()"
                  matTooltip="Insert link"
                  class="action-btn">
            <mat-icon>link</mat-icon>
          </button>

          <mat-divider vertical class="divider"></mat-divider>

          <button mat-icon-button
                  (click)="saveDraft()"
                  matTooltip="Save draft"
                  class="action-btn">
            <mat-icon>save</mat-icon>
          </button>

          <button mat-icon-button
                  (click)="discardDraft()"
                  matTooltip="Discard"
                  class="action-btn delete-btn">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>

      <!-- Format Menu -->
      <mat-menu #formatMenu="matMenu">
        <button mat-menu-item (click)="formatText('bold')">
          <mat-icon>format_bold</mat-icon>
          Bold
        </button>
        <button mat-menu-item (click)="formatText('italic')">
          <mat-icon>format_italic</mat-icon>
          Italic
        </button>
        <button mat-menu-item (click)="formatText('underline')">
          <mat-icon>format_underlined</mat-icon>
          Underline
        </button>
      </mat-menu>

      <!-- Hidden File Input -->
      <input #fileInput
             type="file"
             multiple
             accept="*/*"
             style="display: none"
             (change)="onFileSelected($event)">

      <!-- Auto-save Status -->
      <div class="auto-save-status" *ngIf="autoSaveStatus">
        <mat-icon class="save-icon">{{ autoSaveStatus.includes('Saving') ? 'sync' : 'check' }}</mat-icon>
        {{ autoSaveStatus }}
      </div>

      </div><!-- End compose-content -->
    </div><!-- End compose-container -->
  `,
  styles: [`
    .compose-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
      font-family: 'Google Sans', Roboto, sans-serif;
    }

    /* Header */
    .compose-header {
      background: #f8f9fa;
      border-bottom: 1px solid #e8eaed;
      padding: 12px 16px;
      flex-shrink: 0;
      cursor: move;
      user-select: none;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #3c4043;
    }

    .compose-icon {
      font-size: 16px;
      color: #5f6368;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .header-actions button {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }

    .header-actions mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Recipients Section */
    .recipients-section {
      border-bottom: 1px solid #e8eaed;
      flex-shrink: 0;
    }

    .recipient-row {
      display: flex;
      min-height: 48px;
      border-bottom: 1px solid #f1f3f4;
    }

    .recipient-row:last-child {
      border-bottom: none;
    }

    .field-label {
      width: 60px;
      padding: 12px 16px;
      color: #5f6368;
      font-size: 14px;
      background: #fafafa;
      border-right: 1px solid #e8eaed;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-shrink: 0;
    }

    .field-input {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 8px 16px;
      position: relative;
    }

    .chip-input {
      border: none;
      outline: none;
      font-size: 14px;
      background: transparent;
      flex: 1;
      min-width: 150px;
      padding: 4px 0;
    }

    .cc-bcc-toggle {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }

    .toggle-link {
      background: none;
      border: none;
      color: #1a73e8;
      font-size: 13px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .toggle-link:hover {
      background: #f1f3f4;
    }

    /* Material Chips */
    mat-chip-grid {
      margin-right: 8px;
    }

    mat-chip-row {
      background: #e8f0fe !important;
      color: #1a73e8 !important;
      font-size: 13px;
      margin: 2px;
    }

    mat-chip-row.invalid-chip {
      background: #fce8e6 !important;
      color: #d93025 !important;
    }

    /* Subject Field */
    .subject-row {
      border-bottom: 1px solid #e8eaed;
    }

    .subject-input {
      width: 100%;
      border: none;
      outline: none;
      padding: 12px 16px;
      font-size: 14px;
      background: transparent;
    }

    .subject-input::placeholder {
      color: #9aa0a6;
    }

    /* Attachments */
    .attachments-section {
      background: #f8f9fa;
      border-bottom: 1px solid #e8eaed;
      padding: 12px 16px;
      flex-shrink: 0;
    }

    .attachments-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #5f6368;
      margin-bottom: 8px;
    }

    .attachment-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #e8eaed;
    }

    .file-icon {
      color: #5f6368;
      font-size: 20px;
    }

    .file-info {
      flex: 1;
    }

    .file-name {
      font-size: 13px;
      font-weight: 500;
      color: #202124;
    }

    .file-size {
      font-size: 12px;
      color: #5f6368;
    }

    .remove-btn {
      color: #5f6368;
    }

    .remove-btn:hover {
      color: #d93025;
      background: #fce8e6;
    }

    /* Editor Section */
    .editor-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    quill-editor {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Override Quill styles - Gmail appearance */
    :host ::ng-deep .ql-toolbar {
      border: none !important;
      border-bottom: 1px solid #dadce0 !important;
      background: #f5f5f5 !important;
      padding: 10px 12px !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 10 !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
    }

    :host ::ng-deep .ql-container {
      border: none !important;
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow-y: auto !important;
      max-height: 100% !important;
      background: white !important;
    }

    :host ::ng-deep .ql-editor {
      padding: 16px 20px !important;
      flex: 1 !important;
      font-size: 14px !important;
      line-height: 1.6 !important;
      color: #202124 !important;
      font-family: 'Google Sans', Roboto, Arial, sans-serif !important;
      overflow-y: auto !important;
      max-height: 100% !important;
      min-height: 250px !important;
    }

    :host ::ng-deep .ql-editor.ql-blank::before {
      color: #9aa0a6 !important;
      font-style: normal !important;
    }

    /* Fix Quill toolbar buttons */
    :host ::ng-deep .ql-toolbar .ql-formats {
      margin-right: 8px !important;
    }

    :host ::ng-deep .ql-toolbar button {
      margin: 0 2px !important;
      padding: 4px !important;
      border-radius: 4px !important;
    }

    :host ::ng-deep .ql-toolbar button:hover {
      background: #f1f3f4 !important;
    }

    :host ::ng-deep .ql-toolbar button.ql-active {
      background: #e8f0fe !important;
      color: #1a73e8 !important;
    }

    /* Footer */
    .compose-footer {
      background: white;
      border-top: 1px solid #e8eaed;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .main-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .send-btn {
      background: #1a73e8 !important;
      color: white !important;
      font-weight: 500;
      text-transform: none;
      border-radius: 4px;
      padding: 8px 24px;
      font-size: 14px;
    }

    .send-btn:hover:not([disabled]) {
      background: #1557b0 !important;
    }

    .send-btn[disabled] {
      background: #dadce0 !important;
      color: #9aa0a6 !important;
    }

    .format-btn {
      color: #5f6368;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .secondary-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .action-btn {
      color: #5f6368;
    }

    .action-btn:hover {
      background: #f1f3f4;
      color: #202124;
    }

    .delete-btn:hover {
      background: #fce8e6;
      color: #d93025;
    }

    .divider {
      height: 24px;
      margin: 0 8px;
    }

    /* Auto-save status */
    .auto-save-status {
      position: absolute;
      bottom: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #5f6368;
      background: white;
      padding: 4px 8px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .save-icon {
      font-size: 14px;
    }

    /* Minimize/Maximize states */
    .compose-container.minimized {
      height: auto !important;
    }

    .compose-container.minimized .compose-header {
      border-bottom: none;
    }

    .compose-container.maximized {
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
    }

    /* Compose content wrapper */
    .compose-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .field-label {
        width: 40px;
        font-size: 12px;
      }

      .compose-footer {
        flex-direction: column;
        gap: 8px;
      }

      .main-actions, .secondary-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class EnhancedComposeComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Form Controls
  toInputControl = new FormControl('');
  ccInputControl = new FormControl('');
  bccInputControl = new FormControl('');
  subjectControl = new FormControl('');
  contentControl = new FormControl('');

  // State
  showCcBcc = false;
  isSending = false;
  isSendingEmail = false; // Prevent auto-save during send
  autoSaveStatus = '';
  isEditingDraft = false;
  currentDraftId: string | null = null;
  isAutoSaving = false; // Prevent concurrent auto-saves
  isMinimized = false;
  isMaximized = false;

  // Recipients
  toChips: EmailChip[] = [];
  ccChips: EmailChip[] = [];
  bccChips: EmailChip[] = [];

  // Attachments
  attachments: AttachmentFile[] = [];

  // Keyboard shortcuts
  separatorKeysCodes: number[] = [ENTER, COMMA];


  // Autocomplete observables
  filteredToEmails: Observable<string[]>;
  filteredCcEmails: Observable<string[]>;
  filteredBccEmails: Observable<string[]>;

  // Quill configuration - Gmail-style toolbar
  quillModules = {
    toolbar: [
      [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  };

  editorStyles = {
    height: '300px'
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private mailService: MailService,
    private router: Router,
    private snackBar: MatSnackBar,
    @Optional() private dialogRef?: MatDialogRef<EnhancedComposeComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private data?: ComposeDialogData
  ) {
    // Initialize autocomplete with API-based filtering
    this.filteredToEmails = this.toInputControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this.getEmailSuggestions(value || '')),
      takeUntil(this.destroy$)
    );

    this.filteredCcEmails = this.ccInputControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this.getEmailSuggestions(value || '')),
      takeUntil(this.destroy$)
    );

    this.filteredBccEmails = this.bccInputControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this.getEmailSuggestions(value || '')),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    this.setupAutoSave();
    this.initializeFromData();
  }

  private initializeFromData(): void {
    if (this.data?.mode === 'edit-draft' && this.data.draftData) {
      this.isEditingDraft = true;
      this.currentDraftId = this.data.draftData.messageId;
      this.populateFormWithDraftData(this.data.draftData);
    }
  }

  private populateFormWithDraftData(draftData: ComposeDialogData['draftData']): void {
    if (!draftData) return;

    // Populate recipients
    if (draftData.to && Array.isArray(draftData.to)) {
      this.toChips = draftData.to.map((email: string) => this.createEmailChip(email));
    }
    if (draftData.cc && Array.isArray(draftData.cc)) {
      this.ccChips = draftData.cc.map((email: string) => this.createEmailChip(email));
      this.showCcBcc = true;
    }
    if (draftData.bcc && Array.isArray(draftData.bcc)) {
      this.bccChips = draftData.bcc.map((email: string) => this.createEmailChip(email));
      this.showCcBcc = true;
    }

    // Populate subject and content
    this.subjectControl.setValue(draftData.subject || '');
    this.contentControl.setValue(draftData.htmlContent || draftData.textContent || '');

    // Handle attachments if any
    if (draftData.attachments && Array.isArray(draftData.attachments)) {
      // Convert EmailAttachment objects to AttachmentFile objects for display
      this.attachments = draftData.attachments.map((attachment: any) => {
        // Check if it's already a File object or an EmailAttachment
        if (attachment instanceof File) {
          return attachment as AttachmentFile;
        } else {
          // Create a pseudo-File object from EmailAttachment for display purposes
          // We'll keep track of the original attachment data
          const pseudoFile = {
            name: attachment.filename,
            size: attachment.size,
            type: attachment.contentType,
            id: attachment.id,
            lastModified: Date.now(),
            // Mark as existing attachment (not uploading)
            uploading: false,
            progress: 100,
            // Store original attachment data for sending
            isExistingAttachment: true,
            originalData: attachment
          } as any;
          return pseudoFile as AttachmentFile;
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isDialogMode(): boolean {
    return !!this.dialogRef;
  }

  private setupAutoSave(): void {
    // Simple auto-save on content changes
    this.contentControl.valueChanges.pipe(
      debounceTime(2000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.performAutoSave();
    });
  }

  private getEmailSuggestions(query: string): Observable<string[]> {
    if (!query || query.trim().length < 1) {
      // Return empty suggestions for very short queries
      return of([]);
    }

    return this.mailService.getEmailSuggestions(query.trim()).pipe(
      map(response => response.suggestions || []),
      catchError(error => {
        console.error('Failed to fetch email suggestions:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private createEmailChip(email: string): EmailChip {
    return {
      email: email.trim(),
      valid: this.validateEmail(email.trim())
    };
  }

  // Chip Management
  addToChip(event: { input: HTMLInputElement; value: string }): void {
    const value = (event.value || '').trim();
    if (value) {
      this.toChips.push(this.createEmailChip(value));
      this.toInputControl.setValue('');
    }
  }

  removeToChip(index: number): void {
    this.toChips.splice(index, 1);
  }

  selectToEmail(event: { option: { value: string } }): void {
    this.toChips.push(this.createEmailChip(event.option.value));
    this.toInputControl.setValue('');
  }

  addCcChip(event: { input: HTMLInputElement; value: string }): void {
    const value = (event.value || '').trim();
    if (value) {
      this.ccChips.push(this.createEmailChip(value));
      this.ccInputControl.setValue('');
    }
  }

  removeCcChip(index: number): void {
    this.ccChips.splice(index, 1);
  }

  selectCcEmail(event: { option: { value: string } }): void {
    this.ccChips.push(this.createEmailChip(event.option.value));
    this.ccInputControl.setValue('');
  }

  addBccChip(event: { input: HTMLInputElement; value: string }): void {
    const value = (event.value || '').trim();
    if (value) {
      this.bccChips.push(this.createEmailChip(value));
      this.bccInputControl.setValue('');
    }
  }

  removeBccChip(index: number): void {
    this.bccChips.splice(index, 1);
  }

  selectBccEmail(event: { option: { value: string } }): void {
    this.bccChips.push(this.createEmailChip(event.option.value));
    this.bccInputControl.setValue('');
  }

  toggleCcBcc(): void {
    this.showCcBcc = !this.showCcBcc;
  }

  // File handling
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      for (let file of files) {
        const attachment: AttachmentFile = Object.assign(file, {
          id: Date.now().toString() + Math.random().toString(36)
        });
        this.attachments.push(attachment);
      }
    }
    const inputTarget = event.target as HTMLInputElement;
    if (inputTarget) {
      inputTarget.value = '';
    }
  }

  openFileSelector(): void {
    this.fileInput.nativeElement.click();
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('document')) return 'description';
    return 'attach_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Editor methods
  onContentChanged(event: { editor: any; html: string | null; text: string }): void {
    // Content changed
  }

  formatText(format: string): void {
    this.snackBar.open(`${format} formatting applied`, 'Close', { duration: 1000 });
  }

  insertLink(): void {
    const url = prompt('Enter URL:');
    if (url) {
      this.snackBar.open('Link inserted', 'Close', { duration: 1000 });
    }
  }

  insertEmoji(): void {
    const emojis = ['😀', '😊', '👍', '❤️', '🎉'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const currentContent = this.contentControl.value || '';
    this.contentControl.setValue(currentContent + randomEmoji);
  }

  onSubjectChange(): void {
    // Subject changed
  }

  // Auto-save
  private performAutoSave(): void {
    // Only auto-save if there's actual content
    if (!this.hasContent()) {
      return;
    }

    // Don't auto-save while sending email
    if (this.isSending || this.isSendingEmail) {
      console.log('Email is being sent, skipping auto-save...');
      return;
    }

    // Prevent concurrent auto-save operations
    if (this.isAutoSaving) {
      console.log('Auto-save already in progress, skipping...');
      return;
    }

    this.isAutoSaving = true;
    this.autoSaveStatus = 'Saving draft...';

    const draftData = {
      to: this.toChips.filter(chip => chip.valid).map(chip => chip.email).join(','),
      cc: this.ccChips.filter(chip => chip.valid).map(chip => chip.email).join(','),
      bcc: this.bccChips.filter(chip => chip.valid).map(chip => chip.email).join(','),
      subject: this.subjectControl.value || '',
      htmlContent: this.contentControl.value || '',
      attachments: this.attachments
    };

    // If we already have a draft ID, update it instead of creating a new one
    const saveObservable = this.currentDraftId
      ? this.mailService.updateDraft(this.currentDraftId, draftData)
      : this.mailService.saveDraft(draftData);

    saveObservable.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Store the draft ID for future updates (only on first save)
        if (!this.currentDraftId && response.messageId) {
          this.currentDraftId = response.messageId;
          console.log('Draft created with ID:', response.messageId);
        }
        this.autoSaveStatus = 'Draft saved';
        this.isAutoSaving = false;
        setTimeout(() => {
          this.autoSaveStatus = '';
        }, 2000);
      },
      error: (error) => {
        this.autoSaveStatus = 'Save failed';
        this.isAutoSaving = false;
        console.error('Auto-save failed:', error);
        setTimeout(() => {
          this.autoSaveStatus = '';
        }, 2000);
      }
    });
  }

  saveDraft(): void {
    if (!this.hasContent()) {
      this.snackBar.open('Nothing to save', 'Close', { duration: 2000 });
      return;
    }

    const draftData = {
      to: this.toChips.filter(chip => chip.valid).map(chip => chip.email).join(','),
      cc: this.ccChips.filter(chip => chip.valid).map(chip => chip.email).join(','),
      bcc: this.bccChips.filter(chip => chip.valid).map(chip => chip.email).join(','),
      subject: this.subjectControl.value || '',
      htmlContent: this.contentControl.value || '',
      attachments: this.attachments
    };

    if (this.currentDraftId) {
      // Update existing draft (whether from auto-save or editing)
      this.mailService.updateDraft(this.currentDraftId, draftData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.snackBar.open('Draft updated successfully', 'Close', { duration: 2000 });
          this.closeDialog('saved');
        },
        error: (error) => {
          this.snackBar.open('Failed to update draft', 'Close', { duration: 3000 });
          console.error('Failed to update draft:', error);
        }
      });
    } else {
      // Create new draft only if no currentDraftId exists
      this.mailService.saveDraft(draftData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          if (response.messageId) {
            this.currentDraftId = response.messageId;
          }
          this.snackBar.open('Draft saved successfully', 'Close', { duration: 2000 });
          this.closeDialog('saved');
        },
        error: (error) => {
          this.snackBar.open('Failed to save draft', 'Close', { duration: 3000 });
          console.error('Failed to save draft:', error);
        }
      });
    }
  }

  discardDraft(): void {
    if (confirm('Discard this draft?')) {
      this.goBack();
    }
  }

  // Send email - getter for reactive updates
  get isReadyToSend(): boolean {
    // Check if we have valid chips OR text in the input field
    const hasValidChips = this.toChips.some(chip => chip.valid);
    const hasToInput = !!(this.toInputControl.value?.trim());

    return (hasValidChips || hasToInput) && !this.isSending;
  }

  canSend(): boolean {
    return this.isReadyToSend;
  }

  async sendEmail(): Promise<void> {
    // Auto-convert any remaining text in input fields to chips before sending
    this.convertInputsToChips();

    if (!this.hasValidRecipients()) {
      this.snackBar.open('Please add at least one valid recipient', 'Close', { duration: 3000 });
      return;
    }

    // Prevent auto-save during send operation
    this.isSending = true;
    this.isSendingEmail = true;

    try {
      const emailData = {
        to: this.toChips.filter(chip => chip.valid).map(chip => chip.email).join(','),
        cc: this.ccChips.filter(chip => chip.valid).map(chip => chip.email).join(','),
        bcc: this.bccChips.filter(chip => chip.valid).map(chip => chip.email).join(','),
        subject: this.subjectControl.value || '(No Subject)',
        htmlContent: this.contentControl.value || '',
        attachments: this.attachments
      };

      // Send the email
      await firstValueFrom(this.mailService.sendEmail(emailData));

      // If we have a draft (either from editing or auto-save), delete it after successful send
      if (this.currentDraftId) {
        try {
          await firstValueFrom(this.mailService.deleteDraft(this.currentDraftId));
          console.log('Draft deleted after sending:', this.currentDraftId);
          this.currentDraftId = null; // Clear draft ID after deletion
        } catch (error) {
          console.error('Failed to delete draft after sending:', error);
          // Don't fail the send operation if draft deletion fails
        }
      }

      this.snackBar.open('Email sent successfully!', 'Close', { duration: 3000 });
      this.closeDialog('sent');
    } catch (error) {
      console.error('Error sending email:', error);
      this.snackBar.open('Failed to send email', 'Close', { duration: 5000 });
    } finally {
      this.isSending = false;
      this.isSendingEmail = false;
    }
  }

  private convertInputsToChips(): void {
    // Convert To input to chip
    const toValue = this.toInputControl.value?.trim();
    if (toValue) {
      this.toChips.push(this.createEmailChip(toValue));
      this.toInputControl.setValue('');
    }

    // Convert Cc input to chip
    const ccValue = this.ccInputControl.value?.trim();
    if (ccValue) {
      this.ccChips.push(this.createEmailChip(ccValue));
      this.ccInputControl.setValue('');
    }

    // Convert Bcc input to chip
    const bccValue = this.bccInputControl.value?.trim();
    if (bccValue) {
      this.bccChips.push(this.createEmailChip(bccValue));
      this.bccInputControl.setValue('');
    }
  }

  private hasValidRecipients(): boolean {
    return this.toChips.some(chip => chip.valid);
  }

  confirmClose(): void {
    if (this.hasContent()) {
      if (confirm('You have unsaved changes. Discard this draft?')) {
        this.goBack();
      }
    } else {
      this.goBack();
    }
  }

  private hasContent(): boolean {
    return !!(
      this.toChips.length > 0 ||
      this.ccChips.length > 0 ||
      this.bccChips.length > 0 ||
      this.subjectControl.value?.trim() ||
      this.contentControl.value?.trim() ||
      this.attachments.length > 0
    );
  }

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.isMaximized = false;
    }
    this.updateDialogClass();
  }

  toggleMaximize(): void {
    this.isMaximized = !this.isMaximized;
    if (this.isMaximized) {
      this.isMinimized = false;
    }
    this.updateDialogClass();
  }

  private updateDialogClass(): void {
    if (!this.dialogRef) return;

    const overlayPane = document.querySelector('.compose-dialog');
    if (overlayPane) {
      overlayPane.classList.remove('maximized', 'minimized');
      if (this.isMaximized) {
        overlayPane.classList.add('maximized');
      } else if (this.isMinimized) {
        overlayPane.classList.add('minimized');
      }
    }
  }

  goBack(): void {
    this.closeDialog();
  }

  private closeDialog(result?: string): void {
    if (this.dialogRef) {
      this.dialogRef.close(result);
    } else {
      this.router.navigate(['/inbox']);
    }
  }
}