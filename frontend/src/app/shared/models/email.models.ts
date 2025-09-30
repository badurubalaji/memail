export interface EmailHeader {
  messageId: string;
  from: string;
  subject: string;
  date: string;
  unread: boolean;
  hasAttachments: boolean;
  preview: string;
}

export interface EmailListResponse {
  emails: EmailHeader[];
  totalCount: number;
  page: number;
  size: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface EmailAttachment {
  id?: string;
  filename: string;
  contentType: string;
  size: number;
  data?: string; // base64 encoded data
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services: {
    mail: string;
    database?: string;
  };
}

export interface EmailActionResponse {
  success: boolean;
  message: string;
  processedMessages: number;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  messageId: string;
}

export interface DraftResponse {
  messageId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  textContent?: string;
  htmlContent?: string;
  attachments?: EmailAttachment[];
  lastModified: string;
  created: string;
}

export interface DraftUpdateData {
  to: string[] | string;
  cc?: string[] | string;
  bcc?: string[] | string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachments?: (File | EmailAttachment)[];
}

export interface ReplyData {
  type: 'reply' | 'replyAll' | 'forward';
  originalMessageId: string;
  to: string[];
  cc?: string[];
  subject: string;
  htmlContent: string;
  attachments?: File[];
  threadId?: string;
}

export interface ComposeDialogData {
  mode: 'compose' | 'edit-draft' | 'reply' | 'forward';
  draftData?: DraftResponse;
  replyData?: ReplyData;
}

export interface MatCheckboxChange {
  checked: boolean;
  source: any;
}

export interface MatChipInputEvent {
  input: HTMLInputElement;
  value: string;
  chipInput: any;
}

export interface QuillEditorEvent {
  editor: any;
  html: string;
  text: string;
}

export interface FileSelectEvent extends Event {
  target: HTMLInputElement & { files: FileList | null };
}

export interface DraftEmail {
  messageId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  textContent?: string;
  htmlContent?: string;
  attachments?: EmailAttachment[];
  lastModified: string;
  created: string;
  replyToMessageId?: string;
  replyType?: string;
  threadId?: string;
  folder?: string;
}