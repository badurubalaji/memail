import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { WebSocketService, EmailNotification } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div *ngIf="showNotification" class="notification-popup"
         [class.sliding-in]="isSliding"
         (click)="dismissNotification()">
      <div class="notification-content">
        <mat-icon class="notification-icon">email</mat-icon>
        <div class="notification-text">
          <div class="notification-title">New Email</div>
          <div class="notification-from">From: {{ currentNotification?.from }}</div>
          <div class="notification-subject">{{ currentNotification?.subject }}</div>
        </div>
        <mat-icon class="close-icon">close</mat-icon>
      </div>
    </div>
  `,
  styles: [`
    .notification-popup {
      position: fixed;
      top: 80px;
      right: 24px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 350px;
      z-index: 2000;
      cursor: pointer;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      border-left: 4px solid #1976d2;
    }

    .notification-popup.sliding-in {
      transform: translateX(0);
    }

    .notification-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
    }

    .notification-icon {
      color: #1976d2;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .notification-text {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-weight: 600;
      font-size: 14px;
      color: #202124;
      margin-bottom: 4px;
    }

    .notification-from {
      font-size: 13px;
      color: #5f6368;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notification-subject {
      font-size: 13px;
      color: #202124;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 500;
    }

    .close-icon {
      color: #5f6368;
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      cursor: pointer;
    }

    .close-icon:hover {
      color: #202124;
    }

    @media (max-width: 480px) {
      .notification-popup {
        right: 16px;
        left: 16px;
        max-width: none;
      }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  showNotification = false;
  isSliding = false;
  currentNotification: EmailNotification | null = null;
  private destroy$ = new Subject<void>();
  private hideTimeout?: number;

  constructor(
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Connect to WebSocket when component initializes
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.email) {
      this.webSocketService.connect(currentUser.email);
    }

    // Subscribe to notifications
    this.webSocketService.getNotifications()
      .pipe(
        takeUntil(this.destroy$),
        filter(notification => notification !== null)
      )
      .subscribe((notification: EmailNotification) => {
        if (notification.type === 'NEW_EMAIL') {
          this.showNewEmailNotification(notification);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.webSocketService.disconnect();
    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
    }
  }

  private showNewEmailNotification(notification: EmailNotification): void {
    this.currentNotification = notification;
    this.showNotification = true;

    // Trigger sliding animation
    setTimeout(() => {
      this.isSliding = true;
    }, 50);

    // Auto-hide after 5 seconds
    this.hideTimeout = window.setTimeout(() => {
      this.dismissNotification();
    }, 5000);

    // Also show a snackbar for backup
    this.snackBar.open(
      `New email from ${notification.from}: ${notification.subject}`,
      'View',
      { duration: 4000 }
    );
  }

  dismissNotification(): void {
    this.isSliding = false;
    setTimeout(() => {
      this.showNotification = false;
      this.currentNotification = null;
    }, 300);

    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
    }
  }
}