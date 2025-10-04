import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { EnhancedComposeComponent } from './enhanced-compose.component';
import { MailService } from '../../core/services/mail.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('EnhancedComposeComponent', () => {
  let component: EnhancedComposeComponent;
  let fixture: ComponentFixture<EnhancedComposeComponent>;
  let mailService: jasmine.SpyObj<MailService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<EnhancedComposeComponent>>;

  beforeEach(async () => {
    const mailServiceSpy = jasmine.createSpyObj('MailService', [
      'sendEmail',
      'saveDraft',
      'updateDraft',
      'deleteDraft',
      'getEmailSuggestions'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [EnhancedComposeComponent, NoopAnimationsModule],
      providers: [
        { provide: MailService, useValue: mailServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();

    mailService = TestBed.inject(MailService) as jasmine.SpyObj<MailService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EnhancedComposeComponent>>;

    fixture = TestBed.createComponent(EnhancedComposeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form', () => {
      expect(component.toChips.length).toBe(0);
      expect(component.ccChips.length).toBe(0);
      expect(component.bccChips.length).toBe(0);
      expect(component.subjectControl.value).toBe('');
      expect(component.contentControl.value).toBe('');
    });

    it('should initialize with draft data when editing', () => {
      const draftData = {
        mode: 'edit-draft' as const,
        draftData: {
          messageId: 'draft-123',
          to: ['recipient@example.com'],
          cc: ['cc@example.com'],
          bcc: [],
          subject: 'Test Draft',
          htmlContent: '<p>Draft content</p>',
          textContent: '',
          attachments: []
        }
      };

      const componentWithData = new EnhancedComposeComponent(
        jasmine.createSpyObj('FormBuilder', ['group', 'control']),
        TestBed.inject(MailService) as any,
        router,
        snackBar,
        dialogRef,
        draftData
      );
      componentWithData.ngOnInit();

      expect(componentWithData.isEditingDraft).toBe(true);
      expect(componentWithData.currentDraftId).toBe('draft-123');
    });
  });

  describe('Email Validation', () => {
    it('should validate valid email addresses', () => {
      const validEmail = 'test@example.com';
      const chip = component['createEmailChip'](validEmail);

      expect(chip.valid).toBe(true);
      expect(chip.email).toBe(validEmail);
    });

    it('should invalidate malformed email addresses', () => {
      const invalidEmails = ['invalid', 'test@', '@example.com', 'test@.com'];

      invalidEmails.forEach(email => {
        const chip = component['createEmailChip'](email);
        expect(chip.valid).toBe(false);
      });
    });
  });

  describe('Recipient Management', () => {
    it('should add To recipient chip', () => {
      const event = { value: 'recipient@example.com', input: {} as HTMLInputElement };

      component.addToChip(event);

      expect(component.toChips.length).toBe(1);
      expect(component.toChips[0].email).toBe('recipient@example.com');
      expect(component.toInputControl.value).toBe('');
    });

    it('should remove To recipient chip', () => {
      component.toChips = [{ email: 'recipient@example.com', valid: true }];

      component.removeToChip(0);

      expect(component.toChips.length).toBe(0);
    });

    it('should add Cc recipient chip', () => {
      const event = { value: 'cc@example.com', input: {} as HTMLInputElement };

      component.addCcChip(event);

      expect(component.ccChips.length).toBe(1);
      expect(component.ccChips[0].email).toBe('cc@example.com');
    });

    it('should add Bcc recipient chip', () => {
      const event = { value: 'bcc@example.com', input: {} as HTMLInputElement };

      component.addBccChip(event);

      expect(component.bccChips.length).toBe(1);
      expect(component.bccChips[0].email).toBe('bcc@example.com');
    });

    it('should toggle Cc/Bcc visibility', () => {
      expect(component.showCcBcc).toBe(false);

      component.toggleCcBcc();

      expect(component.showCcBcc).toBe(true);

      component.toggleCcBcc();

      expect(component.showCcBcc).toBe(false);
    });
  });

  describe('Email Autocomplete', () => {
    it('should fetch email suggestions', fakeAsync(() => {
      const mockSuggestions = { suggestions: ['user1@example.com', 'user2@example.com'] };
      mailService.getEmailSuggestions.and.returnValue(of(mockSuggestions));

      // Subscribe to the observable to trigger the switchMap
      component.filteredToEmails.subscribe();

      component.toInputControl.setValue('user');
      tick(300); // debounce time

      expect(mailService.getEmailSuggestions).toHaveBeenCalledWith('user');
    }));

    it('should not fetch suggestions for very short queries', fakeAsync(() => {
      // Subscribe to the observable to trigger the switchMap
      component.filteredToEmails.subscribe();

      component.toInputControl.setValue('');
      tick(300);

      expect(mailService.getEmailSuggestions).not.toHaveBeenCalled();
    }));
  });

  describe('Send Email', () => {
    beforeEach(() => {
      component.toChips = [{ email: 'recipient@example.com', valid: true }];
      component.subjectControl.setValue('Test Subject');
      component.contentControl.setValue('<p>Test content</p>');
    });

    it('should send email successfully', (done) => {
      mailService.sendEmail.and.returnValue(of({ success: true, message: 'Email sent', messageId: 'msg-123' }));

      component.sendEmail().then(() => {
        expect(mailService.sendEmail).toHaveBeenCalled();
        expect(dialogRef.close).toHaveBeenCalledWith('sent');
        expect(snackBar.open).toHaveBeenCalledWith('Email sent successfully!', 'Close', jasmine.any(Object));
        done();
      }).catch(err => {
        fail('sendEmail rejected: ' + JSON.stringify(err));
        done();
      });
    });

    it('should not send email without valid recipients', (done) => {
      component.toChips = [];

      component.sendEmail().then(() => {
        setTimeout(() => {
          expect(mailService.sendEmail).not.toHaveBeenCalled();
          expect(snackBar.open).toHaveBeenCalledWith(
            'Please add at least one valid recipient',
            'Close',
            jasmine.any(Object)
          );
          done();
        }, 0);
      });
    });

    it('should handle send email error', (done) => {
      mailService.sendEmail.and.returnValue(throwError(() => new Error('Send failed')));

      component.sendEmail().then(() => {
        setTimeout(() => {
          expect(snackBar.open).toHaveBeenCalledWith('Failed to send email', 'Close', jasmine.any(Object));
          done();
        }, 0);
      });
    });

    it('should delete draft after successful send', (done) => {
      component.currentDraftId = 'draft-123';
      mailService.sendEmail.and.returnValue(of({ message: 'Email sent' } as any));
      mailService.deleteDraft.and.returnValue(of({} as any));

      component.sendEmail().then(() => {
        setTimeout(() => {
          expect(mailService.deleteDraft).toHaveBeenCalledWith('draft-123');
          done();
        }, 0);
      });
    });

    it('should convert inputs to chips before sending', (done) => {
      component.toChips = [];
      component.toInputControl.setValue('recipient@example.com');

      mailService.sendEmail.and.returnValue(of({ success: true, message: 'Email sent', messageId: 'msg-123' }));

      component.sendEmail().then(() => {
        setTimeout(() => {
          expect(component.toChips.length).toBe(1);
          expect(component.toChips[0].email).toBe('recipient@example.com');
          done();
        }, 0);
      });
    });
  });

  describe('Draft Management', () => {
    beforeEach(() => {
      component.toChips = [{ email: 'recipient@example.com', valid: true }];
      component.subjectControl.setValue('Draft Subject');
      component.contentControl.setValue('<p>Draft content</p>');
    });

    it('should save new draft', fakeAsync(() => {
      mailService.saveDraft.and.returnValue(of({
        messageId: 'draft-123',
        to: ['recipient@example.com'],
        subject: 'Draft Subject',
        htmlContent: '<p>Draft content</p>',
        lastModified: '2025-01-01T00:00:00',
        created: '2025-01-01T00:00:00'
      }));

      component.saveDraft();
      tick(); // Process the Observable subscription

      expect(mailService.saveDraft).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Draft saved successfully', 'Close', jasmine.any(Object));
    }));

    it('should update existing draft', fakeAsync(() => {
      component.currentDraftId = 'draft-123';
      mailService.updateDraft.and.returnValue(of({
        messageId: 'draft-123',
        to: ['recipient@example.com'],
        subject: 'Draft Subject',
        htmlContent: '<p>Draft content</p>',
        lastModified: '2025-01-01T00:00:00',
        created: '2025-01-01T00:00:00'
      }));

      component.saveDraft();
      tick(); // Process the Observable subscription

      expect(mailService.updateDraft).toHaveBeenCalledWith('draft-123', jasmine.any(Object));
      expect(snackBar.open).toHaveBeenCalledWith('Draft updated successfully', 'Close', jasmine.any(Object));
    }));

    it('should not save draft with no content', () => {
      component.toChips = [];
      component.subjectControl.setValue('');
      component.contentControl.setValue('');

      component.saveDraft();

      expect(mailService.saveDraft).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Nothing to save', 'Close', jasmine.any(Object));
    });

    it('should auto-save draft after content changes', fakeAsync(() => {
      component.toChips = [{ email: 'recipient@example.com', valid: true }];
      mailService.saveDraft.and.returnValue(of({
        messageId: 'draft-123',
        to: ['recipient@example.com'],
        subject: 'Draft Subject',
        htmlContent: '<p>Draft content</p>',
        lastModified: '2025-01-01T00:00:00',
        created: '2025-01-01T00:00:00'
      }));

      component.contentControl.setValue('<p>Auto-save test</p>');
      tick(2000); // debounce time
      tick(); // Process the Observable subscription

      expect(component.autoSaveStatus).toContain('saved');
    }));
  });

  describe('File Attachments', () => {
    it('should add file attachment', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const event = {
        target: {
          files: [file]
        }
      } as any;

      component.onFileSelected(event);

      expect(component.attachments.length).toBe(1);
      expect(component.attachments[0].name).toBe('test.txt');
    });

    it('should remove attachment', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      component.attachments = [file as any];

      component.removeAttachment(0);

      expect(component.attachments.length).toBe(0);
    });

    it('should format file size correctly', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1048576)).toBe('1 MB');
    });

    it('should determine correct file icon', () => {
      expect(component.getFileIcon('image/png')).toBe('image');
      expect(component.getFileIcon('application/pdf')).toBe('picture_as_pdf');
      expect(component.getFileIcon('application/msword')).toBe('attach_file');
      expect(component.getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('description');
      expect(component.getFileIcon('text/plain')).toBe('attach_file');
    });
  });

  describe('Dialog Management', () => {
    it('should detect dialog mode when dialogRef is present', () => {
      expect(component.isDialogMode()).toBe(true);
    });

    it('should close dialog with result', () => {
      component['closeDialog']('sent');

      expect(dialogRef.close).toHaveBeenCalledWith('sent');
    });

    it('should navigate to inbox when not in dialog mode', () => {
      component['dialogRef'] = undefined;
      component['closeDialog']();

      expect(router.navigate).toHaveBeenCalledWith(['/inbox']);
    });

    it('should confirm close with unsaved changes', () => {
      component.toChips = [{ email: 'recipient@example.com', valid: true }];
      spyOn(window, 'confirm').and.returnValue(true);

      component.confirmClose();

      expect(window.confirm).toHaveBeenCalled();
    });

    it('should close without confirmation when no changes', () => {
      spyOn(window, 'confirm');

      component.confirmClose();

      expect(window.confirm).not.toHaveBeenCalled();
    });
  });

  describe('Content Editing', () => {
    it('should handle content changes', () => {
      component.contentControl.setValue('<p>Initial content</p>');

      const event = {
        editor: {},
        html: '<p>New content</p>',
        text: 'New content'
      };

      component.onContentChanged(event);

      // Method should execute without errors
      expect(component.contentControl.value).toBe('<p>Initial content</p>');
    });

    it('should insert emoji', () => {
      component.contentControl.setValue('');

      component.insertEmoji();

      expect(component.contentControl.value).toMatch(/[😀😊👍❤️🎉]/);
    });

    it('should prompt for link insertion', () => {
      spyOn(window, 'prompt').and.returnValue('https://example.com');

      component.insertLink();

      expect(window.prompt).toHaveBeenCalledWith('Enter URL:');
      expect(snackBar.open).toHaveBeenCalledWith('Link inserted', 'Close', jasmine.any(Object));
    });
  });

  describe('State Management', () => {
    it('should determine ready to send state', () => {
      expect(component.isReadyToSend).toBe(false);

      component.toChips = [{ email: 'recipient@example.com', valid: true }];

      expect(component.isReadyToSend).toBe(true);
    });

    it('should disable send when already sending', () => {
      component.toChips = [{ email: 'recipient@example.com', valid: true }];
      component.isSending = true;

      expect(component.isReadyToSend).toBe(false);
    });

    it('should detect content presence', () => {
      expect(component['hasContent']()).toBe(false);

      component.subjectControl.setValue('Test');

      expect(component['hasContent']()).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on component destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
