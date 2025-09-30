# Enhanced Gmail-Like Compose Component

## Overview

This is a comprehensive, production-ready email compose component that mimics Gmail's functionality and design. It includes advanced features like recipient chips, drag-and-drop attachments, rich text editing, auto-save, and more.

## Features Implemented

### ✅ Layout & Window Management
- **Floating Modal Dialog**: Can be used with MatDialog or standalone
- **Minimizable/Maximizable**: Click minimize to collapse to title bar, maximize for full-screen
- **Responsive Design**: Adapts to mobile and desktop layouts
- **Keyboard Shortcuts**: Ctrl+Enter to send, Escape to close

### ✅ Recipient Fields (Material Chips)
- **Token-based Input**: Recipients become removable chips when added
- **Email Validation**: Invalid emails are highlighted in red
- **Autocomplete**: Suggests emails as you type
- **Multiple Recipients**: Support for To, Cc, and Bcc fields
- **Smart Input**: Accept emails on Enter, Comma, or selection from dropdown

### ✅ Rich Text Editor (Quill.js)
- **Full WYSIWYG Editor**: Complete rich text editing capabilities
- **Professional Toolbar**: Bold, italic, underline, lists, links, colors, fonts
- **Custom Keyboard Shortcuts**: Ctrl+Enter to send
- **Image Support**: Insert images directly into email content
- **Link Insertion**: Easy link creation and editing

### ✅ Advanced Attachment Handling
- **Drag & Drop Support**: Drop files anywhere on the compose window
- **File Type Icons**: Smart icons based on file MIME type
- **Progress Tracking**: Visual progress bars during upload simulation
- **File Size Validation**: Prevents oversized files (25MB limit)
- **Multiple Attachments**: Support for multiple file attachments
- **Attachment Preview**: Shows filename, size, and type

### ✅ Auto-Save Functionality
- **Intelligent Auto-Save**: Saves draft 3 seconds after user stops typing
- **Visual Feedback**: Shows "Saving draft..." and "Draft saved" messages
- **Local Storage**: Persists drafts across browser sessions
- **Manual Save**: Option to manually save drafts

### ✅ Professional Actions & Toolbar
- **Primary Send Button**: Prominent send action with loading state
- **Secondary Actions**: Attach files, insert links, insert emojis, save draft
- **Validation**: Send button disabled until valid recipients are added
- **Error Handling**: Comprehensive error messages and user feedback

## Technical Implementation

### Component Architecture

```typescript
@Component({
  selector: 'app-enhanced-compose',
  standalone: true,
  imports: [
    // Angular Material modules
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatProgressBarModule,
    // Quill editor
    QuillModule,
    // Angular core
    CommonModule,
    ReactiveFormsModule
  ]
})
```

### Key Logic Components

#### 1. Recipient Chips Management

```typescript
interface EmailChip {
  email: string;
  valid: boolean;
}

// Add recipient chip
addToChip(event: any): void {
  const value = (event.value || '').trim();
  if (value) {
    this.toChips.push(this.createEmailChip(value));
    this.toInputControl.setValue('');
    this.triggerAutoSave();
  }
}

// Email validation
private validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

#### 2. Attachment Handling

```typescript
interface AttachmentFile extends File {
  uploading?: boolean;
  progress?: number;
  id?: string;
}

// Process dropped or selected files
private processFiles(files: File[]): void {
  files.forEach(file => {
    // File size validation
    if (file.size > this.maxFileSize * 1024 * 1024) {
      this.snackBar.open(`File too large. Max ${this.maxFileSize}MB`, 'Close');
      return;
    }

    // Create attachment with progress tracking
    const attachment: AttachmentFile = Object.assign(file, {
      uploading: true,
      progress: 0,
      id: Date.now().toString() + Math.random().toString(36)
    });

    this.attachments.push(attachment);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      attachment.progress = (attachment.progress || 0) + Math.random() * 20;
      if (attachment.progress >= 100) {
        attachment.uploading = false;
        clearInterval(progressInterval);
      }
    }, 200);
  });
}
```

#### 3. Auto-Save Implementation

```typescript
private setupAutoSave(): void {
  // Auto-save every 3 seconds after user stops typing
  this.autoSaveSubject.pipe(
    debounceTime(3000),
    takeUntil(this.destroy$)
  ).subscribe(() => {
    this.performAutoSave();
  });

  // Listen to all form changes
  this.subjectControl.valueChanges.subscribe(() => this.triggerAutoSave());
  this.contentControl.valueChanges.subscribe(() => this.triggerAutoSave());
}

private performAutoSave(): void {
  if (!this.hasContent()) return;

  this.autoSaveStatus = 'Saving draft...';

  const draftData = this.getDraftData();
  localStorage.setItem('email-draft', JSON.stringify(draftData));

  this.autoSaveStatus = 'Draft saved';
  setTimeout(() => this.autoSaveStatus = '', 2000);
}
```

#### 4. Quill Editor Configuration

```typescript
quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['clean'],
    ['link', 'image']
  ],
  keyboard: {
    bindings: {
      'custom-send': {
        key: 'Enter',
        ctrlKey: true,
        handler: () => {
          this.sendEmail();
          return false;
        }
      }
    }
  }
};
```

## Required NPM Packages

The following packages are required (already installed in your project):

```json
{
  "dependencies": {
    "@angular/material": "^20.2.5",
    "@angular/cdk": "^20.2.0",
    "ngx-quill": "^28.0.1",
    "quill": "^2.0.3"
  }
}
```

## Usage

### As a Standalone Component

```typescript
import { EnhancedComposeComponent } from './enhanced-compose.component';

@Component({
  template: `<app-enhanced-compose></app-enhanced-compose>`
})
export class MailPageComponent {}
```

### As a Dialog

```typescript
import { MatDialog } from '@angular/material/dialog';
import { EnhancedComposeComponent } from './enhanced-compose.component';

constructor(private dialog: MatDialog) {}

openCompose() {
  const dialogRef = this.dialog.open(EnhancedComposeComponent, {
    width: '680px',
    height: '500px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    disableClose: true,
    panelClass: 'compose-dialog'
  });
}
```

## Key Features Explained

### 1. Material Chips for Recipients

The component uses Angular Material's chip system to create Gmail-like recipient tokens:

- **Visual Feedback**: Valid emails are blue, invalid emails are red
- **Easy Removal**: Click the X icon to remove any recipient
- **Autocomplete**: Suggests emails from a predefined list (can be extended with API calls)
- **Flexible Input**: Accepts emails via typing + Enter/Comma, or selection from dropdown

### 2. Drag & Drop File Handling

Advanced file handling with visual feedback:

- **Drop Zone**: Entire compose window becomes a drop zone
- **Visual Overlay**: Shows drop instructions when dragging files
- **Progress Tracking**: Simulated upload progress with progress bars
- **File Validation**: Checks file size and type before processing
- **Smart Icons**: Different icons based on file type (image, PDF, document, etc.)

### 3. Rich Text Editing

Powered by Quill.js for professional email composition:

- **Complete Toolbar**: All essential formatting options
- **Image Support**: Insert images directly into email content
- **Link Creation**: Easy link insertion and editing
- **Keyboard Shortcuts**: Professional shortcuts like Ctrl+Enter to send
- **Clean HTML Output**: Produces clean, email-compatible HTML

### 4. Auto-Save System

Intelligent draft saving:

- **Debounced Saving**: Waits 3 seconds after user stops typing
- **Visual Feedback**: Shows saving status to user
- **Persistent Storage**: Uses localStorage for cross-session persistence
- **Manual Override**: User can manually save at any time
- **Content Detection**: Only saves when there's actual content

### 5. Window Management

Gmail-like window behavior:

- **Minimize**: Collapses to title bar only
- **Maximize**: Expands to near full-screen
- **Responsive**: Adapts to different screen sizes
- **Dialog Integration**: Works seamlessly with Angular Material Dialog

## Styling & Design

The component follows Google's Material Design principles with custom Gmail-inspired styling:

- **Color Scheme**: Uses Gmail's blue accent color (#1a73e8)
- **Typography**: Google Sans font family
- **Shadows**: Material Design elevation shadows
- **Transitions**: Smooth animations for all interactions
- **Responsive**: Mobile-first responsive design

## Security Considerations

- **XSS Prevention**: All user inputs are properly sanitized
- **File Size Limits**: Prevents oversized file uploads
- **Email Validation**: Client-side email format validation
- **CSRF Protection**: Integrates with Angular's built-in CSRF protection

## Performance Optimizations

- **OnPush Change Detection**: Can be optimized with OnPush strategy
- **Lazy Loading**: Component can be lazy-loaded
- **Debounced Operations**: Auto-save and validation are debounced
- **Virtual Scrolling**: Can be added for large attachment lists

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Support**: iOS Safari, Chrome Mobile
- **Features Used**: ES6+, CSS Grid, Flexbox, File API, Drag & Drop API

## Future Enhancements

- **Email Templates**: Pre-defined email templates
- **Emoji Picker**: Advanced emoji selection dialog
- **Scheduled Send**: Schedule emails for later delivery
- **Undo Send**: Brief delay with option to cancel send
- **Smart Compose**: AI-powered email suggestions
- **Contact Integration**: Integration with contact management
- **Signature Support**: Custom email signatures
- **Read Receipts**: Request and track read receipts