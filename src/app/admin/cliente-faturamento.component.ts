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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { fmtCurrency, fmtDate } from '../utils/excel-export.helpers';
import { environment } from '../../environments/environment';

interface NotaFiscal {
  codigo: number;
  codigoPessoa: number;
  dataEmissao: string;
  valorTotal: number;
  numeroNFE: number;
  cancelada?: boolean;
  tomador?: string;
  descricao?: string;
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

@Component({
  selector: 'app-cliente-faturamento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, NzCardModule, NzButtonModule, NzIconModule,
    NzSkeletonModule, NzMessageModule, NzModalModule, NzTableModule,
    NzTagModule, PageTitleComponent, ExportExcelButtonComponent
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <button nz-button nzType="default" (click)="voltar()">
          <i nz-icon nzType="arrow-left"></i> Voltar
        </button>
        <app-page-title
          title="Faturamento"
          [subtitle]="nomeCliente || 'Carregando cliente...'">
        </app-page-title>
        <button nz-button nzType="default" (click)="carregar()" [nzLoading]="loading">
          <i nz-icon nzType="reload"></i> Atualizar
        </button>
      </div>

      <ng-container *ngIf="loading">
        <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 10 }"></nz-skeleton>
      </ng-container>

      <ng-container *ngIf="!loading">
        <div class="kpis">
          <nz-card class="kpi" nzBordered>
            <div class="kpi-icon"><i nz-icon nzType="file-done" style="color:#52c41a"></i></div>
            <div class="kpi-label">Notas Emitidas {{ anoAtual }}</div>
            <div class="kpi-value">{{ totalNotasEmitidas }}</div>
            <div class="kpi-sub">acumulado do ano</div>
          </nz-card>
          <nz-card class="kpi" nzBordered>
            <div class="kpi-icon"><i nz-icon nzType="calendar" style="color:#1890ff"></i></div>
            <div class="kpi-label">Fat. {{ mesAtualLabel }}</div>
            <div class="kpi-value primary">{{ faturamentoMesAtual | currency:'BRL':'symbol':'1.2-2' }}</div>
            <div class="kpi-sub">mês atual</div>
          </nz-card>
          <nz-card class="kpi kpi-clickable" nzBordered (click)="abrirNotasMesAnterior()" [class.kpi-disabled]="faturamentoMesAnterior <= 0">
            <div class="kpi-icon"><i nz-icon nzType="history" style="color:#13c2c2"></i></div>
            <div class="kpi-label">Fat. {{ mesAnteriorLabel }}</div>
            <div class="kpi-value teal">{{ faturamentoMesAnterior | currency:'BRL':'symbol':'1.2-2' }}</div>
            <div class="kpi-sub">mês anterior</div>
          </nz-card>
          <nz-card class="kpi" nzBordered>
            <div class="kpi-icon"><i nz-icon nzType="rise" style="color:#722ed1"></i></div>
            <div class="kpi-label">Faturamento {{ anoAtual }}</div>
            <div class="kpi-value purple">{{ faturamentoAnoAtual | currency:'BRL':'symbol':'1.2-2' }}</div>
            <div class="kpi-sub">ano atual</div>
          </nz-card>
          <nz-card class="kpi" nzBordered>
            <div class="kpi-icon"><i nz-icon nzType="history" style="color:#fa8c16"></i></div>
            <div class="kpi-label">Faturamento {{ anoAnterior }}</div>
            <div class="kpi-value orange">{{ faturamentoAnoAnterior | currency:'BRL':'symbol':'1.2-2' }}</div>
            <div class="kpi-sub">ano anterior</div>
          </nz-card>
        </div>

        <nz-card class="chart-card" nzTitle="Evolução mensal {{ anoAtual }}" [nzExtra]="chartHint">
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

        <nz-card nzTitle="Notas Fiscais" [nzExtra]="exportTpl">
          <ng-template #exportTpl>
            <app-export-excel-button [data]="$any(notasExibicao)" [columns]="exportColumns" fileName="faturamento-cliente" />
          </ng-template>
          <nz-table
            [nzData]="notasExibicao"
            nzBordered
            nzSize="middle"
            [nzShowPagination]="notasExibicao.length > 10"
            [nzPageSize]="10"
            [nzFrontPagination]="true">
            <thead>
              <tr>
                <th nzWidth="100px">Nº Nota</th>
                <th nzWidth="120px">Emissão</th>
                <th>Tomador</th>
                <th nzWidth="130px">Valor</th>
                <th nzWidth="110px">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let n of notasExibicao" [class.row-cancelada]="n.cancelada">
                <td>{{ n.numeroNFE || '—' }}</td>
                <td>{{ n.dataEmissao | date:'dd/MM/yyyy' }}</td>
                <td>{{ n.tomador || n.descricao || '—' }}</td>
                <td>{{ n.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
                <td>
                  <nz-tag [nzColor]="n.cancelada ? 'red' : 'green'">
                    {{ n.cancelada ? 'Cancelada' : 'Emitida' }}
                  </nz-tag>
                </td>
              </tr>
              <tr *ngIf="notasExibicao.length === 0">
                <td colspan="5" class="empty-table">Nenhuma nota fiscal encontrada.</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-card>
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
          [nzData]="notasModal"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="notasModal.length > 8"
          [nzPageSize]="8"
          [nzFrontPagination]="true">
          <thead>
            <tr>
              <th nzWidth="100px">Nº Nota</th>
              <th nzWidth="120px">Emissão</th>
              <th nzWidth="120px">Valor</th>
              <th nzWidth="110px">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let n of notasModal" [class.row-cancelada]="n.cancelada">
              <td>{{ n.numeroNFE || '—' }}</td>
              <td>{{ n.dataEmissao | date:'dd/MM/yyyy' }}</td>
              <td>{{ n.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>
                <nz-tag [nzColor]="n.cancelada ? 'red' : 'green'">
                  {{ n.cancelada ? 'Cancelada' : 'Emitida' }}
                </nz-tag>
              </td>
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
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .kpi { flex: 1; min-width: 180px; }
    .kpi-icon { font-size: 22px; margin-bottom: 6px; }
    .kpi-label { color: rgba(0,0,0,.45); font-size: .88rem; }
    .kpi-value { font-size: 1.35rem; font-weight: 700; margin-top: 4px; }
    .kpi-value.primary { color: #1890ff; }
    .kpi-value.purple { color: #722ed1; }
    .kpi-value.orange { color: #fa8c16; }
    .kpi-value.teal { color: #13c2c2; }
    .kpi-clickable { cursor: pointer; transition: box-shadow .15s, transform .15s; }
    .kpi-clickable:hover:not(.kpi-disabled) { box-shadow: 0 4px 14px rgba(0,0,0,.1); transform: translateY(-1px); }
    .kpi-disabled { cursor: default; opacity: .85; }
    .kpi-sub { color: rgba(0,0,0,.35); font-size: .8rem; margin-top: 4px; }
    .chart-card { margin-bottom: 16px; }
    .chart-hint { font-size: .78rem; color: rgba(0,0,0,.45); }
    .chart-wrap { padding: 8px 4px 0; overflow-x: auto; }
    .chart-bars {
      display: flex; align-items: flex-end; gap: 10px;
      min-height: 260px; padding: 0 4px 4px;
    }
    .bar-col {
      flex: 1; min-width: 52px; max-width: 90px;
      display: flex; flex-direction: column; align-items: center;
    }
    .bar-col-clickable { cursor: pointer; border-radius: 6px; transition: background .15s; }
    .bar-col-clickable:hover { background: rgba(82,196,26,.08); }
    .bar-val {
      font-size: .68rem; color: rgba(0,0,0,.55);
      margin-bottom: 6px; text-align: center; min-height: 28px;
    }
    .bar-track {
      width: 100%; height: 180px; background: #f5f5f5;
      border-radius: 4px 4px 0 0; display: flex; align-items: flex-end;
      border: 1px solid #f0f0f0;
    }
    .bar-fill {
      width: 100%; background: linear-gradient(180deg, #52c41a 0%, #389e0d 100%);
      border-radius: 4px 4px 0 0; min-height: 2px;
      transition: height .4s ease;
    }
    .bar-label { margin-top: 8px; font-size: .72rem; color: rgba(0,0,0,.55); }
    .empty-chart, .empty-table {
      text-align: center; padding: 32px 16px; color: rgba(0,0,0,.45);
    }
    .modal-resumo {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px; font-size: .9rem; color: rgba(0,0,0,.65);
    }
    .modal-total { font-weight: 700; color: #389e0d; }
    .row-cancelada td { color: #cf1322 !important; opacity: .85; }
    @media (max-width: 720px) { .kpis { flex-direction: column; } }
  `]
})
export class ClienteFaturamentoComponent implements OnInit {
  private readonly api = environment.apiUrl;

  pessoaCodigo = 0;
  origem = 'clientes';
  nomeCliente = '';
  loading = true;

  anoAtual = new Date().getFullYear();
  anoAnterior = this.anoAtual - 1;
  mesAtualLabel = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  mesAnteriorLabel = '';
  mesAnteriorIndex = 0;
  mesAnteriorAno = 0;

  totalNotasEmitidas = 0;
  faturamentoMesAtual = 0;
  faturamentoMesAnterior = 0;
  faturamentoAnoAtual = 0;
  faturamentoAnoAnterior = 0;
  meses: MesReceita[] = [];
  notasTodas: NotaFiscal[] = [];
  notasExibicao: NotaFiscal[] = [];

  modalVisible = false;
  modalTitulo = '';
  notasModal: NotaFiscal[] = [];
  totalModal = 0;

  readonly exportColumns: ExcelExportColumn<NotaFiscal>[] = [
    { key: 'numeroNFE', title: 'Nº Nota' },
    { key: 'dataEmissao', title: 'Emissão', format: fmtDate },
    { key: 'tomador', title: 'Tomador' },
    { key: 'valorTotal', title: 'Valor', format: fmtCurrency },
    { key: 'cancelada', title: 'Status', format: v => v ? 'Cancelada' : 'Emitida' }
  ];

  private readonly nomesMes = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
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
    this.route.paramMap.subscribe(params => {
      this.pessoaCodigo = +(params.get('id') || 0);
      this.origem = this.route.snapshot.queryParamMap.get('origem') || 'clientes';
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
      if (pessoa?.documento) this.nomeCliente += ` — ${pessoa.documento}`;
      this.notasTodas = (notas || []).map(n => this.mapNota(n));
      this.calcularIndicadores(this.notasTodas);
      this.notasExibicao = [...this.notasTodas]
        .sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  abrirNotasMes(mes: MesReceita): void {
    if (mes.valor <= 0) return;
    const lista = this.filtrarNotasAtivas(this.anoAtual, mes.mesIndex);
    this.abrirModal(`Notas — ${mes.nome}/${this.anoAtual}`, lista);
  }

  abrirNotasMesAnterior(): void {
    if (this.faturamentoMesAnterior <= 0) return;
    const lista = this.filtrarNotasAtivas(this.mesAnteriorAno, this.mesAnteriorIndex);
    this.abrirModal(`Notas — ${this.mesAnteriorLabel}`, lista);
  }

  fecharModal(): void {
    this.modalVisible = false;
    this.cdr.markForCheck();
  }

  voltar(): void {
    const destino = this.origem === 'clientes-fisica'
      ? '/administrativo/clientes-fisica'
      : '/administrativo/clientes';
    this.router.navigate([destino]);
  }

  private abrirModal(titulo: string, notas: NotaFiscal[]): void {
    this.modalTitulo = titulo;
    this.notasModal = notas;
    this.totalModal = notas.reduce((t, n) => t + (n.valorTotal || 0), 0);
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  private filtrarNotasAtivas(ano: number, mesIndex?: number): NotaFiscal[] {
    return this.notasTodas
      .filter(n => {
        if (n.cancelada || !n.dataEmissao) return false;
        const dt = new Date(n.dataEmissao);
        if (dt.getFullYear() !== ano) return false;
        if (mesIndex != null) return dt.getMonth() === mesIndex;
        return true;
      })
      .sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
  }

  private calcularIndicadores(notas: NotaFiscal[]): void {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const refMesAnterior = new Date(hoje.getFullYear(), mesAtual - 1, 1);
    this.mesAnteriorIndex = refMesAnterior.getMonth();
    this.mesAnteriorAno = refMesAnterior.getFullYear();
    this.mesAnteriorLabel = refMesAnterior.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    const ativas = notas.filter(n => !n.cancelada && n.dataEmissao);
    const soma = (lista: NotaFiscal[]) => lista.reduce((t, n) => t + (n.valorTotal || 0), 0);

    this.totalNotasEmitidas = ativas.filter(n => new Date(n.dataEmissao).getFullYear() === this.anoAtual).length;
    this.faturamentoMesAtual = soma(ativas.filter(n => {
      const d = new Date(n.dataEmissao);
      return d.getFullYear() === this.anoAtual && d.getMonth() === mesAtual;
    }));
    this.faturamentoMesAnterior = soma(ativas.filter(n => {
      const d = new Date(n.dataEmissao);
      return d.getFullYear() === this.mesAnteriorAno && d.getMonth() === this.mesAnteriorIndex;
    }));
    this.faturamentoAnoAtual = soma(ativas.filter(n => new Date(n.dataEmissao).getFullYear() === this.anoAtual));
    this.faturamentoAnoAnterior = soma(ativas.filter(n => new Date(n.dataEmissao).getFullYear() === this.anoAnterior));

    const valoresMes = this.nomesMes.map((nome, i) => {
      const valor = soma(ativas.filter(n => {
        const dt = new Date(n.dataEmissao);
        return dt.getFullYear() === this.anoAtual && dt.getMonth() === i;
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
    return {
      codigo: Number(n['codigo'] ?? n['Codigo'] ?? 0),
      codigoPessoa: Number(n['codigoPessoa'] ?? n['CodigoPessoa'] ?? 0),
      dataEmissao: String(n['dataEmissao'] ?? n['DataEmissao'] ?? ''),
      valorTotal: Number(n['valorTotal'] ?? n['ValorTotal'] ?? n['valor'] ?? 0),
      numeroNFE: Number(n['numeroNFE'] ?? n['NumeroNFE'] ?? 0),
      cancelada,
      tomador: String(n['tomador'] ?? n['Tomador'] ?? ''),
      descricao: String(n['descricao'] ?? n['Descricao'] ?? '')
    };
  }
}
