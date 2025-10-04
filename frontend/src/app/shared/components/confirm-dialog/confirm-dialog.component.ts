import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  options?: Array<{ value: string; label: string }>;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="dialog-icon">{{ data.confirmColor === 'warn' ? 'warning' : 'help_outline' }}</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <div *ngIf="data.options && data.options.length > 0" class="options-container">
        <div *ngFor="let option of data.options"
             class="option-item"
             [class.selected]="selectedOption === option.value"
             (click)="selectOption(option.value)">
          <mat-icon class="option-icon">{{ selectedOption === option.value ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
          <span>{{ option.label }}</span>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button mat-raised-button
              [color]="data.confirmColor || 'primary'"
              [disabled]="data.options && data.options.length > 0 && !selectedOption"
              (click)="onConfirm()">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 16px 24px;
    }

    .dialog-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    mat-dialog-content {
      padding: 0 24px 24px 24px;
      min-width: 300px;
    }

    mat-dialog-content p {
      margin: 0;
      color: #5f6368;
      line-height: 1.5;
    }

    .options-container {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #dadce0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .option-item:hover {
      background-color: #f8f9fa;
      border-color: #1a73e8;
    }

    .option-item.selected {
      background-color: #e8f0fe;
      border-color: #1a73e8;
    }

    .option-icon {
      color: #5f6368;
    }

    .option-item.selected .option-icon {
      color: #1a73e8;
    }

    mat-dialog-actions {
      padding: 8px 16px 16px 16px;
      gap: 8px;
    }
  `]
})
export class ConfirmDialogComponent {
  selectedOption: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Set default selection to first option if options exist
    if (this.data.options && this.data.options.length > 0) {
      this.selectedOption = this.data.options[0].value;
    }
  }

  selectOption(value: string): void {
    this.selectedOption = value;
  }

  onConfirm(): void {
    if (this.data.options && this.data.options.length > 0) {
      this.dialogRef.close(this.selectedOption);
    } else {
      this.dialogRef.close(true);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
