import { EmailAttachment } from './email.models';

export interface ConversationDTO {
  threadId: string;
  subject: string;
  participants: string[];
  messageCount: number;
  lastMessageDate: string;
  hasUnread: boolean;
  hasAttachments: boolean;
  preview: string;
  isStarred?: boolean;
  messages?: EmailDetailDTO[];
}

export interface ConversationListResponse {
  conversations: ConversationDTO[];
  totalCount: number;
  page: number;
  size: number;
  hasMore: boolean;
}

export interface EmailHeaderDTO {
  messageId: string;
  from: string;
  subject: string;
  date: string;
  unread: boolean;
  hasAttachments: boolean;
  preview: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export interface EmailDetailDTO extends EmailHeaderDTO {
  htmlContent: string;
  textContent: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

export interface EmailActionRequest {
  messageIds: string[];
  action: EmailAction;
  folder?: string;
}

export enum EmailAction {
  MARK_AS_READ = 'MARK_AS_READ',
  MARK_AS_UNREAD = 'MARK_AS_UNREAD',
  DELETE = 'DELETE',
  ARCHIVE = 'ARCHIVE',
  MOVE_TO_INBOX = 'MOVE_TO_INBOX',
  MOVE_TO_SPAM = 'MOVE_TO_SPAM',
  MOVE_TO_TRASH = 'MOVE_TO_TRASH',
  STAR = 'STAR',
  UNSTAR = 'UNSTAR',
  MARK_IMPORTANT = 'MARK_IMPORTANT',
  UNMARK_IMPORTANT = 'UNMARK_IMPORTANT'
}