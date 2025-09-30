import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserPreferencesService } from './user-preferences.service';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentThemeSubject = new BehaviorSubject<Theme>('light');
  private systemThemeSubject = new BehaviorSubject<'light' | 'dark'>('light');

  public currentTheme$ = this.currentThemeSubject.asObservable();
  public systemTheme$ = this.systemThemeSubject.asObservable();

  constructor(
    private rendererFactory: RendererFactory2,
    private userPreferencesService: UserPreferencesService
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeTheme();
    this.watchSystemTheme();
  }

  private initializeTheme(): void {
    // Get theme from user preferences or localStorage
    const savedTheme = this.getSavedTheme();
    this.setTheme(savedTheme);
  }

  private getSavedTheme(): Theme {
    // First try to get from user preferences service
    const currentPrefs = this.userPreferencesService.getCurrentPreferences();
    if (currentPrefs.theme) {
      return currentPrefs.theme;
    }

    // Fallback to localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  }

  private watchSystemTheme(): void {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Initial check
      this.systemThemeSubject.next(mediaQuery.matches ? 'dark' : 'light');

      // Listen for changes
      mediaQuery.addListener((e) => {
        this.systemThemeSubject.next(e.matches ? 'dark' : 'light');

        // If current theme is auto, update the applied theme
        if (this.currentThemeSubject.value === 'auto') {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'auto') {
      // Use system preference
      const systemTheme = this.systemThemeSubject.value;
      this.applyTheme(systemTheme);
    } else {
      this.applyTheme(theme);
    }

    // Update user preferences if available
    const currentPrefs = this.userPreferencesService.getCurrentPreferences();
    if (currentPrefs.userEmail) {
      this.userPreferencesService.setTheme(theme).subscribe({
        error: (error) => console.error('Failed to save theme preference:', error)
      });
    }
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const body = document.body;

    // Remove existing theme classes
    this.renderer.removeClass(body, 'light-theme');
    this.renderer.removeClass(body, 'dark-theme');

    // Add new theme class
    this.renderer.addClass(body, `${theme}-theme`);

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);
  }

  private updateMetaThemeColor(theme: 'light' | 'dark'): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const color = theme === 'dark' ? '#121212' : '#ffffff';

    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    } else {
      const meta = this.renderer.createElement('meta');
      this.renderer.setAttribute(meta, 'name', 'theme-color');
      this.renderer.setAttribute(meta, 'content', color);
      this.renderer.appendChild(document.head, meta);
    }
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  getEffectiveTheme(): 'light' | 'dark' {
    const currentTheme = this.currentThemeSubject.value;
    if (currentTheme === 'auto') {
      return this.systemThemeSubject.value;
    }
    return currentTheme;
  }

  toggleTheme(): void {
    const currentTheme = this.currentThemeSubject.value;
    const effectiveTheme = this.getEffectiveTheme();

    if (currentTheme === 'auto') {
      // Switch to opposite of current effective theme
      this.setTheme(effectiveTheme === 'light' ? 'dark' : 'light');
    } else {
      // Cycle through: light -> dark -> auto -> light
      const themeOrder: Theme[] = ['light', 'dark', 'auto'];
      const currentIndex = themeOrder.indexOf(currentTheme);
      const nextIndex = (currentIndex + 1) % themeOrder.length;
      this.setTheme(themeOrder[nextIndex]);
    }
  }

  isDarkMode(): boolean {
    return this.getEffectiveTheme() === 'dark';
  }
}