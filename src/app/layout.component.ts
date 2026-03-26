import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { MainComponent } from './main.component';
import { FooterComponent } from './footer.component';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, MainComponent, FooterComponent, NzLayoutModule, NzDrawerModule],
  template: `
    <div class="layout">
      <app-header [isMobile]="isMobile" (toggleMenu)="onToggleMenu()"></app-header>
      <div class="content-area">
        <!-- Desktop: sidebar inline -->
        <aside class="sidebar" *ngIf="!isMobile" [class.collapsed]="collapsed">
          <app-sidebar [(collapsed)]="collapsed"></app-sidebar>
        </aside>
        <!-- Mobile: drawer overlay -->
        <nz-drawer
          *ngIf="isMobile"
          [nzVisible]="drawerOpen"
          nzPlacement="left"
          [nzClosable]="false"
          [nzWidth]="280"
          nzWrapClassName="mobile-nav-drawer"
          (nzOnClose)="drawerOpen = false">
          <ng-container *nzDrawerContent>
            <app-sidebar [collapsed]="false" (navigated)="drawerOpen = false"></app-sidebar>
          </ng-container>
        </nz-drawer>
        <main class="main"><app-main></app-main></main>
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
export class LayoutComponent implements OnInit {
  collapsed = false;
  isMobile = false;
  drawerOpen = false;

  private readonly MOBILE_BREAKPOINT = 768;

  ngOnInit(): void {
    this.checkScreen();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreen();
  }

  onToggleMenu(): void {
    if (this.isMobile) {
      this.drawerOpen = !this.drawerOpen;
    } else {
      this.collapsed = !this.collapsed;
    }
  }

  private checkScreen(): void {
    this.isMobile = window.innerWidth < this.MOBILE_BREAKPOINT;
    if (this.isMobile) {
      this.collapsed = true;
    }
  }
}
