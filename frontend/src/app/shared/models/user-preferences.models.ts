export interface UserPreferences {
  id?: number;
  userEmail: string;
  emailsPerPage: number;
  theme: 'light' | 'dark' | 'auto';
  conversationView: boolean;
  autoMarkRead: boolean;
  notificationSound: boolean;
  desktopNotifications: boolean;
  compactView: boolean;
  previewPane: boolean;
  language: string;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  userEmail: '',
  emailsPerPage: 50,
  theme: 'light',
  conversationView: true,
  autoMarkRead: true,
  notificationSound: true,
  desktopNotifications: true,
  compactView: false,
  previewPane: true,
  language: 'en',
  timezone: 'UTC'
};