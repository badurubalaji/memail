import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mail-list-header',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="mail-list-header">
      <h2>{{ folderName }}</h2>
      <button mat-raised-button
              color="primary"
              (click)="refresh.emit()"
              [disabled]="isLoading">
        <mat-icon>refresh</mat-icon>
        Refresh
      </button>
    </div>
  `,
  styles: [`
    .mail-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .mail-list-header h2 {
      margin: 0;
      color: #333;
    }

    @media (max-width: 768px) {
      .mail-list-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
    }
  `]
})
export class MailListHeaderComponent {
  @Input() folderName = '';
  @Input() isLoading = false;
  @Output() refresh = new EventEmitter<void>();
}