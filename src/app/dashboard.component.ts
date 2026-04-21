import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { PageTitleComponent } from './page-title.component';
import { LoginService, UsuarioLogado } from './services/login.service';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

interface DasItem {
  nomeArquivo: string;
  periodo: string;
  valorTributo: string;
}

interface NotaFiscal {
  numeroNFE: number;
  dataEmissao: string;
  cancelada?: boolean;
  dataCancelamento?: string | null;
  valorTotal?: number;
  valor?: string | number;
  tomador?: string;
  descricao?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NzCardModule, NzGridModule, NzTableModule, NzTagModule, NzIconModule, NzAvatarModule, NzSkeletonModule, NzDividerModule, NzAlertModule, NzButtonModule, PageTitleComponent],
  template: `
    <div class="dashboard">
      <app-page-title title="Painel" subtitle="Visão geral das suas notas fiscais"></app-page-title>

      <!-- Alerta DAS pendente -->
      <div *ngIf="temDasPendente" class="das-alert" (click)="irParaImpostos()">
        <div class="das-alert-icon"><i nz-icon nzType="warning" nzTheme="fill"></i></div>
        <div class="das-alert-body">
          <div class="das-alert-title">Você possui DAS pendente para pagamento!</div>
          <div class="das-alert-sub">Clique aqui para acessar a tela de Impostos e Obrigações e efetuar o pagamento.</div>
        </div>
        <div class="das-alert-arrow"><i nz-icon nzType="right"></i></div>
      </div>

      <!-- Boas-vindas -->
      <nz-card class="welcome-card" *ngIf="usuario">
        <div class="welcome-inner">
          <div class="welcome-text">
            <div class="welcome-greeting">{{ saudacao }}, <strong>{{ emailPrefix }}</strong>! 👋</div>
            <div class="welcome-meta">
              <span *ngIf="usuario.email"><i nz-icon nzType="mail"></i> {{ usuario.email }}</span>
              <span><i nz-icon nzType="clock-circle"></i> Acesso em {{ dataAcesso }}</span>
            </div>
          </div>
        </div>
      </nz-card>

      <!-- KPIs -->
      <ng-container *ngIf="loadingNotas">
        <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 2 }" style="margin-bottom:12px"></nz-skeleton>
      </ng-container>

      <div class="kpis" *ngIf="!loadingNotas">
        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="file-done" style="color:#52c41a"></i></div>
          <div class="kpi-label">Notas Emitidas {{ anoAtual }}</div>
          <div class="kpi-value">{{ totalNotasEmitidas }}</div>
          <div class="kpi-sub">acumulado do ano</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="calendar" style="color:#1890ff"></i></div>
          <div class="kpi-label">Fat. {{ mesAtualLabel }} <i nz-icon [nzType]="showFaturamento ? 'eye' : 'eye-invisible'" class="eye-toggle" (click)="showFaturamento = !showFaturamento"></i></div>
          <div class="kpi-value primary">{{ showFaturamento ? (faturamentoMesAtual | currency:'BRL':'symbol':'1.2-2') : '••••••' }}</div>
          <div class="kpi-sub">mês atual</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="rise" style="color:#722ed1"></i></div>
          <div class="kpi-label">Faturamento {{ anoAtual }} <i nz-icon [nzType]="showFaturamento ? 'eye' : 'eye-invisible'" class="eye-toggle" (click)="showFaturamento = !showFaturamento"></i></div>
          <div class="kpi-value purple">{{ showFaturamento ? (faturamentoAnoAtual | currency:'BRL':'symbol':'1.2-2') : '••••••' }}</div>
          <div class="kpi-sub">ano atual</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="history" style="color:#fa8c16"></i></div>
          <div class="kpi-label">Faturamento {{ anoAnterior }} <i nz-icon [nzType]="showFaturamento ? 'eye' : 'eye-invisible'" class="eye-toggle" (click)="showFaturamento = !showFaturamento"></i></div>
          <div class="kpi-value orange">{{ showFaturamento ? (faturamentoAnoAnterior | currency:'BRL':'symbol':'1.2-2') : '••••••' }}</div>
          <div class="kpi-sub">ano anterior</div>
        </nz-card>
      </div>

      <!-- Últimas notas -->
      <nz-card nzTitle="Últimas Notas Fiscais" style="margin-top:12px">
        <ng-container *ngIf="loadingNotas">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 5 }"></nz-skeleton>
        </ng-container>
        <nz-table
          *ngIf="!loadingNotas"
          [nzData]="ultimasNotas"
          nzSize="small"
          [nzShowPagination]="false">
          <thead>
            <tr>
              <th>Nº da Nota</th>
              <th>Data de Emissão</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let n of ultimasNotas" [class.row-cancelada]="n.cancelada">
              <td>{{ n.numeroNFE }}</td>
              <td>{{ n.dataEmissao | date:'dd/MM/yyyy' }}</td>
              <td>{{ parseBrl(n.valor) | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>
                <nz-tag [nzColor]="n.cancelada ? 'red' : 'green'">
                  {{ n.cancelada ? 'Cancelada' : 'Emitida' }}
                </nz-tag>
              </td>
            </tr>
            <tr *ngIf="ultimasNotas.length === 0">
              <td colspan="4" style="text-align:center;color:rgba(0,0,0,0.45);padding:24px">
                Nenhuma nota fiscal encontrada.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [
    `.das-alert{display:flex;align-items:center;gap:14px;margin:14px 0 4px;padding:14px 18px;background:linear-gradient(135deg,#fff7e6,#fff1d6);border:1.5px solid #ffa940;border-radius:10px;cursor:pointer;transition:box-shadow .2s,transform .15s}`,
    `.das-alert:hover{box-shadow:0 4px 16px rgba(255,169,64,.35);transform:translateY(-1px)}`,
    `.das-alert-icon{font-size:28px;color:#fa8c16;flex-shrink:0}`,
    `.das-alert-body{flex:1}`,
    `.das-alert-title{font-weight:700;font-size:1rem;color:#d46b08;margin-bottom:3px}`,
    `.das-alert-sub{color:rgba(0,0,0,0.55);font-size:0.875rem}`,
    `.das-alert-arrow{color:#fa8c16;font-size:18px;flex-shrink:0}`,
    `.welcome-card{margin-bottom:14px;border-radius:12px;background:linear-gradient(135deg,#f0f7ff 0%,#e8f4fd 100%);border:1px solid #c6e0f8}`,
    `.welcome-inner{display:flex;align-items:center;gap:16px}`,
    `.welcome-avatar{background:linear-gradient(135deg,#0a66c2,#5fb1ff);color:#fff;font-weight:700;font-size:1.1rem;flex-shrink:0}`,
    `.welcome-greeting{font-size:1.1rem;color:#0a66c2;margin-bottom:6px}`,
    `.welcome-meta{display:flex;flex-wrap:wrap;gap:16px;color:rgba(0,0,0,0.55);font-size:0.85rem}`,
    `.welcome-meta span{display:flex;align-items:center;gap:5px}`,
    `.welcome-text{flex:1}`,
    `.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:4px}`,
    `.kpi{flex:1;min-width:190px}`,
    `.kpi-icon{font-size:22px;margin-bottom:6px}`,
    `.kpi-label{color:rgba(0,0,0,0.45);font-size:0.88rem}`,
    `.kpi-value{font-size:1.35rem;font-weight:700;margin-top:4px;color:rgba(0,0,0,0.85)}`,
    `.kpi-value.primary{color:#1890ff}`,
    `.kpi-value.purple{color:#722ed1}`,
    `.kpi-value.orange{color:#fa8c16}`,
    `.kpi-sub{color:rgba(0,0,0,0.35);font-size:0.8rem;margin-top:4px}`,
    `.eye-toggle{cursor:pointer;margin-left:6px;font-size:14px;color:rgba(0,0,0,0.35);vertical-align:middle;transition:color .2s}`,
    `.eye-toggle:hover{color:rgba(0,0,0,0.65)}`,
    `.row-cancelada td{color:#cf1322!important}`,
    `@media(max-width:720px){.kpis{flex-direction:column}.welcome-inner{flex-direction:column;align-items:flex-start}}`
  ]
})
export class DashboardComponent implements OnInit {
  private readonly apiBase = environment.apiUrl;

  usuario: UsuarioLogado | null = null;
  userInitials = 'U';
  saudacao = 'Olá';
  emailPrefix = '';
  dataAcesso = '';

  loadingNotas = true;
  temDasPendente = false;
  showFaturamento = false;
  totalNotasEmitidas = 0;
  faturamentoMesAtual = 0;
  faturamentoAnoAtual = 0;
  faturamentoAnoAnterior = 0;
  ultimasNotas: NotaFiscal[] = [];

  readonly anoAtual = new Date().getFullYear();
  readonly anoAnterior = new Date().getFullYear() - 1;
  readonly mesAtualLabel = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  constructor(
    private loginService: LoginService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  ngOnInit(): void {
    this.usuario = this.loginService.obterUsuario();
    if (this.usuario) {
      this.userInitials = this.usuario.nome.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
      this.emailPrefix = this.usuario.email ? this.usuario.email.split('@')[0] : this.usuario.nome;
    }
    const hora = new Date().getHours();
    this.saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    this.dataAcesso = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    const pessoa = this.loginService.obterPessoa();
    if (!pessoa?.codigo) {
      this.loginService.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.carregarNotas(pessoa.codigo);
    this.carregarDas(pessoa.codigo);
  }

  carregarDas(codigoPessoa: number): void {
    this.http.get<DasItem | DasItem[]>(
      `${this.apiBase}/DAS/ObterListaEnvio/codigoPessoa/${codigoPessoa}`,
      { headers: this.headers }
    ).subscribe({
      next: (res) => {
        const lista = Array.isArray(res) ? res : [res];
        this.temDasPendente = lista.length > 0;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  irParaImpostos(): void {
    this.router.navigate(['/receita-imposto']);
  }

  irParaAlterarSenha(): void {
    this.router.navigate(['/alterar-senha']);
  }

  carregarNotas(codigoPessoa: number): void {
    this.http.get<NotaFiscal[]>(`${this.apiBase}/NotaFiscal/CodigoPessoa/${codigoPessoa}`, { headers: this.headers }).subscribe({
      next: (data) => {
        const raw = Array.isArray(data) ? data : [];
        const notas: NotaFiscal[] = raw.map((n: any) => ({
          ...n,
          cancelada: n.cancelada ?? !!n.dataCancelamento,
          valor: n.valorTotal ?? n.valor ?? 0
        }));
        const ativas = notas.filter(n => !n.cancelada);
        const agora = new Date();
        const mesAtual = agora.getMonth();

        this.totalNotasEmitidas = ativas
          .filter(n => new Date(n.dataEmissao).getFullYear() === this.anoAtual)
          .length;

        this.faturamentoMesAtual = ativas
          .filter(n => { const d = new Date(n.dataEmissao); return d.getFullYear() === this.anoAtual && d.getMonth() === mesAtual; })
          .reduce((acc, n) => acc + this.parseBrl(n.valor), 0);

        this.faturamentoAnoAtual = ativas
          .filter(n => new Date(n.dataEmissao).getFullYear() === this.anoAtual)
          .reduce((acc, n) => acc + this.parseBrl(n.valor), 0);

        this.faturamentoAnoAnterior = ativas
          .filter(n => new Date(n.dataEmissao).getFullYear() === this.anoAnterior)
          .reduce((acc, n) => acc + this.parseBrl(n.valor), 0);

        this.ultimasNotas = [...notas]
          .sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime())
          .slice(0, 5);

        this.loadingNotas = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingNotas = false;
        this.cdr.markForCheck();
      }
    });
  }

  parseBrl(valor: string | number | undefined | null): number {
    if (valor == null) return 0;
    if (typeof valor === 'number') return valor;
    const s = String(valor);
    if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    return parseFloat(s) || 0;
  }
}
