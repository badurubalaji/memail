import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserManagementService, User, CreateUserRequest, UpdateUserRequest } from '../services/user-management.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-management-container">
      <!-- Error Message -->
      <div *ngIf="error" class="error-message">
        <strong>Error:</strong> {{ error }}
      </div>

      <!-- Only show content if user is admin -->
      <ng-container *ngIf="isUserAdmin">
        <div class="header">
          <h2>User Management</h2>
          <button class="btn-primary" (click)="showCreateDialog()" [disabled]="loading">
            <span>➕</span> Add User
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <p>Loading users...</p>
        </div>

        <!-- Users Table -->
        <div class="users-table" *ngIf="!loading">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users" [class.disabled]="!user.enabled">
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge" [class.admin]="user.role === 'ADMIN'">
                    {{ user.role }}
                  </span>
                </td>
                <td>
                  <span class="status" [class.active]="user.enabled" [class.inactive]="!user.enabled">
                    {{ user.enabled ? 'Active' : 'Disabled' }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>{{ user.lastConnectionAt ? formatDate(user.lastConnectionAt) : 'Never' }}</td>
                <td class="actions">
                  <button class="btn-small" (click)="showEditDialog(user)" title="Edit">
                    ✏️
                  </button>
                  <button
                    class="btn-small"
                    [class.btn-success]="!user.enabled"
                    [class.btn-warning]="user.enabled"
                    (click)="toggleUserStatus(user)"
                    [title]="user.enabled ? 'Disable' : 'Enable'">
                    {{ user.enabled ? '🚫' : '✅' }}
                  </button>
                  <button class="btn-small btn-danger" (click)="confirmDelete(user)" title="Delete">
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="users.length === 0 && !loading" class="empty-state">
            <p>No users found</p>
          </div>
        </div>
      </ng-container>

      <!-- Create/Edit User Dialog -->
      <div class="modal" *ngIf="showDialog" (click)="closeDialog()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditMode ? 'Edit User' : 'Create User' }}</h3>
            <button class="close-btn" (click)="closeDialog()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Email</label>
              <input
                type="email"
                [(ngModel)]="dialogUser.email"
                [disabled]="isEditMode"
                placeholder="user@ashulabs.com">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input
                type="password"
                [(ngModel)]="dialogUser.password"
                [placeholder]="isEditMode ? 'Leave blank to keep current' : 'Enter password'">
            </div>
            <div class="form-group">
              <label>Role</label>
              <select [(ngModel)]="dialogUser.role">
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div class="form-group checkbox">
              <label>
                <input type="checkbox" [(ngModel)]="dialogUser.enabled">
                Enabled
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeDialog()">Cancel</button>
            <button class="btn-primary" (click)="saveUser()">
              {{ isEditMode ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .users-table {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #f5f5f5;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    tbody tr:hover {
      background: #f9f9f9;
    }

    tbody tr.disabled {
      opacity: 0.6;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      background: #e0e0e0;
      font-size: 0.85em;
    }

    .badge.admin {
      background: #4CAF50;
      color: white;
    }

    .status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
    }

    .status.active {
      background: #4CAF50;
      color: white;
    }

    .status.inactive {
      background: #f44336;
      color: white;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn-small {
      padding: 6px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: #2196F3;
      color: white;
    }

    .btn-small:hover {
      opacity: 0.9;
    }

    .btn-success {
      background: #4CAF50;
    }

    .btn-warning {
      background: #FF9800;
    }

    .btn-danger {
      background: #f44336;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary {
      background: #2196F3;
      color: white;
    }

    .btn-secondary {
      background: #9E9E9E;
      color: white;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    .error-message {
      background: #fee;
      color: #c33;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 20px;
      border: 1px solid #fcc;
    }

    .loading-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
    }

    .form-group input[type="email"],
    .form-group input[type="password"],
    .form-group select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .form-group.checkbox {
      display: flex;
      align-items: center;
    }

    .form-group.checkbox label {
      display: flex;
      align-items: center;
      margin-bottom: 0;
    }

    .form-group.checkbox input {
      margin-right: 8px;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  showDialog = false;
  isEditMode = false;
  dialogUser: any = {};
  loading = false;
  error: string | null = null;
  isUserAdmin = false;

  constructor(
    private userManagementService: UserManagementService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user is admin
    this.isUserAdmin = this.authService.isAdmin();
    if (!this.isUserAdmin) {
      this.error = 'Access denied. Admin privileges required.';
      return;
    }
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;
    this.userManagementService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.error = error.error?.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  showCreateDialog() {
    this.isEditMode = false;
    this.dialogUser = {
      email: '',
      password: '',
      role: 'USER',
      enabled: true
    };
    this.showDialog = true;
  }

  showEditDialog(user: User) {
    this.isEditMode = true;
    this.dialogUser = {
      id: user.id,
      email: user.email,
      password: '',
      role: user.role,
      enabled: user.enabled
    };
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.dialogUser = {};
  }

  saveUser() {
    if (this.isEditMode) {
      const updateRequest: UpdateUserRequest = {
        role: this.dialogUser.role,
        enabled: this.dialogUser.enabled
      };
      if (this.dialogUser.password) {
        updateRequest.password = this.dialogUser.password;
      }

      this.userManagementService.updateUser(this.dialogUser.id, updateRequest).subscribe({
        next: () => {
          this.loadUsers();
          this.closeDialog();
        },
        error: (error) => {
          console.error('Failed to update user:', error);
          alert(error.error?.message || 'Failed to update user');
        }
      });
    } else {
      const createRequest: CreateUserRequest = {
        email: this.dialogUser.email,
        password: this.dialogUser.password,
        role: this.dialogUser.role,
        enabled: this.dialogUser.enabled
      };

      this.userManagementService.createUser(createRequest).subscribe({
        next: () => {
          this.loadUsers();
          this.closeDialog();
        },
        error: (error) => {
          console.error('Failed to create user:', error);
          alert(error.error?.message || 'Failed to create user');
        }
      });
    }
  }

  toggleUserStatus(user: User) {
    if (user.enabled) {
      this.userManagementService.disableUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Failed to disable user:', error);
          alert('Failed to disable user');
        }
      });
    } else {
      this.userManagementService.enableUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Failed to enable user:', error);
          alert('Failed to enable user');
        }
      });
    }
  }

  confirmDelete(user: User) {
    if (confirm(`Are you sure you want to delete user ${user.email}?\n\nThis will remove the user from both the application and the mail server.`)) {
      this.deleteUser(user);
    }
  }

  deleteUser(user: User) {
    this.userManagementService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Failed to delete user:', error);
        alert(error.error?.message || 'Failed to delete user');
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}
