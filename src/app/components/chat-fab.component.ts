import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ChatPanelComponent } from './chat-panel.component';
import { ChatService } from '../services/chat.service';
import { ChatUiService } from '../services/chat-ui.service';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-chat-fab',
  standalone: true,
  imports: [
    CommonModule, NzDrawerModule, NzBadgeModule, NzButtonModule,
    NzIconModule, NzToolTipModule, ChatPanelComponent
  ],
  template: `
    <div *ngIf="visivel" class="chat-fab-wrap">
      <nz-badge [nzCount]="naoLidas" [nzOverflowCount]="99" [nzShowZero]="false" [nzOffset]="[-6, 6]">
        <button
          class="chat-fab"
          nz-button
          nzType="primary"
          nzShape="circle"
          nzSize="large"
          nz-tooltip
          nzTooltipTitle="Falar com contador"
          nzTooltipPlacement="left"
          aria-label="Chat com contador"
          (click)="abrir()">
          <i nz-icon nzType="wechat" nzTheme="outline" class="fab-icon"></i>
        </button>
      </nz-badge>
    </div>

    <nz-drawer
      [nzVisible]="drawerVisible"
      nzPlacement="right"
      [nzTitle]="drawerTitle"
      [nzWidth]="400"
      (nzOnClose)="fechar()">
      <ng-container *nzDrawerContent>
        <app-chat-panel
          #panel
          modo="cliente"
          [ativo]="drawerVisible"
          (mensagensLidas)="atualizarContagem()">
        </app-chat-panel>
      </ng-container>
    </nz-drawer>

    <ng-template #drawerTitle>
      <span class="drawer-title">
        <i nz-icon nzType="comment" nzTheme="outline"></i>
        Falar com contador
      </span>
    </ng-template>
  `,
  styles: [
    `.chat-fab-wrap{position:fixed;bottom:24px;right:24px;z-index:1000}`,
    `.chat-fab{width:56px!important;height:56px!important;padding:0!important;border:none!important;background:linear-gradient(135deg,#1890ff 0%,#096dd9 100%)!important;box-shadow:0 6px 20px rgba(24,144,255,.4);transition:transform .2s ease,box-shadow .2s ease}`,
    `.chat-fab:hover,.chat-fab:focus{transform:scale(1.06);box-shadow:0 8px 26px rgba(24,144,255,.5)}`,
    `.fab-icon{font-size:28px!important;color:#fff!important}`,
    `.drawer-title{display:inline-flex;align-items:center;gap:8px;font-weight:600}`,
    `.drawer-title .anticon{font-size:18px;color:#1890ff}`,
    `@media(max-width:768px){.chat-fab-wrap{bottom:16px;right:16px}}`
  ]
})
export class ChatFabComponent implements OnInit, OnDestroy {
  @ViewChild('panel') panel?: ChatPanelComponent;

  visivel = false;
  drawerVisible = false;
  naoLidas = 0;
  private pollSub?: Subscription;
  private uiSub?: Subscription;

  constructor(
    private chat: ChatService,
    private chatUi: ChatUiService,
    private login: LoginService
  ) {}

  ngOnInit(): void {
    const u = this.login.obterUsuario();
    this.visivel = !!u && !u.isAdmin && this.login.estaAutenticado();
    if (!this.visivel) return;

    this.pollSub = this.chat.pollingContagem(30000).subscribe(n => this.naoLidas = n);
    this.uiSub = this.chatUi.clienteAbrir.subscribe(() => this.abrir());
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.uiSub?.unsubscribe();
    this.panel?.parar();
  }

  abrir(): void {
    this.drawerVisible = true;
    setTimeout(() => this.panel?.iniciar(), 0);
  }

  fechar(): void {
    this.drawerVisible = false;
    this.panel?.parar();
    this.atualizarContagem();
  }

  atualizarContagem(): void {
    this.chat.contagem().subscribe(n => this.naoLidas = n);
  }
}
