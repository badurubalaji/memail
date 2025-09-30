import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { User } from '../../models/auth.models';
import { SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'app-top-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="memail-toolbar">
      <!-- Left section -->
      <div class="toolbar-left">
        <button mat-icon-button (click)="toggleSidebar.emit()" class="menu-button">
          <mat-icon>menu</mat-icon>
        </button>

        <div class="logo-section">
          <span class="memail-text">Memail</span>
        </div>
      </div>

      <!-- Center section - Search -->
      <div class="search-section">
        <div class="search-container" [class.focused]="searchFocused">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            type="text"
            class="search-input"
            placeholder="Search mail"
            [formControl]="searchControl"
            (focus)="searchFocused = true"
            (blur)="searchFocused = false">

          <button mat-icon-button
                  class="search-options-button"
                  matTooltip="Show search options"
                  (click)="toggleSearchOptions()">
            <mat-icon>tune</mat-icon>
          </button>
        </div>
      </div>

      <!-- Right section - Icons -->
      <div class="toolbar-right">
        <button mat-icon-button matTooltip="Help">
          <mat-icon>help_outline</mat-icon>
        </button>

        <button mat-icon-button matTooltip="Settings">
          <mat-icon>settings</mat-icon>
        </button>


        <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-avatar">
          <mat-icon>account_circle</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu">
          <div class="user-info">
            <div class="user-email">{{ currentUser?.email }}</div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout.emit()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </div>
    </div>
  `,
  styles: [`
    .memail-toolbar {
      display: flex;
      align-items: center;
      height: 64px;
      padding: 0 24px;
      background: #fff;
      border-bottom: 1px solid #dadce0;
      position: sticky;
      top: 0;
      z-index: 1000;
      gap: 16px;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 24px;
      min-width: 200px;
    }

    .menu-button {
      color: #5f6368;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }


    .memail-text {
      font-size: 22px;
      color: #5f6368;
      font-weight: 400;
      letter-spacing: -0.25px;
    }

    .search-section {
      flex: 1;
      max-width: 720px;
      display: flex;
      justify-content: center;
    }

    .search-container {
      display: flex;
      align-items: center;
      background: #f1f3f4;
      border-radius: 8px;
      padding: 0 16px;
      height: 48px;
      width: 100%;
      max-width: 685px;
      transition: all 0.2s ease;
      position: relative;
    }

    .search-container.focused {
      background: #fff;
      box-shadow: 0 2px 8px rgba(32,33,36,.28);
    }

    .search-icon {
      color: #5f6368;
      margin-right: 12px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .search-input {
      border: none;
      outline: none;
      background: transparent;
      flex: 1;
      font-size: 16px;
      color: #202124;
      font-family: 'Google Sans', Roboto, Arial, sans-serif;
    }

    .search-input::placeholder {
      color: #5f6368;
    }

    .search-options-button {
      color: #5f6368;
      width: 32px;
      height: 32px;
      margin-left: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      position: relative;
    }

    .search-options-button:hover {
      background: rgba(60,64,67,.08);
    }

    .search-options-button .mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 200px;
      justify-content: flex-end;
    }

    .toolbar-right button {
      color: #5f6368;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .toolbar-right button:hover {
      background: rgba(60,64,67,.08);
    }

    .toolbar-right button .mat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      width: 24px;
      height: 24px;
      line-height: 24px;
    }

    .user-avatar {
      color: #1a73e8 !important;
    }

    .user-info {
      padding: 12px 16px;
    }

    .user-email {
      font-weight: 500;
      color: #333;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .memail-toolbar {
        padding: 0 16px;
        gap: 12px;
      }

      .toolbar-left {
        min-width: auto;
        gap: 16px;
      }

      .memail-text {
        display: none;
      }

      .search-container {
        max-width: none;
      }

      .toolbar-right {
        min-width: auto;
        gap: 4px;
      }

      .toolbar-right button:not(.user-avatar) {
        display: none;
      }

      .toolbar-right button:nth-last-child(2) {
        display: flex; /* Show settings button */
      }
    }

    @media (max-width: 480px) {
      .search-container {
        padding: 0 12px;
        height: 40px;
      }

      .search-input {
        font-size: 14px;
      }
    }
  `]
})
export class TopToolbarComponent implements OnInit {
  @Input() currentUser: User | null = null;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<void>();
  @Output() searchOptionsToggle = new EventEmitter<void>();

  searchControl = new FormControl('');
  searchFocused = false;
  showSearchOptions = false;

  constructor(private searchService: SearchService) {}

  ngOnInit() {
    // Set up search with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value && value.trim()) {
        this.searchService.setSearchQuery(value.trim());
        this.search.emit(value.trim());
      } else if (!value) {
        this.searchService.clearSearch();
        this.clearSearch.emit();
      }
    });

    // Listen to search service for external search queries (e.g., from sidebar labels)
    this.searchService.searchQuery$.subscribe(query => {
      if (query && query !== this.searchControl.value) {
        this.searchControl.setValue(query, { emitEvent: false });
      } else if (!query) {
        this.searchControl.setValue('', { emitEvent: false });
      }
    });
  }

  onSearch(query: string) {
    this.searchService.setSearchQuery(query);
    this.search.emit(query);
  }

  onClearSearch() {
    this.searchControl.setValue('');
    this.searchService.clearSearch();
    this.clearSearch.emit();
  }

  toggleSearchOptions() {
    this.showSearchOptions = !this.showSearchOptions;
    this.searchOptionsToggle.emit();
  }
}