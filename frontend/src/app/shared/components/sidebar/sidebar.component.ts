import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LabelService, Label } from '../../../core/services/label.service';
import { SearchService } from '../../../core/services/search.service';
import { LabelManagementComponent } from '../label-management/label-management.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  template: `
    <div class="sidebar">
      <mat-toolbar class="sidebar-header">
        <mat-icon class="logo-icon">email</mat-icon>
        <span>Memail</span>
      </mat-toolbar>

      <div class="compose-section">
        <button mat-fab color="primary" routerLink="/compose" class="compose-fab" extended>
          <mat-icon>edit</mat-icon>
          Compose
        </button>
      </div>

      <mat-nav-list class="sidebar-nav">
        <a mat-list-item routerLink="/inbox" routerLinkActive="active">
          <mat-icon matListItemIcon>inbox</mat-icon>
          <span matListItemTitle>Inbox</span>
        </a>

        <a mat-list-item routerLink="/starred" routerLinkActive="active">
          <mat-icon matListItemIcon>star</mat-icon>
          <span matListItemTitle>Starred</span>
        </a>

        <a mat-list-item routerLink="/important" routerLinkActive="active">
          <mat-icon matListItemIcon>label_important</mat-icon>
          <span matListItemTitle>Important</span>
        </a>

        <a mat-list-item routerLink="/sent" routerLinkActive="active">
          <mat-icon matListItemIcon>send</mat-icon>
          <span matListItemTitle>Sent</span>
        </a>

        <a mat-list-item routerLink="/drafts" routerLinkActive="active">
          <mat-icon matListItemIcon>drafts</mat-icon>
          <span matListItemTitle>Drafts</span>
        </a>

        <a mat-list-item routerLink="/spam" routerLinkActive="active">
          <mat-icon matListItemIcon>report</mat-icon>
          <span matListItemTitle>Spam</span>
        </a>

        <a mat-list-item routerLink="/trash" routerLinkActive="active">
          <mat-icon matListItemIcon>delete</mat-icon>
          <span matListItemTitle>Trash</span>
        </a>

        <mat-divider></mat-divider>

        <div class="labels-header">
          <h3 matSubheader>Labels</h3>
          <button mat-icon-button (click)="openLabelManagement()" class="add-label-btn" matTooltip="Create label">
            <mat-icon>add</mat-icon>
          </button>
        </div>
        <div *ngIf="loading" class="labels-loading">
          <p>Loading labels...</p>
        </div>

        <div *ngIf="!loading && labels.length === 0" class="no-labels">
          <p>No labels created yet</p>
          <button mat-button (click)="openLabelManagement()" class="create-labels-btn">
            <mat-icon>add</mat-icon>
            Create your first label
          </button>
        </div>

        <div *ngFor="let label of labels" class="label-item">
          <a mat-list-item (click)="filterByLabel(label)" [class.active]="selectedLabelId === label.id">
            <div class="label-content">
              <div class="label-color" [style.background-color]="label.color"></div>
              <span class="label-name">{{ label.name }}</span>
            </div>
          </a>
        </div>
      </mat-nav-list>
    </div>
  `,
  styles: [`
    .sidebar {
      background: #fafafa;
      border-right: 1px solid #e0e0e0;
      height: 100%;
    }

    .sidebar-header {
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      min-height: 64px;
    }

    .logo-icon {
      margin-right: 8px;
      color: #1976d2;
    }

    .sidebar-nav {
      padding-top: 16px;
    }

    .sidebar-nav a {
      border-radius: 0 25px 25px 0;
      margin-right: 12px;
      margin-bottom: 4px;
    }

    .sidebar-nav a.active {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .labels-loading,
    .no-labels {
      padding: 16px;
      text-align: center;
    }

    .labels-loading p,
    .no-labels p {
      color: #666;
      font-style: italic;
      margin: 0 0 8px 0;
      font-size: 13px;
    }

    .create-labels-btn {
      font-size: 12px;
      padding: 4px 8px;
      min-height: 28px;
    }

    .label-item {
      margin-right: 12px;
      margin-bottom: 2px;
    }

    .label-item a {
      border-radius: 0 25px 25px 0;
      padding: 8px 16px;
      cursor: pointer;
    }

    .label-item a:hover {
      background-color: #f5f5f5;
    }

    .label-item a.active {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .label-content {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .label-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1px solid rgba(0, 0, 0, 0.12);
      flex-shrink: 0;
    }

    .label-name {
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }

    .compose-section {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-start;
    }

    .compose-fab {
      background: #1a73e8;
      color: white;
      box-shadow: 0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15);
      padding: 0 24px;
      height: 56px;
      border-radius: 28px;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.25px;
      text-transform: none;
    }

    .compose-fab:hover {
      background: #1557b0;
      box-shadow: 0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15), 0 8px 16px 6px rgba(60,64,67,.1);
    }

    .compose-fab .mat-icon {
      margin-right: 12px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .labels-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-right: 12px;
      margin-bottom: 4px;
    }

    .labels-header h3 {
      margin: 0;
      flex: 1;
    }

    .add-label-btn {
      width: 32px;
      height: 32px;
      color: #5f6368;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .add-label-btn:hover {
      background: rgba(95, 99, 104, 0.1);
      box-shadow: 0 1px 3px rgba(60,64,67,.12), 0 1px 2px rgba(60,64,67,.24);
    }

    .add-label-btn .mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .labels-header-minimal {
      display: flex;
      justify-content: center;
      padding: 8px;
      margin-bottom: 8px;
    }

    .label-content.minimized {
      justify-content: center;
    }

    .sidebar.minimized .sidebar-nav a {
      justify-content: center;
    }

    .sidebar.minimized .compose-section {
      display: flex;
      justify-content: center;
    }
  `]
})
export class SidebarComponent implements OnInit {
  labels: Label[] = [];
  loading = false;
  selectedLabelId: number | null = null;

  constructor(
    private labelService: LabelService,
    private searchService: SearchService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadLabels();
  }

  loadLabels(): void {
    this.loading = true;
    this.labelService.getLabels().subscribe({
      next: (response) => {
        this.labels = response.labels;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }

  filterByLabel(label: Label): void {
    this.selectedLabelId = label.id;
    // Use search functionality to filter by label
    // This creates a query that searches for messages with this label
    const query = `label:"${label.name}"`;
    this.searchService.setSearchQuery(query);
    this.router.navigate(['/inbox']);
  }

  openLabelManagement(): void {
    const dialogRef = this.dialog.open(LabelManagementComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadLabels(); // Refresh labels if any changes were made
      }
    });
  }
}