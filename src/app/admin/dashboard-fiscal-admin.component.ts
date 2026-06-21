import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface NotaFiscal {
  codigo: number;
  codigoPessoa: number;
  dataEmissao: string;
  valorTotal: number;
  numeroNFE: number;
  excluido: boolean | number;
  cancelada?: boolean;
  statusPrefeitura?: string;
  codigoVerificacao?: string;
  urlNfe?: string;
}

interface PessoaResumo {
  codigo: number;
  razao?: string;
  nome?: string;
  documento?: string;
}

interface MesReceita {
  nome: string;
  valor: number;
  pct: number;
  mesIndex: number;
}

type FiltroPeriodo = 'mes' | 'ano' | 'anoAnterior';

@Component({
  selector: 'app-dashboard-fiscal-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, NzCardModule, NzButtonModule, NzIconModule,
    NzSkeletonModule, NzMessageModule, NzDividerModule,
    NzModalModule, NzTableModule, NzTagModule, PageTitleComponent
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <button nz-button nzType="default" (click)="voltar()">
          <i nz-icon nzType="arrow-left"></i> Voltar
        </button>
        <app-page-title
          title="Receitas"
          [subtitle]="nomeCliente ? nomeCliente : 'Carregando cliente...'">
        </app-page-title>
        <button nz-button nzType="default" (click)="carregar()" [nzLoading]="loading">
          <i nz-icon nzType="reload"></i> Atualizar
        </button>
      </div>

      <ng-container *ngIf="loading">
        <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 8 }"></nz-skeleton>
      </ng-container>

      <ng-container *ngIf="!loading">
        <nz-card class="chart-card" nzTitle="Sua Evolução de receita" [nzExtra]="chartHint">
          <ng-template #chartHint>
            <span class="chart-hint"><i nz-icon nzType="info-circle"></i> Clique nas barras para ver as notas</span>
          </ng-template>
          <div class="chart-wrap" *ngIf="meses.length; else semDados">
            <div class="chart-bars">
              <div
                *ngFor="let m of meses"
                class="bar-col"
                [class.bar-col-clickable]="m.valor > 0"
                (click)="abrirNotasMes(m)"
                [title]="m.valor > 0 ? 'Ver notas de ' + m.nome : ''">
                <div class="bar-val">{{ m.valor | currency:'BRL':'symbol':'1.0-0' }}</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.height.%]="m.pct"></div>
                </div>
                <div class="bar-label">{{ m.nome }}</div>
              </div>
            </div>
          </div>
          <ng-template #semDados>
            <div class="empty-chart">Nenhuma nota fiscal emitida no ano atual.</div>
          </ng-template>
        </nz-card>

        <div class="tiles-row">
          <div class="tile-card tile-clickable" (click)="abrirNotasMesAtual()" [title]="'Ver notas de ' + mesAtualNome">
            <div class="tile-count">{{ receitaMesAtual | currency:'BRL':'symbol':'1.2-2' }}</div>
            <div class="tile-label">Receita de {{ mesAtualNome }}</div>
            <div class="tile-action"><i nz-icon nzType="eye"></i> Detalhar notas</div>
          </div>
          <div class="tile-card green tile-clickable" (click)="abrirNotasAno()" [title]="'Ver notas de ' + anoAtual">
            <div class="tile-count">{{ receitaAnual | currency:'BRL':'symbol':'1.2-2' }}</div>
            <div class="tile-label">Receita total {{ anoAtual }}</div>
            <div class="tile-action"><i nz-icon nzType="eye"></i> Detalhar notas</div>
          </div>
          <div class="tile-card blue tile-clickable" (click)="abrirNotasAnoAnterior()" [title]="'Ver notas de ' + (anoAtual - 1)">
            <div class="tile-count">{{ receitaAnoAnterior | currency:'BRL':'symbol':'1.2-2' }}</div>
            <div class="tile-label">Receita total {{ anoAtual - 1 }}</div>
            <div class="tile-action"><i nz-icon nzType="eye"></i> Detalhar notas</div>
          </div>
        </div>
      </ng-container>
    </div>

    <nz-modal
      [(nzVisible)]="modalVisible"
      [nzTitle]="modalTitulo"
      [nzWidth]="760"
      [nzFooter]="null"
      (nzOnCancel)="fecharModal()">
      <ng-container *nzModalContent>
        <div class="modal-resumo">
          <span>{{ notasModal.length }} nota(s)</span>
          <span class="modal-total">Total: {{ totalModal | currency:'BRL':'symbol':'1.2-2' }}</span>
        </div>

        <nz-table
          #modalTable
          [nzData]="notasModal"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="notasModal.length > 8"
          [nzPageSize]="8"
          [nzFrontPagination]="true"
          [(nzPageIndex)]="modalPageIndex"
          [nzLoading]="modalLoading">
          <thead>
            <tr>
              <th nzWidth="100px">Nº Nota</th>
              <th nzWidth="120px">Emissão</th>
              <th nzWidth="120px">Valor</th>
              <th nzWidth="110px">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let n of modalTable.data" [class.row-cancelada]="n.cancelada">
              <td>{{ n.numeroNFE || '—' }}</td>
              <td>{{ n.dataEmissao | date:'dd/MM/yyyy' }}</td>
              <td>{{ n.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>
                <nz-tag [nzColor]="n.cancelada ? 'red' : 'green'">
                  {{ n.cancelada ? 'Cancelada' : 'Emitida' }}
                </nz-tag>
              </td>
            </tr>
            <tr *ngIf="!modalLoading && notasModal.length === 0">
              <td colspan="4" class="empty-modal">Nenhuma nota fiscal encontrada para este período.</td>
            </tr>
          </tbody>
        </nz-table>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .page { padding: 8px 12px 40px; }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
    }
    .page-header app-page-title { flex: 1; min-width: 200px; }

    .chart-card { margin-bottom: 16px; }
    .chart-hint { font-size: .78rem; color: rgba(0,0,0,.45); }
    .chart-wrap { padding: 8px 4px 0; overflow-x: auto; }
    .chart-bars {
      display: flex; align-items: flex-end; gap: 10px;
      min-height: 280px; padding: 0 4px 4px;
    }
    .bar-col {
      flex: 1; min-width: 52px; max-width: 90px;
      display: flex; flex-direction: column; align-items: center;
    }
    .bar-col-clickable {
      cursor: pointer;
      border-radius: 6px;
      transition: background .15s;
    }
    .bar-col-clickable:hover { background: rgba(82,196,26,.08); }
    .bar-col-clickable:hover .bar-fill { filter: brightness(1.08); }
    .bar-val {
      font-size: .68rem; color: rgba(0,0,0,.55);
      margin-bottom: 6px; text-align: center; line-height: 1.2;
      min-height: 28px;
    }
    .bar-track {
      width: 100%; height: 200px; background: #f5f5f5;
      border-radius: 4px 4px 0 0; display: flex; align-items: flex-end;
      border: 1px solid #f0f0f0;
    }
    .bar-fill {
      width: 100%; background: linear-gradient(180deg, #52c41a 0%, #389e0d 100%);
      border-radius: 4px 4px 0 0; min-height: 2px;
      transition: height .4s ease, filter .15s;
    }
    .bar-label {
      margin-top: 8px; font-size: .72rem; color: rgba(0,0,0,.55);
      text-align: center; white-space: nowrap;
    }
    .empty-chart {
      text-align: center; padding: 48px 16px;
      color: rgba(0,0,0,.35); font-style: italic;
    }

    .tiles-row {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
    }
    @media (max-width: 900px) { .tiles-row { grid-template-columns: 1fr; } }

    .tile-card {
      background: #fff; border-radius: 8px; padding: 22px 24px;
      border-left: 4px solid #d9d9d9;
      box-shadow: 0 1px 6px rgba(0,0,0,.07);
    }
    .tile-card.green { border-left-color: #52c41a; }
    .tile-card.blue  { border-left-color: #1890ff; }
    .tile-clickable {
      cursor: pointer;
      transition: box-shadow .15s, transform .15s;
    }
    .tile-clickable:hover {
      box-shadow: 0 4px 14px rgba(0,0,0,.12);
      transform: translateY(-1px);
    }
    .tile-count { font-size: 1.6rem; font-weight: 800; line-height: 1.2; }
    .tile-label { font-size: .85rem; color: rgba(0,0,0,.45); margin-top: 6px; }
    .tile-action {
      margin-top: 10px; font-size: .78rem; color: #1890ff;
      display: flex; align-items: center; gap: 4px;
    }

    .modal-resumo {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px; font-size: .9rem; color: rgba(0,0,0,.65);
    }
    .modal-total { font-weight: 700; color: #389e0d; }
    .empty-modal { text-align: center; padding: 24px; color: rgba(0,0,0,.45); }
    .row-cancelada td { opacity: .65; }
  `]
})
export class DashboardFiscalAdminComponent implements OnInit {
  private readonly api = environment.apiUrl;

  pessoaCodigo = 0;
  nomeCliente = '';
  loading = true;

  mesAtualNome = '';
  anoAtual = new Date().getFullYear();
  mesAtualIndex = new Date().getMonth();
  receitaMesAtual = 0;
  receitaAnual = 0;
  receitaAnoAnterior = 0;
  meses: MesReceita[] = [];

  notasTodas: NotaFiscal[] = [];
  modalVisible = false;
  modalLoading = false;
  modalTitulo = '';
  modalPageIndex = 1;
  notasModal: NotaFiscal[] = [];
  totalModal = 0;

  private readonly nomesMes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const culture = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
    this.mesAtualNome = culture.format(new Date());
    this.mesAtualNome = this.mesAtualNome.charAt(0).toUpperCase() + this.mesAtualNome.slice(1);

    this.route.paramMap.subscribe(params => {
      const id = +(params.get('pessoaCodigo') || 0);
      const qId = +(this.route.snapshot.queryParamMap.get('pessoaCodigo') || 0);
      this.pessoaCodigo = id || qId;
      if (!this.pessoaCodigo) {
        this.message.error('Cliente não informado.');
        this.router.navigate(['/administrativo/clientes']);
        return;
      }
      this.carregar();
    });
  }

  carregar(): void {
    this.loading = true;
    this.cdr.markForCheck();

    forkJoin({
      notas: this.http.get<unknown[]>(`${this.api}/NotaFiscal/CodigoPessoa/${this.pessoaCodigo}`, { headers: this.h })
        .pipe(timeout(20000), catchError(() => of([]))),
      pessoa: this.http.get<PessoaResumo>(`${this.api}/Pessoa/${this.pessoaCodigo}`, { headers: this.h })
        .pipe(timeout(10000), catchError(() => of(null)))
    }).subscribe(({ notas, pessoa }) => {
      this.nomeCliente = pessoa?.razao || pessoa?.nome || `Cliente #${this.pessoaCodigo}`;
      this.notasTodas = (notas || []).map(n => this.mapNota(n));
      this.calcularReceitas(this.notasTodas);
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  abrirNotasMes(mes: MesReceita): void {
    if (mes.valor <= 0) return;
    this.abrirModal(
      `Notas Fiscais — ${mes.nome}/${this.anoAtual}`,
      this.filtrarNotas({ tipo: 'mes', mesIndex: mes.mesIndex, ano: this.anoAtual })
    );
  }

  abrirNotasMesAtual(): void {
    this.abrirModal(
      `Notas Fiscais — ${this.mesAtualNome}/${this.anoAtual}`,
      this.filtrarNotas({ tipo: 'mes', mesIndex: this.mesAtualIndex, ano: this.anoAtual })
    );
  }

  abrirNotasAno(): void {
    this.abrirModal(
      `Notas Fiscais — ${this.anoAtual}`,
      this.filtrarNotas({ tipo: 'ano', ano: this.anoAtual })
    );
  }

  abrirNotasAnoAnterior(): void {
    this.abrirModal(
      `Notas Fiscais — ${this.anoAtual - 1}`,
      this.filtrarNotas({ tipo: 'ano', ano: this.anoAtual - 1 })
    );
  }

  fecharModal(): void {
    this.modalVisible = false;
    this.cdr.markForCheck();
  }

  private abrirModal(titulo: string, notas: NotaFiscal[]): void {
    this.modalTitulo = titulo;
    this.modalPageIndex = 1;
    this.notasModal = notas;
    this.totalModal = notas.reduce((t, n) => t + (n.valorTotal || 0), 0);
    this.modalVisible = true;
    this.modalLoading = false;
    this.cdr.markForCheck();
  }

  private filtrarNotas(filtro: { tipo: FiltroPeriodo | 'mes' | 'ano'; mesIndex?: number; ano: number }): NotaFiscal[] {
    const ativas = this.notasTodas.filter(n => !n.cancelada && n.dataEmissao);
    return ativas
      .filter(n => {
        const dt = new Date(n.dataEmissao);
        if (dt.getFullYear() !== filtro.ano) return false;
        if (filtro.tipo === 'mes' && filtro.mesIndex != null) {
          return dt.getMonth() === filtro.mesIndex;
        }
        return true;
      })
      .sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
  }

  private calcularReceitas(notas: NotaFiscal[]): void {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    const ativas = notas.filter(n => !n.cancelada && n.dataEmissao);
    const parseData = (d: string) => new Date(d);

    const soma = (lista: NotaFiscal[]) => lista.reduce((t, n) => t + (n.valorTotal || 0), 0);

    this.receitaMesAtual = soma(ativas.filter(n => {
      const dt = parseData(n.dataEmissao);
      return dt.getFullYear() === ano && dt.getMonth() + 1 === mesAtual;
    }));

    this.receitaAnual = soma(ativas.filter(n => parseData(n.dataEmissao).getFullYear() === ano));
    this.receitaAnoAnterior = soma(ativas.filter(n => parseData(n.dataEmissao).getFullYear() === ano - 1));

    const valoresMes = this.nomesMes.map((nome, i) => {
      const valor = soma(ativas.filter(n => {
        const dt = parseData(n.dataEmissao);
        return dt.getFullYear() === ano && dt.getMonth() === i;
      }));
      return { nome, valor, pct: 0, mesIndex: i };
    });

    const max = Math.max(...valoresMes.map(m => m.valor), 1);
    this.meses = valoresMes.map(m => ({ ...m, pct: Math.round((m.valor / max) * 100) }));
  }

  private mapNota(raw: unknown): NotaFiscal {
    const n = raw as Record<string, unknown>;
    const excluido = n['excluido'] ?? n['Excluido'];
    const cancelada = excluido === true || excluido === 1 || excluido === '1';
    const valor = Number(n['valorTotal'] ?? n['ValorTotal'] ?? 0);
    return {
      codigo: Number(n['codigo'] ?? n['Codigo'] ?? 0),
      codigoPessoa: Number(n['codigoPessoa'] ?? n['CodigoPessoa'] ?? 0),
      dataEmissao: String(n['dataEmissao'] ?? n['DataEmissao'] ?? ''),
      valorTotal: valor,
      numeroNFE: Number(n['numeroNFE'] ?? n['NumeroNFE'] ?? 0),
      excluido: excluido as boolean | number,
      cancelada,
      statusPrefeitura: String(n['statusPrefeitura'] ?? n['StatusPrefeitura'] ?? ''),
      codigoVerificacao: String(n['codigoVerificacao'] ?? n['CodigoVerificacao'] ?? ''),
      urlNfe: String(n['urlNfe'] ?? n['UrlNfe'] ?? '')
    };
  }

  voltar(): void {
    if (history.length > 1) {
      history.back();
    } else {
      this.router.navigate(['/administrativo/cliente', this.pessoaCodigo, 'editar']);
    }
  }
}
