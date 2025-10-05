import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models/auth.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule
  ],
  template: `
    <div class="profile-container">
      <mat-card class="profile-card">
        <mat-card-header>
          <div class="header-content">
            <div class="avatar">
              <mat-icon>account_circle</mat-icon>
            </div>
            <div class="user-info">
              <h2>{{ user?.displayName || 'User' }}</h2>
              <p>{{ user?.email }}</p>
            </div>
          </div>
        </mat-card-header>

        <mat-divider></mat-divider>

        <mat-card-content>
          <h3>Account Information</h3>
          <mat-list>
            <mat-list-item>
              <mat-icon matListItemIcon>email</mat-icon>
              <div matListItemTitle>Email</div>
              <div matListItemLine>{{ user?.email }}</div>
            </mat-list-item>

            <mat-list-item>
              <mat-icon matListItemIcon>badge</mat-icon>
              <div matListItemTitle>Role</div>
              <div matListItemLine>
                <span class="role-badge" [class.admin-badge]="isAdmin">
                  {{ user?.role || 'USER' }}
                </span>
              </div>
            </mat-list-item>
          </mat-list>

          <mat-divider style="margin: 20px 0;"></mat-divider>

          <h3>Security</h3>
          <div class="action-buttons">
            <button
              mat-raised-button
              color="primary"
              routerLink="/change-password"
              class="action-button"
            >
              <mat-icon>lock</mat-icon>
              Change Password
            </button>

            <button
              mat-raised-button
              (click)="logout()"
              class="action-button logout-button"
            >
              <mat-icon>logout</mat-icon>
              Logout
            </button>
          </div>

          <div *ngIf="isAdmin" class="admin-section">
            <mat-divider style="margin: 20px 0;"></mat-divider>
            <h3>Admin</h3>
            <button
              mat-raised-button
              color="accent"
              routerLink="/admin/users"
              class="action-button"
            >
              <mat-icon>admin_panel_settings</mat-icon>
              User Management
            </button>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button
            mat-button
            routerLink="/mail/inbox"
          >
            <mat-icon>arrow_back</mat-icon>
            Back to Inbox
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: #f5f5f5;
    }

    .profile-card {
      max-width: 600px;
      width: 100%;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 20px;
      width: 100%;
      padding: 20px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar mat-icon {
      font-size: 60px;
      width: 60px;
      height: 60px;
      color: white;
    }

    .user-info h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .user-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    mat-card-content {
      padding: 20px;
    }

    mat-card-content h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }

    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background: #e0e0e0;
      color: #666;
    }

    .admin-badge {
      background: #ff9800;
      color: white;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-button {
      justify-content: flex-start;
      gap: 10px;
    }

    .logout-button {
      background: #f44336;
      color: white;
    }

    .logout-button:hover {
      background: #d32f2f;
    }

    .admin-section {
      margin-top: 20px;
    }

    mat-card-actions {
      padding: 16px;
      display: flex;
      justify-content: flex-start;
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isAdmin: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();

    if (!this.user) {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
