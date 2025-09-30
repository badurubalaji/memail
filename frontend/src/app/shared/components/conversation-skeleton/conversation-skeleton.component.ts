import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-conversation-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="conversation-skeleton" *ngFor="let item of skeletonArray">
      <div class="skeleton-row">
        <!-- Checkbox placeholder -->
        <div class="checkbox-skeleton">
          <app-skeleton-loader variant="avatar" width="20px" height="20px"></app-skeleton-loader>
        </div>

        <!-- Star placeholder -->
        <div class="star-skeleton">
          <app-skeleton-loader variant="avatar" width="24px" height="24px"></app-skeleton-loader>
        </div>

        <!-- Sender placeholder -->
        <div class="sender-skeleton">
          <app-skeleton-loader variant="text" [width]="getDeterministicWidth(['120px', '150px', '100px'], item)"></app-skeleton-loader>
        </div>

        <!-- Subject and content placeholder -->
        <div class="content-skeleton">
          <app-skeleton-loader variant="text" [width]="getDeterministicWidth(['60%', '75%', '85%'], item)"></app-skeleton-loader>
        </div>

        <!-- Date placeholder -->
        <div class="date-skeleton">
          <app-skeleton-loader variant="text" width="80px"></app-skeleton-loader>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .conversation-skeleton {
      padding: 0 12px;
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      gap: 12px;
    }

    .checkbox-skeleton {
      width: 40px;
      display: flex;
      justify-content: center;
      flex-shrink: 0;
    }

    .star-skeleton {
      width: 40px;
      display: flex;
      justify-content: center;
      flex-shrink: 0;
    }

    .sender-skeleton {
      width: 200px;
      flex-shrink: 0;
    }

    .content-skeleton {
      flex: 1;
      min-width: 0;
    }

    .date-skeleton {
      width: 100px;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .sender-skeleton {
        width: 120px;
      }

      .date-skeleton {
        width: 80px;
      }
    }

    @media (max-width: 480px) {
      .sender-skeleton {
        width: 80px;
      }

      .star-skeleton {
        display: none;
      }
    }
  `]
})
export class ConversationSkeletonComponent {
  @Input() count: number = 5;

  get skeletonArray(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }

  getDeterministicWidth(options: string[], index: number): string {
    return options[index % options.length];
  }
}