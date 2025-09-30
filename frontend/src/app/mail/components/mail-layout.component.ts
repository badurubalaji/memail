import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { filter } from 'rxjs/operators';
import { slideInOut } from '../../shared/animations/route-animations';

import { AuthService } from '../../core/services/auth.service';
import { SearchService } from '../../core/services/search.service';
import { User } from '../../shared/models/auth.models';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopToolbarComponent } from '../../shared/components/top-toolbar/top-toolbar.component';
import { NotificationComponent } from '../../shared/components/notification/notification.component';

@Component({
  selector: 'app-mail-layout',
  standalone: true,
  animations: [slideInOut],
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    SidebarComponent,
    TopToolbarComponent,
    NotificationComponent
  ],
  template: `
    <div class="mail-layout">
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #drawer
                     class="sidenav"
                     fixedInViewport
                     [attr.role]="'navigation'"
                     [mode]="isMobile ? 'over' : 'side'"
                     [opened]="!isMobile">
          <app-sidebar></app-sidebar>
        </mat-sidenav>

        <mat-sidenav-content>
          <app-top-toolbar
            [currentUser]="currentUser"
            (toggleSidebar)="drawer.toggle()"
            (search)="onSearch($event)"
            (clearSearch)="onClearSearch()"
            (logout)="logout()">
          </app-top-toolbar>

          <div class="main-content" [@slideInOut]="getRouteAnimationData()">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>

      <!-- Global notification component -->
      <app-notification></app-notification>
    </div>
  `,
  styles: [`
    .mail-layout {
      height: 100vh;
      width: 100vw;
    }

    .sidenav-container {
      height: 100%;
    }

    .sidenav {
      width: 250px;
    }

    .main-content {
      height: calc(100vh - 64px);
      overflow-y: auto;
      background: #f5f5f5;
    }

    @media (max-width: 768px) {
      .sidenav {
        width: 280px;
      }

      .main-content {
        height: calc(100vh - 56px);
      }
    }

    @media (max-width: 480px) {
      .sidenav {
        width: 100%;
      }
    }
  `]
})
export class MailLayoutComponent implements OnInit {
  currentUser: User | null = null;
  isMobile = false;

  constructor(
    private authService: AuthService,
    private searchService: SearchService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  logout(): void {
    this.authService.logout();
  }

  onSearch(query: string): void {
    this.searchService.setSearchQuery(query);
  }

  onClearSearch(): void {
    this.searchService.clearSearch();
  }

  getRouteAnimationData() {
    return this.router.url;
  }
}