import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, NzLayoutModule, NzMenuModule, NzIconModule, NzToolTipModule],
  template: `
    <nz-sider
      nzCollapsible
      [nzCollapsed]="collapsed"
      (nzCollapsedChange)="onCollapsedChange($event)"
      [nzCollapsedWidth]="80"
      [nzTrigger]="inDrawer ? null : undefined"
      style="padding:8px">

      <div class="admin-badge" [class.collapsed-badge]="collapsed">
        <i nz-icon nzType="crown" nzTheme="fill"></i>
        <span *ngIf="!collapsed">Painel Admin</span>
      </div>

      <ul nz-menu nzMode="inline" [nzInlineCollapsed]="collapsed" class="sidebar-menu">

        <!-- Dashboard -->
        <li nz-menu-item
          (click)="go('/administrativo/dashboard')"
          [nzSelected]="isActive('/administrativo/dashboard')"
          nz-tooltip [nzTooltipTitle]="collapsed ? 'Dashboard' : ''" nzTooltipPlacement="right">
          <i nz-icon nzType="home"></i>
          <span>Dashboard</span>
        </li>

        <!-- Gestão -->
        <li nz-submenu nzTitle="Gestão" nzIcon="edit" [nzOpen]="gestaoOpen" (nzOpenChange)="gestaoOpen=$event">
          <ul>
            <li nz-menu-item (click)="go('/administrativo/clientes')" [nzSelected]="isActive('/administrativo/clientes')">
              <i nz-icon nzType="user"></i><span>Clientes Online</span>
            </li>
            <li nz-menu-item (click)="go('/administrativo/clientes-fisica')" [nzSelected]="isActive('/administrativo/clientes-fisica')">
              <i nz-icon nzType="contacts"></i><span>Clientes Fisica</span>
            </li>
            <li nz-menu-item (click)="go('/administrativo/devedores')" [nzSelected]="isActive('/administrativo/devedores')">
              <i nz-icon nzType="dollar"></i><span>Clientes Devedores Mês Atual</span>
            </li>
            <li nz-menu-item (click)="go('/administrativo/devedores-anterior')" [nzSelected]="isActive('/administrativo/devedores-anterior')">
              <i nz-icon nzType="history"></i><span>Clientes Devedores Todos Meses</span>
            </li>
            <li nz-menu-item (click)="go('/administrativo/historico-das')" [nzSelected]="isActive('/administrativo/historico-das')">
              <i nz-icon nzType="bar-chart"></i><span>Relatório DAS</span>
            </li>
            <li nz-menu-item (click)="go('/administrativo/validacao-das')" [nzSelected]="isActive('/administrativo/validacao-das')">
              <i nz-icon nzType="audit"></i><span>Relatório Geral</span>
            </li>
            <li nz-menu-item (click)="go('/administrativo/gestao-pessoal')" [nzSelected]="isActive('/administrativo/gestao-pessoal')">
              <i nz-icon nzType="idcard"></i><span>Gestão Pessoal</span>
            </li>
            <li nz-menu-item (click)="go('/administrativo/blog')" [nzSelected]="isActive('/administrativo/blog')">
              <i nz-icon nzType="read"></i><span>Blog</span>
            </li>
            <li nz-menu-item (click)="go('/administrativo/solicitacoes')" [nzSelected]="isActive('/administrativo/solicitacoes')">
              <i nz-icon nzType="message"></i><span>Solicitações Lista</span>
            </li>
            <li nz-menu-item (click)="go('/administrativo/solicitacoes-dashboard')" [nzSelected]="isActive('/administrativo/solicitacoes-dashboard')">
              <i nz-icon nzType="dashboard"></i><span>Solicitações Dashboard</span>
            </li>
            <li nz-menu-item (click)="go('/administrativo/agendamento-nfe')" [nzSelected]="isActive('/administrativo/agendamento-nfe')">
              <i nz-icon nzType="schedule"></i><span>Agendamento NFE</span>
            </li>
          </ul>
        </li>

      </ul>
    </nz-sider>
  `,
  styles: [
    `.admin-badge{display:flex;align-items:center;gap:8px;padding:10px 12px;margin-bottom:8px;border-radius:8px;background:linear-gradient(135deg,rgba(250,173,20,.15),rgba(250,173,20,.05));border:1px solid rgba(250,173,20,.3);color:#d48806;font-weight:700;font-size:.82rem}`,
    `.admin-badge .anticon{color:#faad14;font-size:16px;flex-shrink:0}`,
    `.collapsed-badge{justify-content:center;padding:8px}`,
    `.sidebar-menu .ant-menu-item,.sidebar-menu .ant-menu-submenu-title{border-radius:8px;margin:2px 0;transition:all .15s ease}`
  ]
})
export class AdminSidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() navigated = new EventEmitter<void>();

  gestaoOpen = true;
  get inDrawer(): boolean { return !this.collapsed; }

  constructor(private router: Router) {}

  go(path: string): void {
    this.router.navigate([path]);
    this.navigated.emit();
  }

  goQuery(path: string, queryParams: any): void {
    this.router.navigate([path], { queryParams });
    this.navigated.emit();
  }

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '/');
  }

  isActiveQuery(path: string, status: string): boolean {
    return this.router.url.includes(path) && this.router.url.includes(`status=${status}`);
  }

  onCollapsedChange(v: boolean): void {
    this.collapsed = v;
    this.collapsedChange.emit(v);
    if (v) this.gestaoOpen = false;
  }
}
