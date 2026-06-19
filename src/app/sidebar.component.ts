import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { LoginService } from './services/login.service';
import { MensalidadeStatusService } from './services/mensalidade-status.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, NzLayoutModule, NzMenuModule, NzIconModule, NzAvatarModule, NzToolTipModule],
  template: `
    <nz-sider nzCollapsible [nzCollapsed]="collapsed" (nzCollapsedChange)="onCollapsedChange($event)" [nzCollapsedWidth]="80" [nzTrigger]="inDrawer ? null : undefined" style="padding:8px">
      <div class="user-panel" [class.collapsed]="collapsed">
      </div>
      <ul nz-menu nzMode="inline" [nzInlineCollapsed]="collapsed" class="sidebar-menu">
        <li nz-menu-item (click)="navigateGuarded('/dashboard')" [nzSelected]="isActive('/dashboard')" [nzDisabled]="mensalidadeStatus.bloqueado" [class.menu-bloqueado]="mensalidadeStatus.bloqueado" nz-tooltip [nzTooltipTitle]="mensalidadeStatus.bloqueado ? 'Acesso bloqueado — regularize sua mensalidade' : (collapsed ? 'Dashboard' : '')" nzTooltipPlacement="right">
          <i nz-icon nzType="home"></i>
          <span>Dashboard</span>
        </li>
        <li nz-menu-item (click)="navigateGuarded('/meus-dados')" [nzSelected]="isActive('/meus-dados')" [nzDisabled]="mensalidadeStatus.bloqueado" [class.menu-bloqueado]="mensalidadeStatus.bloqueado" nz-tooltip [nzTooltipTitle]="mensalidadeStatus.bloqueado ? 'Acesso bloqueado — regularize sua mensalidade' : (collapsed ? 'Meus Dados' : '')" nzTooltipPlacement="right">
          <i nz-icon nzType="idcard"></i>
          <span>Meus Dados</span>
        </li>
        <li nz-menu-item (click)="navigateGuarded('/meu-contrato')" [nzSelected]="isActive('/meu-contrato')" [nzDisabled]="mensalidadeStatus.bloqueado" [class.menu-bloqueado]="mensalidadeStatus.bloqueado" nz-tooltip [nzTooltipTitle]="mensalidadeStatus.bloqueado ? 'Acesso bloqueado — regularize sua mensalidade' : (collapsed ? 'Meu Contrato' : '')" nzTooltipPlacement="right">
          <i nz-icon nzType="file-protect"></i>
          <span>Meu Contrato</span>
        </li>
        <li nz-menu-item (click)="navigateGuarded('/solicitacao-nfe')" [nzSelected]="isActive('/solicitacao-nfe')" [nzDisabled]="mensalidadeStatus.bloqueado" [class.menu-bloqueado]="mensalidadeStatus.bloqueado" nz-tooltip [nzTooltipTitle]="mensalidadeStatus.bloqueado ? 'Acesso bloqueado — regularize sua mensalidade' : (collapsed ? 'Solicitação Emissão Nfe' : '')" nzTooltipPlacement="right">
          <i nz-icon nzType="file-add"></i>
          <span>Solicitação Emissão Nfe</span>
        </li>
        <li nz-menu-item (click)="navigateGuarded('/notas-fiscais')" [nzSelected]="isActive('/notas-fiscais')" [nzDisabled]="mensalidadeStatus.bloqueado" [class.menu-bloqueado]="mensalidadeStatus.bloqueado" nz-tooltip [nzTooltipTitle]="mensalidadeStatus.bloqueado ? 'Acesso bloqueado — regularize sua mensalidade' : (collapsed ? 'Notas Fiscais' : '')" nzTooltipPlacement="right">
          <i nz-icon nzType="file-text"></i>
          <span>Notas Fiscais</span>
        </li>
        <li nz-menu-item (click)="navigateGuarded('/receita-imposto')" [nzSelected]="isActive('/receita-imposto')" [nzDisabled]="mensalidadeStatus.bloqueado" [class.menu-bloqueado]="mensalidadeStatus.bloqueado" nz-tooltip [nzTooltipTitle]="mensalidadeStatus.bloqueado ? 'Acesso bloqueado — regularize sua mensalidade' : (collapsed ? 'Receita/Imposto' : '')" nzTooltipPlacement="right">
          <i nz-icon nzType="bar-chart"></i>
          <span>Impostos</span>
        </li>
        <li nz-menu-item (click)="navigate('/mensalidade')" [nzSelected]="isActive('/mensalidade')" nz-tooltip [nzTooltipTitle]="collapsed ? 'Mensalidade' : ''" nzTooltipPlacement="right">
          <i nz-icon nzType="credit-card"></i>
          <span>Mensalidade</span>
        </li>
        <li nz-menu-item (click)="openGuarded()" [nzDisabled]="mensalidadeStatus.bloqueado" [class.menu-bloqueado]="mensalidadeStatus.bloqueado" nz-tooltip [nzTooltipTitle]="mensalidadeStatus.bloqueado ? 'Acesso bloqueado — regularize sua mensalidade' : (collapsed ? 'Situação Cadastral' : '')" nzTooltipPlacement="right">
          <i nz-icon nzType="idcard"></i>
          <span>Situação Cadastral</span>
        </li>
        <li nz-menu-item (click)="navigate('/solicitacoes')" [nzSelected]="isActive('/solicitacoes')" nz-tooltip [nzTooltipTitle]="collapsed ? 'Solicitar Serviço' : ''" nzTooltipPlacement="right">
          <i nz-icon nzType="audit"></i>
          <span>Solicitar Serviço</span>
        </li>
      </ul>
    </nz-sider>
  `,
  styles: [
    `.user-panel{display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px;margin-bottom:8px;background:linear-gradient(90deg,rgba(10,102,194,0.06),rgba(95,177,255,0.03))}`,
    `.user-panel.collapsed{justify-content:center;padding:8px}`,
    `.user-info{display:flex;flex-direction:column;overflow:hidden}`,
    `.user-name{font-weight:700;color:var(--primary-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
    `.user-role{font-size:0.85rem;color:rgba(0,0,0,0.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
    `.avatar-initials{background:linear-gradient(135deg,#0a66c2,#5fb1ff);color:#fff;font-weight:700}`,
    `.sidebar-menu .ant-menu-item{border-radius:8px;margin:2px 0;transition:all .15s ease}`,
    `.sidebar-menu .ant-menu-item:active{transform:scale(0.97)}`,
    `.menu-bloqueado{opacity:0.4!important;cursor:not-allowed!important;pointer-events:none}`
  ],
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() navigated = new EventEmitter<void>();

  /** When true, hides the nz-sider collapse trigger (used inside drawer) */
  get inDrawer(): boolean { return !this.collapsed; }

  userName = 'Usuário';
  userRole = '';
  userInitials = 'U';
  userAvatar: string | null = null;

  constructor(
    private loginService: LoginService,
    private router: Router,
    public mensalidadeStatus: MensalidadeStatusService
  ) {}

  ngOnInit(): void {
    const usuario = this.loginService.obterUsuario();
    if (usuario) {
      this.userName = usuario.nome;
      this.userRole = usuario.perfil || usuario.email || '';
      this.userInitials = usuario.nome
        .split(' ')
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase() ?? '')
        .join('');
    }
  }

  navigate(path: string): void {
    this.router.navigate([path]);
    this.navigated.emit();
  }

  navigateGuarded(path: string): void {
    if (this.mensalidadeStatus.bloqueado) return;
    this.navigate(path);
  }

  openSituacaoCadastral(): void {
    window.open('https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/', '_blank');
    this.navigated.emit();
  }

  openGuarded(): void {
    if (this.mensalidadeStatus.bloqueado) return;
    this.openSituacaoCadastral();
  }

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '/');
  }

  onCollapsedChange(v: boolean) {
    this.collapsed = v;
    this.collapsedChange.emit(v);
  }
}
