import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <div class="gmail-search-container">
      <div class="search-box" [class.focused]="isFocused" [class.has-content]="searchControl.value">
        <mat-icon class="search-icon-left">search</mat-icon>

        <input
          #searchInput
          class="search-input"
          [formControl]="searchControl"
          placeholder="Search mail"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown.enter)="onSearch()">

        <button *ngIf="searchControl.value"
                mat-icon-button
                (click)="clearSearch()"
                matTooltip="Clear search"
                class="clear-button">
          <mat-icon>close</mat-icon>
        </button>

        <button mat-icon-button
                (click)="toggleSearchOptions()"
                matTooltip="Search options"
                class="options-button">
          <mat-icon>tune</mat-icon>
        </button>
      </div>

      <div *ngIf="showSearchOptions" class="search-options" (clickOutside)="showSearchOptions = false">
        <div class="search-options-content">
          <h3>Search Options</h3>

          <mat-form-field appearance="outline" class="option-field">
            <mat-label>From</mat-label>
            <input matInput [(ngModel)]="searchOptions.from" placeholder="Sender email">
          </mat-form-field>

          <mat-form-field appearance="outline" class="option-field">
            <mat-label>To</mat-label>
            <input matInput [(ngModel)]="searchOptions.to" placeholder="Recipient email">
          </mat-form-field>

          <mat-form-field appearance="outline" class="option-field">
            <mat-label>Subject</mat-label>
            <input matInput [(ngModel)]="searchOptions.subject" placeholder="Subject keywords">
          </mat-form-field>

          <mat-form-field appearance="outline" class="option-field">
            <mat-label>Has the words</mat-label>
            <input matInput [(ngModel)]="searchOptions.body" placeholder="Message content">
          </mat-form-field>

          <div class="search-actions">
            <button mat-button (click)="clearSearchOptions()" color="primary">
              Clear
            </button>
            <button mat-raised-button (click)="applySearchOptions()" color="primary">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 500px;
      width: 100%;
    }

    .search-field {
      flex: 1;
      font-size: 14px;
    }

    .search-field ::ng-deep .mat-mdc-form-field-infix {
      min-height: 40px;
    }

    .search-field ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .search-icon {
      cursor: pointer;
      color: #666;
      transition: color 0.2s ease;
    }

    .search-icon:hover,
    .search-icon.active {
      color: #1976d2;
    }

    .clear-button {
      color: #666;
    }

    .search-help {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      margin-top: 4px;
    }

    .help-content {
      padding: 16px;
    }

    .help-content h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 14px;
    }

    .help-content ul {
      margin: 0;
      padding-left: 16px;
      font-size: 13px;
      color: #666;
    }

    .help-content li {
      margin-bottom: 4px;
    }

    .help-content code {
      background: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
      color: #d63384;
    }

    @media (max-width: 768px) {
      .search-container {
        max-width: 100%;
      }

      .search-field {
        font-size: 16px; /* Prevent zoom on iOS */
      }
    }
  `]
})
export class SearchBarComponent implements OnInit {
  @Input() placeholder = 'Search emails...';
  @Input() showHelp = false;
  @Output() search = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  searchControl = new FormControl('');
  showSearchOptions = false;
  isFocused = false;

  searchOptions = {
    from: '',
    to: '',
    subject: '',
    body: ''
  };

  ngOnInit() {
    // Auto-search as user types (with debounce)
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value && value.trim()) {
        this.search.emit(value.trim());
      } else if (!value) {
        this.clear.emit();
      }
    });
  }

  onSearch() {
    const query = this.searchControl.value;
    if (query && query.trim()) {
      this.search.emit(query.trim());
    }
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.clear.emit();
  }

  setQuery(query: string) {
    this.searchControl.setValue(query);
  }

  getQuery(): string {
    return this.searchControl.value || '';
  }

  onFocus() {
    this.isFocused = true;
  }

  onBlur() {
    this.isFocused = false;
  }

  toggleSearchOptions() {
    this.showSearchOptions = !this.showSearchOptions;
  }

  clearSearchOptions() {
    this.searchOptions = {
      from: '',
      to: '',
      subject: '',
      body: ''
    };
  }

  applySearchOptions() {
    // Build search query string from options
    const queryParts: string[] = [];

    if (this.searchOptions.from) {
      queryParts.push(`from:${this.searchOptions.from}`);
    }
    if (this.searchOptions.to) {
      queryParts.push(`to:${this.searchOptions.to}`);
    }
    if (this.searchOptions.subject) {
      queryParts.push(`subject:${this.searchOptions.subject}`);
    }
    if (this.searchOptions.body) {
      queryParts.push(`body:${this.searchOptions.body}`);
    }

    const query = queryParts.join(' ');
    this.searchControl.setValue(query);
    this.showSearchOptions = false;

    if (query) {
      this.search.emit(query);
    }
  }
}