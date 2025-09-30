import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { LabelService, Label, MessageLabel } from '../../../core/services/label.service';

@Component({
  selector: 'app-label-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="labelMenu" matTooltip="Manage labels">
      <mat-icon>label</mat-icon>
    </button>

    <mat-menu #labelMenu="matMenu" class="label-menu">
      <div class="menu-header" mat-menu-item disabled>
        <mat-icon>label</mat-icon>
        <span>Labels</span>
      </div>
      <mat-divider></mat-divider>

      <div *ngIf="loading" class="loading-container" mat-menu-item disabled>
        <mat-spinner diameter="20"></mat-spinner>
        <span>Loading labels...</span>
      </div>

      <div *ngIf="!loading && labels.length === 0" class="no-labels" mat-menu-item disabled>
        <mat-icon>label_off</mat-icon>
        <span>No labels available</span>
      </div>

      <div *ngFor="let label of labels" class="label-item">
        <button mat-menu-item (click)="toggleLabel(label)" [disabled]="isProcessing" class="label-menu-item">
          <div class="checkbox-container">
            <mat-checkbox
              [checked]="isLabelApplied(label)"
              [disabled]="isProcessing"
              (click)="$event.stopPropagation()">
            </mat-checkbox>
          </div>
          <div class="label-info">
            <div class="label-color" [style.background-color]="label.color"></div>
            <span class="label-name">{{ label.name }}</span>
          </div>
        </button>
      </div>

      <mat-divider *ngIf="labels.length > 0"></mat-divider>
      <button mat-menu-item (click)="openLabelManagement()" [disabled]="isProcessing">
        <mat-icon>settings</mat-icon>
        <span>Manage Labels</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .label-menu {
      max-width: 280px;
    }

    .menu-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      opacity: 0.7;
    }

    .loading-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .no-labels {
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.6;
    }

    .label-item button {
      width: 100%;
    }

    .label-menu-item {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      padding: 8px 16px !important;
      min-height: 48px !important;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .label-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .label-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1px solid rgba(0, 0, 0, 0.12);
    }

    .label-name {
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }

    ::ng-deep .mat-mdc-menu-item.mat-mdc-menu-item-highlighted {
      background: rgba(0, 0, 0, 0.04);
    }

    ::ng-deep .mat-mdc-menu-item[disabled] {
      opacity: 0.6;
    }
  `]
})
export class LabelDropdownComponent implements OnInit {
  @Input() messageUids: string[] = [];
  @Input() folder: string = 'INBOX';
  @Input() single: boolean = false; // For single message vs batch mode
  @Output() labelsChanged = new EventEmitter<void>();
  @Output() labelApplied = new EventEmitter<{ label: Label, messageUids: string[] }>();
  @Output() labelRemoved = new EventEmitter<{ label: Label, messageUids: string[] }>();

  labels: Label[] = [];
  appliedLabels: Set<number> = new Set();
  loading = false;
  isProcessing = false;

  constructor(
    private labelService: LabelService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadLabels();
    if (this.single && this.messageUids.length === 1) {
      this.loadMessageLabels();
    }
  }

  loadLabels(): void {
    this.loading = true;
    this.labelService.getLabels().subscribe({
      next: (response) => {
        this.labels = response.labels;
        this.loading = false;
      },
      error: (error) => {
        this.snackBar.open('Failed to load labels', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadMessageLabels(): void {
    if (this.messageUids.length === 0) return;

    const messageUid = this.messageUids[0];
    this.labelService.getMessageLabels(messageUid, this.folder).subscribe({
      next: (response) => {
        this.appliedLabels = new Set(response.messageLabels.map(ml => ml.label.id));
      },
      error: (error) => {
        // Silently fail for message labels
      }
    });
  }

  isLabelApplied(label: Label): boolean {
    return this.appliedLabels.has(label.id);
  }

  toggleLabel(label: Label): void {
    if (this.isProcessing || this.messageUids.length === 0) return;

    this.isProcessing = true;
    const isApplied = this.isLabelApplied(label);

    if (isApplied) {
      this.removeLabel(label);
    } else {
      this.applyLabel(label);
    }
  }

  private applyLabel(label: Label): void {
    if (this.single && this.messageUids.length === 1) {
      // Single message
      const messageUid = this.messageUids[0];
      this.labelService.applyLabelToMessage(label.id, messageUid, this.folder).subscribe({
        next: (response) => {
          this.appliedLabels.add(label.id);
          this.snackBar.open(`Label "${label.name}" applied`, 'Close', { duration: 2000 });
          this.labelsChanged.emit();
          this.labelApplied.emit({ label, messageUids: this.messageUids });
          this.isProcessing = false;
        },
        error: (error) => {
          const message = error.error?.message || `Failed to apply label "${label.name}"`;
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.isProcessing = false;
        }
      });
    } else {
      // Batch mode
      this.labelService.applyLabelsToMessages({
        messageUids: this.messageUids,
        folder: this.folder,
        labelIds: [label.id]
      }).subscribe({
        next: (response) => {
          this.appliedLabels.add(label.id);
          this.snackBar.open(
            `Label "${label.name}" applied to ${response.processedMessages} messages`,
            'Close',
            { duration: 2000 }
          );
          this.labelsChanged.emit();
          this.labelApplied.emit({ label, messageUids: this.messageUids });
          this.isProcessing = false;
        },
        error: (error) => {
          const message = error.error?.message || `Failed to apply label "${label.name}"`;
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.isProcessing = false;
        }
      });
    }
  }

  private removeLabel(label: Label): void {
    if (this.single && this.messageUids.length === 1) {
      // Single message
      const messageUid = this.messageUids[0];
      this.labelService.removeLabelFromMessage(label.id, messageUid, this.folder).subscribe({
        next: (response) => {
          this.appliedLabels.delete(label.id);
          this.snackBar.open(`Label "${label.name}" removed`, 'Close', { duration: 2000 });
          this.labelsChanged.emit();
          this.labelRemoved.emit({ label, messageUids: this.messageUids });
          this.isProcessing = false;
        },
        error: (error) => {
          const message = error.error?.message || `Failed to remove label "${label.name}"`;
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.isProcessing = false;
        }
      });
    } else {
      // Batch mode
      this.labelService.removeLabelsFromMessages({
        messageUids: this.messageUids,
        folder: this.folder,
        labelIds: [label.id]
      }).subscribe({
        next: (response) => {
          this.appliedLabels.delete(label.id);
          this.snackBar.open(
            `Label "${label.name}" removed from ${response.processedMessages} messages`,
            'Close',
            { duration: 2000 }
          );
          this.labelsChanged.emit();
          this.labelRemoved.emit({ label, messageUids: this.messageUids });
          this.isProcessing = false;
        },
        error: (error) => {
          const message = error.error?.message || `Failed to remove label "${label.name}"`;
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.isProcessing = false;
        }
      });
    }
  }

  openLabelManagement(): void {
    // This could open a dialog or navigate to label management
    // For now, we'll just emit an event
    this.snackBar.open('Navigate to Settings > Labels to manage labels', 'Close', { duration: 3000 });
  }
}