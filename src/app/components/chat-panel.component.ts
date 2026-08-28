import {
  Component, EventEmitter, Input, OnDestroy, OnInit, Output,
  ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ChatService, ChatMensagem, ChatStatus } from '../services/chat.service';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzInputModule, NzButtonModule, NzSpinModule,
    NzAlertModule, NzIconModule, NzToolTipModule
  ],
  template: `
    <div class="chat-panel">
      <nz-alert
        *ngIf="status?.mensagemHorario"
        nzType="info"
        [nzMessage]="status!.mensagemHorario"
        nzShowIcon
        class="chat-alert">
      </nz-alert>

      <nz-spin [nzSpinning]="carregando">
        <div class="chat-messages" #messagesBox>
          <div *ngIf="!mensagens.length && !carregando" class="chat-empty">
            <i nz-icon nzType="comment" nzTheme="outline" class="empty-icon"></i>
            <p>Nenhuma mensagem ainda</p>
            <span>Envie sua dúvida ao contador</span>
          </div>
          <div
            *ngFor="let m of mensagens; trackBy: trackMsg"
            class="chat-bubble-wrap"
            [class.mine]="m.ehMinha">
            <div class="chat-bubble">
              <div class="chat-meta">{{ m.remetenteNome }} · {{ m.dataCriacao }}</div>
              <div class="chat-text">{{ m.texto }}</div>
            </div>
          </div>
        </div>
      </nz-spin>

      <div class="chat-input-row">
        <textarea
          nz-input
          class="chat-textarea"
          [(ngModel)]="texto"
          [nzAutosize]="{ minRows: 1, maxRows: 4 }"
          placeholder="Digite sua mensagem..."
          (keydown.enter)="onEnter($event)"
          [disabled]="enviando">
        </textarea>
        <button
          nz-button
          nzType="primary"
          nzShape="circle"
          class="chat-send-btn"
          nz-tooltip
          nzTooltipTitle="Enviar (Enter)"
          [nzLoading]="enviando"
          (click)="enviar()"
          [disabled]="!texto.trim() || enviando"
          aria-label="Enviar mensagem">
          <i nz-icon nzType="send" nzTheme="outline"></i>
        </button>
      </div>
    </div>
  `,
  styles: [
    `.chat-panel{display:flex;flex-direction:column;height:100%;min-height:320px}`,
    `.chat-alert{margin-bottom:8px}`,
    `.chat-messages{flex:1;overflow-y:auto;padding:8px 4px;max-height:420px;min-height:240px}`,
    `.chat-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;text-align:center;color:rgba(0,0,0,.45)}`,
    `.empty-icon{font-size:40px;color:#91caff;margin-bottom:12px}`,
    `.chat-empty p{margin:0 0 4px;font-size:.95rem;font-weight:600;color:rgba(0,0,0,.55)}`,
    `.chat-empty span{font-size:.85rem}`,
    `.chat-bubble-wrap{display:flex;margin-bottom:10px}`,
    `.chat-bubble-wrap.mine{justify-content:flex-end}`,
    `.chat-bubble{max-width:85%;padding:8px 12px;border-radius:12px;background:#f5f5f5}`,
    `.chat-bubble-wrap.mine .chat-bubble{background:#e6f4ff}`,
    `.chat-meta{font-size:.72rem;color:rgba(0,0,0,.45);margin-bottom:4px}`,
    `.chat-text{white-space:pre-wrap;word-break:break-word;font-size:.92rem}`,
    `.chat-input-row{display:flex;gap:10px;align-items:flex-end;padding-top:10px;border-top:1px solid #f0f0f0}`,
    `.chat-textarea{flex:1;border-radius:20px!important;padding:8px 14px!important}`,
    `.chat-send-btn{width:42px;height:42px;min-width:42px;padding:0;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(24,144,255,.35);transition:transform .15s ease,box-shadow .15s ease}`,
    `.chat-send-btn:not([disabled]):hover{transform:scale(1.05);box-shadow:0 4px 12px rgba(24,144,255,.45)}`,
    `.chat-send-btn .anticon{font-size:17px;transform:translateX(1px) translateY(-1px)}`,
    `.chat-send-btn[disabled]{box-shadow:none;opacity:.45}`
  ]
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() modo: 'cliente' | 'admin' = 'cliente';
  @Input() codigoPessoa?: number;
  @Input() ativo = false;
  @Output() mensagensLidas = new EventEmitter<void>();

  @ViewChild('messagesBox') messagesBox?: ElementRef<HTMLDivElement>;

  mensagens: ChatMensagem[] = [];
  status?: ChatStatus;
  texto = '';
  carregando = false;
  enviando = false;
  private scrollPending = false;
  private pollSub?: Subscription;
  private heartbeatSub?: Subscription;
  private ultimoId = 0;
  private loadGen = 0;

  constructor(private chat: ChatService) {}

  ngOnInit(): void {
    this.heartbeatSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.chat.heartbeat())
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.heartbeatSub?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.scrollPending && this.messagesBox) {
      const el = this.messagesBox.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.scrollPending = false;
    }
  }

  iniciar(): void {
    this.parar();
    this.ultimoId = 0;
    this.mensagens = [];
    this.carregar(true);
    this.pollSub = interval(5000).subscribe(() => this.carregar(false));
  }

  parar(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  trackMsg = (_: number, m: ChatMensagem) => m.id;

  onEnter(ev: Event): void {
    const e = ev as KeyboardEvent;
    if (e.shiftKey) return;
    e.preventDefault();
    this.enviar();
  }

  enviar(): void {
    const t = this.texto.trim();
    if (!t || this.enviando) return;
    this.enviando = true;
    const req = this.modo === 'admin' && this.codigoPessoa
      ? this.chat.enviarAdmin(this.codigoPessoa, t)
      : this.chat.enviarCliente(t);

    req.subscribe({
      next: msg => {
        this.texto = '';
        this.enviando = false;
        if (msg.id > this.ultimoId) {
          this.anexarNovas([msg]);
          this.atualizarUltimoId();
        }
      },
      error: () => { this.enviando = false; }
    });
  }

  private carregar(inicial: boolean): void {
    if (this.modo === 'admin' && !this.codigoPessoa) return;
    if (inicial) this.carregando = true;

    const gen = ++this.loadGen;
    const req = this.modo === 'admin' && this.codigoPessoa
      ? this.chat.mensagensAdmin(this.codigoPessoa, inicial ? undefined : this.ultimoId)
      : this.chat.mensagensCliente(inicial ? undefined : this.ultimoId);

    req.subscribe({
      next: res => {
        if (gen !== this.loadGen) return;
        this.status = res.status;
        const novas = res.mensagens ?? [];
        if (inicial) {
          this.mensagens = novas;
          this.scrollPending = true;
        } else {
          this.anexarNovas(novas);
        }
        this.atualizarUltimoId();
        this.carregando = false;
        if (this.ativo) this.marcarLidas();
      },
      error: () => {
        if (gen === this.loadGen) this.carregando = false;
      }
    });
  }

  private anexarNovas(novas: ChatMensagem[]): void {
    if (!novas.length) return;
    const ids = new Set(this.mensagens.map(m => m.id));
    const unicas = novas.filter(m => !ids.has(m.id));
    if (!unicas.length) return;
    this.mensagens = [...this.mensagens, ...unicas];
    this.scrollPending = true;
  }

  private atualizarUltimoId(): void {
    if (!this.mensagens.length) return;
    this.ultimoId = Math.max(...this.mensagens.map(m => m.id));
  }

  private marcarLidas(): void {
    const req = this.modo === 'admin' && this.codigoPessoa
      ? this.chat.marcarLidasAdmin(this.codigoPessoa)
      : this.chat.marcarLidasCliente();
    req.subscribe({ next: () => this.mensagensLidas.emit() });
  }
}
