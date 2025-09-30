import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { LabelService, Label } from '../../../core/services/label.service';

@Component({
  selector: 'app-label-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatListModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="label-management-card">
      <mat-card-header>
        <mat-card-title>Label Management</mat-card-title>
        <mat-card-subtitle>Create and manage your email labels</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Create Label Form -->
        <div class="create-label-section">
          <h3>Create New Label</h3>
          <form [formGroup]="labelForm" (ngSubmit)="createLabel()" class="label-form">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Label Name</mat-label>
              <input matInput formControlName="name" placeholder="Enter label name" maxlength="100">
              <mat-error *ngIf="labelForm.get('name')?.hasError('required')">
                Label name is required
              </mat-error>
              <mat-error *ngIf="labelForm.get('name')?.hasError('maxlength')">
                Label name must be less than 100 characters
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Color</mat-label>
              <input matInput type="color" formControlName="color" class="color-input">
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="labelForm.invalid || isCreating">
                <mat-icon>add</mat-icon>
                {{ isCreating ? 'Creating...' : 'Create Label' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Labels List -->
        <div class="labels-section">
          <h3>Your Labels</h3>
          <div *ngIf="loading" class="loading">
            Loading labels...
          </div>

          <div *ngIf="!loading && labels.length === 0" class="no-labels">
            <mat-icon>label_off</mat-icon>
            <p>No labels created yet. Create your first label above!</p>
          </div>

          <mat-list *ngIf="!loading && labels.length > 0" class="labels-list">
            <mat-list-item *ngFor="let label of labels" class="label-item">
              <div class="label-content">
                <div class="label-info">
                  <div class="label-color" [style.background-color]="label.color"></div>
                  <span class="label-name">{{ label.name }}</span>
                  <mat-chip class="usage-chip" *ngIf="labelUsageCount[label.id]">
                    {{ labelUsageCount[label.id] }} emails
                  </mat-chip>
                </div>
                <div class="label-actions">
                  <button mat-icon-button (click)="editLabel(label)" matTooltip="Edit label">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteLabel(label)"
                          matTooltip="Delete label">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </mat-list-item>
          </mat-list>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Edit Label Form (shown when editing) -->
    <mat-card *ngIf="editingLabel" class="edit-label-card">
      <mat-card-header>
        <mat-card-title>Edit Label</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="editForm" (ngSubmit)="updateLabel()" class="label-form">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Label Name</mat-label>
            <input matInput formControlName="name" placeholder="Enter label name" maxlength="100">
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Color</mat-label>
            <input matInput type="color" formControlName="color" class="color-input">
          </mat-form-field>

          <div class="form-actions">
            <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
            <button mat-raised-button color="primary" type="submit"
                    [disabled]="editForm.invalid || isUpdating">
              {{ isUpdating ? 'Updating...' : 'Update Label' }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .label-management-card {
      max-width: 800px;
      margin: 20px auto;
    }

    .create-label-section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .label-form {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .form-field {
      min-width: 200px;
      flex: 1;
    }

    .color-input {
      width: 50px;
      height: 40px;
      border: none;
      cursor: pointer;
    }

    .form-actions {
      display: flex;
      gap: 8px;
    }

    .labels-section h3 {
      margin-bottom: 16px;
    }

    .loading,
    .no-labels {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .no-labels mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .labels-list {
      background: white;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .label-item {
      border-bottom: 1px solid #f5f5f5;
    }

    .label-item:last-child {
      border-bottom: none;
    }

    .label-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 8px 0;
    }

    .label-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .label-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid #ddd;
    }

    .label-name {
      font-weight: 500;
      font-size: 14px;
    }

    .usage-chip {
      font-size: 12px;
      height: 24px;
    }

    .label-actions {
      display: flex;
      gap: 4px;
    }

    .edit-label-card {
      max-width: 800px;
      margin: 20px auto;
      background: #f8f9fa;
    }

    @media (max-width: 768px) {
      .label-form {
        flex-direction: column;
        align-items: stretch;
      }

      .form-field {
        min-width: unset;
      }

      .label-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .label-actions {
        align-self: flex-end;
      }
    }
  `]
})
export class LabelManagementComponent implements OnInit {
  labels: Label[] = [];
  loading = false;
  isCreating = false;
  isUpdating = false;
  editingLabel: Label | null = null;
  labelUsageCount: { [labelId: number]: number } = {};

  labelForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    color: new FormControl('#2196f3', [Validators.required])
  });

  editForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    color: new FormControl('', [Validators.required])
  });

  constructor(
    private labelService: LabelService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadLabels();
  }

  loadLabels(): void {
    this.loading = true;
    this.labelService.getLabels().subscribe({
      next: (response) => {
        this.labels = response.labels;
        this.loadUsageCounts();
        this.loading = false;
      },
      error: (error) => {
        this.snackBar.open('Failed to load labels', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadUsageCounts(): void {
    this.labels.forEach(label => {
      this.labelService.getLabelUsageCount(label.id).subscribe({
        next: (response) => {
          this.labelUsageCount[label.id] = response.usageCount;
        },
        error: () => {
          // Silently fail for usage counts
        }
      });
    });
  }

  createLabel(): void {
    if (this.labelForm.invalid) return;

    this.isCreating = true;
    const formValue = this.labelForm.value;

    this.labelService.createLabel({
      name: formValue.name!,
      color: formValue.color!
    }).subscribe({
      next: (response) => {
        this.snackBar.open('Label created successfully', 'Close', { duration: 3000 });
        this.labelForm.reset({ color: '#2196f3' });
        this.loadLabels();
        this.isCreating = false;
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to create label';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.isCreating = false;
      }
    });
  }

  editLabel(label: Label): void {
    this.editingLabel = label;
    this.editForm.patchValue({
      name: label.name,
      color: label.color
    });
  }

  updateLabel(): void {
    if (this.editForm.invalid || !this.editingLabel) return;

    this.isUpdating = true;
    const formValue = this.editForm.value;

    this.labelService.updateLabel(this.editingLabel.id, {
      name: formValue.name!,
      color: formValue.color!
    }).subscribe({
      next: (response) => {
        this.snackBar.open('Label updated successfully', 'Close', { duration: 3000 });
        this.cancelEdit();
        this.loadLabels();
        this.isUpdating = false;
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to update label';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.isUpdating = false;
      }
    });
  }

  cancelEdit(): void {
    this.editingLabel = null;
    this.editForm.reset();
  }

  deleteLabel(label: Label): void {
    if (!confirm(`Are you sure you want to delete the label "${label.name}"? This will remove it from all emails.`)) {
      return;
    }

    this.labelService.deleteLabel(label.id).subscribe({
      next: (response) => {
        this.snackBar.open('Label deleted successfully', 'Close', { duration: 3000 });
        this.loadLabels();
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to delete label';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      }
    });
  }
}