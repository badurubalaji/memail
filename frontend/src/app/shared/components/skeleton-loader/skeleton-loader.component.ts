import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" [ngClass]="variant">
      <div class="skeleton"
           [style.height]="height"
           [style.width]="width"
           [style.border-radius]="borderRadius">
      </div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      padding: 4px 0;
    }

    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-container.text .skeleton {
      height: 16px;
      border-radius: 8px;
    }

    .skeleton-container.avatar .skeleton {
      border-radius: 50%;
    }

    .skeleton-container.button .skeleton {
      height: 36px;
      border-radius: 18px;
    }

    .skeleton-container.card .skeleton {
      border-radius: 8px;
    }

    @keyframes skeleton-loading {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .skeleton {
        background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
        background-size: 200% 100%;
      }
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() variant: 'text' | 'avatar' | 'button' | 'card' = 'text';
  @Input() height: string = '16px';
  @Input() width: string = '100%';
  @Input() borderRadius: string = '4px';
}