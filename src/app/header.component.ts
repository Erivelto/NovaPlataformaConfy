import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { LoginService } from './services/login.service';
import { NotificacaoService, NotificacaoTela } from './services/notificacao.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, NzLayoutModule, NzButtonModule, NzIconModule, NzAvatarModule,
    NzToolTipModule, NzBadgeModule, NzDrawerModule, NzListModule, NzEmptyModule, NzSpinModule
  ],
  template: `
    <nz-header class="app-header">
      <div class="brand">
        <button *ngIf="isMobile" nz-button nzType="text" class="hamburger" aria-label="menu" (click)="toggleMenu.emit()">
          <i nz-icon nzType="menu-fold"></i>
        </button>
        <img src="/Logo.png" alt="logo" class="logo" />
      </div>
      <div class="actions">
        <nz-badge [nzCount]="naoLidas" [nzOverflowCount]="99" [nzShowZero]="false">
          <button nz-button nzType="text" aria-label="notifications" nz-tooltip nzTooltipTitle="Notificações" (click)="abrirNotificacoes()">
            <i nz-icon nzType="bell"></i>
          </button>
        </nz-badge>
        <button nz-button nzType="text" aria-label="alterar senha" nz-tooltip nzTooltipTitle="Alterar senha" (click)="alterarSenha()">
          <i nz-icon nzType="lock"></i>
        </button>
        <div class="user-chip" nz-tooltip [nzTooltipTitle]="userEmail">
          <nz-avatar [nzText]="userInitials" nzSize="small" class="user-avatar"></nz-avatar>
          <span class="user-name-header">{{ userName }}</span>
        </div>
        <button nz-button nzType="text" class="logout-corner" aria-label="logout" (click)="logout()">
          <i nz-icon nzType="logout"></i>
        </button>
      </div>
    </nz-header>

    <nz-drawer
      [nzVisible]="drawerVisible"
      nzPlacement="right"
      nzTitle="Notificações"
      [nzWidth]="380"
      (nzOnClose)="fecharNotificacoes()">
      <ng-container *nzDrawerContent>
        <div class="notif-actions" *ngIf="notificacoes.length">
          <button nz-button nzType="link" nzSize="small" (click)="marcarTodasLidas()">Marcar todas como lidas</button>
        </div>
        <nz-spin [nzSpinning]="carregandoNotif">
          <nz-list *ngIf="notificacoes.length; else vazioNotif" [nzDataSource]="notificacoes" [nzRenderItem]="item">
            <ng-template #item let-n>
              <nz-list-item class="notif-item" [class.notif-lida]="n.lida" (click)="abrirNotificacao(n)">
                <nz-list-item-meta
                  [nzTitle]="n.titulo"
                  [nzDescription]="descricaoNotif(n)">
                </nz-list-item-meta>
                <span *ngIf="!n.lida" class="notif-dot"></span>
              </nz-list-item>
            </ng-template>
          </nz-list>
          <ng-template #vazioNotif>
            <nz-empty nzNotFoundContent="Nenhuma notificação este mês"></nz-empty>
          </ng-template>
        </nz-spin>
      </ng-container>
    </nz-drawer>
  `,
  styles: [
    `.app-header{display:flex;align-items:center;padding:0 20px;background:linear-gradient(90deg,var(--primary-color),var(--primary-light));color:#fff;position:sticky;top:0;z-index:100}`,
    `.app-header .brand{display:flex;align-items:center;gap:12px}`,
    `.app-header .logo{height:52px;width:52px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.3)}`,
    `.app-header .title{font-weight:700;font-size:1.125rem;color:rgba(255,255,255,0.98)}`,
    `.app-header .actions{margin-left:auto;display:flex;gap:12px;align-items:center;z-index:2}`,
    `.app-header .ant-btn{color:rgba(255,255,255,0.95);border-color:transparent}`,
    `.app-header .ant-btn-default{background:transparent;color:rgba(255,255,255,0.95);border:none;border-radius:var(--btn-radius);padding:6px 10px}`,
    `.app-header .ant-btn-default:hover{background:rgba(255,255,255,0.06)}`,
    `.hamburger{font-size:22px!important;padding:4px 8px!important;color:#fff!important}`,
    `.hamburger .anticon{font-size:22px;color:#fff}`,
    `.logout-corner{border-radius:50%;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:2px solid rgba(255,255,255,0.12);color:#fff;box-shadow:0 6px 18px rgba(10,102,194,0.12);pointer-events:auto;cursor:pointer;transition:transform .12s ease;margin-left:10px}`,
    `.logout-corner:hover{transform:scale(1.06)} .logout-corner i{color:#fff;font-size:18px}`,
    `.app-header .ant-btn, .ant-btn.ant-btn-default{pointer-events:auto}`,
    `.app-header .anticon{color:rgba(255,255,255,0.95)}`,
    `.user-chip{display:flex;align-items:center;gap:8px;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,0.12);cursor:default}`,
    `.user-avatar{background:rgba(255,255,255,0.3);color:#fff;font-weight:700}`,
    `.user-name-header{color:#fff;font-weight:600;font-size:0.9rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`,
    `.notif-actions{text-align:right;margin-bottom:8px}`,
    `.notif-item{cursor:pointer;padding:8px 0}`,
    `.notif-item.notif-lida{opacity:.65}`,
    `.notif-dot{width:8px;height:8px;border-radius:50%;background:#1890ff;display:inline-block;flex-shrink:0}`,
    `@media(max-width:768px){.app-header{padding:0 10px;height:56px;line-height:56px}.app-header .logo{height:36px;width:36px}.user-name-header{display:none}.user-chip{padding:4px 8px}.logout-corner{width:36px;height:36px;margin-left:6px}.actions{gap:6px!important}}`
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() isMobile = false;
  @Output() toggleMenu = new EventEmitter<void>();

  userName = '';
  userEmail = '';
  userInitials = 'U';
  naoLidas = 0;
  drawerVisible = false;
  carregandoNotif = false;
  notificacoes: NotificacaoTela[] = [];

  private pollSub?: Subscription;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private notificacaoService: NotificacaoService,
  ) {}

  ngOnInit(): void {
    const usuario = this.loginService.obterUsuario();
    if (usuario) {
      this.userName = usuario.email ? usuario.email.split('@')[0] : usuario.nome;
      this.userEmail = usuario.email;
      this.userInitials = this.userName
        .split(' ')
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase() ?? '')
        .join('');
    }
    if (this.loginService.estaAutenticado()) {
      this.pollSub = this.notificacaoService.pollingContagem(60000).subscribe(n => {
        this.naoLidas = n;
      });
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  abrirNotificacoes(): void {
    this.drawerVisible = true;
    this.carregarNotificacoes();
  }

  fecharNotificacoes(): void {
    this.drawerVisible = false;
  }

  carregarNotificacoes(): void {
    this.carregandoNotif = true;
    this.notificacaoService.listar().subscribe({
      next: lista => {
        this.notificacoes = lista ?? [];
        this.naoLidas = this.notificacoes.filter(n => !n.lida).length;
        this.carregandoNotif = false;
      },
      error: () => {
        this.carregandoNotif = false;
      }
    });
  }

  descricaoNotif(n: NotificacaoTela): string {
    return `${n.mensagem}\n${n.dataCriacao ?? ''}`;
  }

  abrirNotificacao(n: NotificacaoTela): void {
    if (!n.lida) {
      this.notificacaoService.marcarLida(n.id).subscribe({
        next: () => {
          n.lida = true;
          this.naoLidas = Math.max(0, this.naoLidas - 1);
        }
      });
    }
    if (n.linkAcao) {
      this.drawerVisible = false;
      this.router.navigateByUrl(n.linkAcao);
    }
  }

  marcarTodasLidas(): void {
    this.notificacaoService.marcarTodasLidas().subscribe({
      next: () => {
        this.notificacoes.forEach(n => n.lida = true);
        this.naoLidas = 0;
      }
    });
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/entrar']);
  }

  alterarSenha(): void {
    this.router.navigate(['/alterar-senha']);
  }
}
