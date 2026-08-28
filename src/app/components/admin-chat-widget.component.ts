import {
  Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ChatPanelComponent } from './chat-panel.component';
import { ChatService, ChatConversa } from '../services/chat.service';
import { ChatUiService } from '../services/chat-ui.service';

@Component({
  selector: 'app-admin-chat-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, NzCardModule, NzListModule, NzBadgeModule,
    NzEmptyModule, NzSpinModule, NzIconModule, ChatPanelComponent
  ],
  template: `
    <nz-card nzTitle="Chat com clientes" class="admin-chat-card" [nzExtra]="extraTpl">
      <ng-template #extraTpl>
        <nz-badge [nzCount]="totalNaoLidas" [nzOverflowCount]="99" [nzShowZero]="false">
          <i nz-icon nzType="wechat" nzTheme="outline" class="admin-chat-icon"></i>
        </nz-badge>
      </ng-template>

      <div class="admin-chat-grid">
        <div class="conversas-list">
          <nz-spin [nzSpinning]="carregandoLista">
            <nz-list *ngIf="conversas.length; else vazio" [nzDataSource]="conversas" [nzRenderItem]="item">
              <ng-template #item let-c>
                <nz-list-item
                  class="conversa-item"
                  [class.ativa]="c.codigoPessoa === selecionado"
                  (click)="selecionar(c)">
                  <nz-list-item-meta
                    [nzTitle]="tituloConversa(c)"
                    [nzDescription]="c.ultimaMensagem">
                  </nz-list-item-meta>
                  <span *ngIf="c.naoLidas" class="nao-lidas">{{ c.naoLidas }}</span>
                </nz-list-item>
              </ng-template>
            </nz-list>
            <ng-template #vazio>
              <nz-empty nzNotFoundContent="Nenhuma conversa ainda"></nz-empty>
            </ng-template>
          </nz-spin>
        </div>

        <div class="conversa-detalhe">
          <div *ngIf="!selecionado" class="selecione-msg">
            Selecione um cliente para responder
          </div>
          <app-chat-panel
            *ngIf="selecionado"
            #panel
            modo="admin"
            [codigoPessoa]="selecionado"
            [ativo]="!!selecionado"
            (mensagensLidas)="recarregarLista()">
          </app-chat-panel>
        </div>
      </div>
    </nz-card>
  `,
  styles: [
    `.admin-chat-card{margin-top:16px}`,
    `.admin-chat-icon{font-size:20px;color:#1890ff}`,
    `.admin-chat-grid{display:grid;grid-template-columns:minmax(220px,34%) 1fr;gap:16px;min-height:360px}`,
    `.conversas-list{border-right:1px solid #f0f0f0;padding-right:8px;max-height:460px;overflow-y:auto}`,
    `.conversa-item{cursor:pointer;padding:8px 4px;border-radius:8px}`,
    `.conversa-item:hover,.conversa-item.ativa{background:#f5f5f5}`,
    `.conversa-detalhe{min-height:320px}`,
    `.selecione-msg{color:rgba(0,0,0,.45);text-align:center;padding:48px 16px}`,
    `.nao-lidas{background:#ff4d4f;color:#fff;border-radius:10px;padding:0 7px;font-size:.75rem;font-weight:700}`,
    `@media(max-width:900px){.admin-chat-grid{grid-template-columns:1fr}.conversas-list{border-right:none;border-bottom:1px solid #f0f0f0;padding-right:0;padding-bottom:8px;max-height:200px}}`
  ]
})
export class AdminChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('panel') panel?: ChatPanelComponent;

  conversas: ChatConversa[] = [];
  selecionado?: number;
  totalNaoLidas = 0;
  carregandoLista = false;
  private pollSub?: Subscription;
  private uiSub?: Subscription;

  constructor(
    private chat: ChatService,
    private chatUi: ChatUiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.recarregarLista();
    this.pollSub = interval(30000).pipe(startWith(0)).subscribe(() => {
      this.chat.contagem().subscribe(n => {
        this.totalNaoLidas = n;
        this.cdr.markForCheck();
      });
      this.recarregarListaSilencioso();
    });
    this.uiSub = this.chatUi.adminAbrir.subscribe(codigo => {
      if (codigo) this.abrirConversa(codigo);
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.uiSub?.unsubscribe();
    this.panel?.parar();
  }

  tituloConversa(c: ChatConversa): string {
    return `${c.nomeCliente} · ${c.dataUltimaMensagem}`;
  }

  selecionar(c: ChatConversa): void {
    if (this.selecionado === c.codigoPessoa) return;
    this.panel?.parar();
    this.selecionado = c.codigoPessoa;
    this.cdr.markForCheck();
    setTimeout(() => this.panel?.iniciar(), 0);
  }

  abrirConversa(codigoPessoa: number): void {
    this.recarregarLista();
    const c = this.conversas.find(x => x.codigoPessoa === codigoPessoa);
    if (c) {
      this.selecionar(c);
      return;
    }
    this.selecionado = codigoPessoa;
    this.cdr.markForCheck();
    setTimeout(() => this.panel?.iniciar(), 0);
  }

  recarregarLista(): void {
    this.carregandoLista = true;
    this.cdr.markForCheck();
    this.chat.conversas().subscribe({
      next: lista => this.aplicarLista(lista),
      error: () => {
        this.carregandoLista = false;
        this.cdr.markForCheck();
      }
    });
  }

  private recarregarListaSilencioso(): void {
    this.chat.conversas().subscribe({
      next: lista => this.aplicarLista(lista, true)
    });
  }

  private aplicarLista(lista: ChatConversa[] | null, silencioso = false): void {
    this.conversas = lista ?? [];
    this.totalNaoLidas = this.conversas.reduce((s, c) => s + (c.naoLidas ?? 0), 0);
    if (!silencioso) this.carregandoLista = false;
    this.cdr.markForCheck();
  }
}
