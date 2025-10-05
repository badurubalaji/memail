import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/components/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/components/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/components/reset-password.component')
      .then(m => m.ResetPasswordComponent)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./auth/components/change-password.component')
      .then(m => m.ChangePasswordComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./auth/components/profile.component')
      .then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    loadComponent: () => import('./mail/components/mail-layout.component')
      .then(m => m.MailLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/inbox',
        pathMatch: 'full'
      },
      {
        path: 'inbox',
        loadComponent: () => import('./mail/components/mail-list.component')
          .then(m => m.MailListComponent),
        data: { folder: 'INBOX' }
      },
      {
        path: 'starred',
        loadComponent: () => import('./mail/components/mail-list.component')
          .then(m => m.MailListComponent),
        data: { folder: 'STARRED' }
      },
      {
        path: 'important',
        loadComponent: () => import('./mail/components/mail-list.component')
          .then(m => m.MailListComponent),
        data: { folder: 'IMPORTANT' }
      },
      {
        path: 'sent',
        loadComponent: () => import('./mail/components/mail-list.component')
          .then(m => m.MailListComponent),
        data: { folder: 'SENT' }
      },
      {
        path: 'drafts',
        loadComponent: () => import('./mail/components/mail-list.component')
          .then(m => m.MailListComponent),
        data: { folder: 'DRAFTS' }
      },
      {
        path: 'spam',
        loadComponent: () => import('./mail/components/mail-list.component')
          .then(m => m.MailListComponent),
        data: { folder: 'SPAM' }
      },
      {
        path: 'trash',
        loadComponent: () => import('./mail/components/mail-list.component')
          .then(m => m.MailListComponent),
        data: { folder: 'TRASH' }
      },
      {
        path: 'compose',
        loadComponent: () => import('./mail/components/enhanced-compose.component')
          .then(m => m.EnhancedComposeComponent)
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./admin/components/user-management.component')
          .then(m => m.UserManagementComponent)
      },
      {
        path: 'inbox/:threadId',
        loadComponent: () => import('./mail/components/mail-detail.component')
          .then(m => m.MailDetailComponent)
      },
      {
        path: 'starred/:threadId',
        loadComponent: () => import('./mail/components/mail-detail.component')
          .then(m => m.MailDetailComponent)
      },
      {
        path: 'important/:threadId',
        loadComponent: () => import('./mail/components/mail-detail.component')
          .then(m => m.MailDetailComponent)
      },
      {
        path: 'sent/:threadId',
        loadComponent: () => import('./mail/components/mail-detail.component')
          .then(m => m.MailDetailComponent)
      },
      {
        path: 'drafts/:threadId',
        loadComponent: () => import('./mail/components/mail-detail.component')
          .then(m => m.MailDetailComponent)
      },
      {
        path: 'spam/:threadId',
        loadComponent: () => import('./mail/components/mail-detail.component')
          .then(m => m.MailDetailComponent)
      },
      {
        path: 'trash/:threadId',
        loadComponent: () => import('./mail/components/mail-detail.component')
          .then(m => m.MailDetailComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/inbox'
  }
];