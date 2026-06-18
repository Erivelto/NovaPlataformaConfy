import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { FooterComponent } from './footer.component';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, AdminSidebarComponent, FooterComponent, NzLayoutModule, NzDrawerModule],
  template: `
    <div class="layout">
      <app-header [isMobile]="isMobile" (toggleMenu)="onToggleMenu()"></app-header>
      <div class="content-area">
        <aside class="sidebar" *ngIf="!isMobile" [class.collapsed]="collapsed">
          <app-admin-sidebar [(collapsed)]="collapsed"></app-admin-sidebar>
        </aside>
        <nz-drawer
          *ngIf="isMobile"
          [nzVisible]="drawerOpen"
          nzPlacement="left"
          [nzClosable]="false"
          [nzWidth]="280"
          nzWrapClassName="mobile-nav-drawer"
          (nzOnClose)="drawerOpen = false">
          <ng-container *nzDrawerContent>
            <app-admin-sidebar [collapsed]="false" (navigated)="drawerOpen = false"></app-admin-sidebar>
          </ng-container>
        </nz-drawer>
        <main class="main"><router-outlet></router-outlet></main>
      </div>
      <app-footer></app-footer>
    </div>
  `,
  styles: [
    `.layout{display:flex;flex-direction:column;min-height:100vh}`,
    `.content-area{display:flex;flex:1;transition:all .3s ease}`,
    `.sidebar{width:240px;border-right:1px solid #e6e6e6;padding:1rem;transition:width .3s ease;overflow:hidden}`,
    `.sidebar.collapsed{width:80px}`,
    `.main{flex:1;padding:0.5rem;transition:margin-left .3s ease;overflow-x:hidden}`,
    `@media(max-width:768px){.main{padding:0}}`
  ]
})
export class AdminLayoutComponent implements OnInit {
  collapsed = false;
  isMobile = false;
  drawerOpen = false;

  private readonly MOBILE_BREAKPOINT = 768;

  ngOnInit(): void { this.checkScreen(); }

  @HostListener('window:resize')
  onResize(): void { this.checkScreen(); }

  onToggleMenu(): void {
    if (this.isMobile) {
      this.drawerOpen = !this.drawerOpen;
    } else {
      this.collapsed = !this.collapsed;
    }
  }

  private checkScreen(): void {
    this.isMobile = window.innerWidth < this.MOBILE_BREAKPOINT;
    if (this.isMobile) this.collapsed = true;
  }
}
