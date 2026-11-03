import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { environment } from '../../environments/environment';

interface StatusAgendamento {
  execusao: number;
  erro: number;
  sucesso: number;
  aguardando: number;
}

interface ListaStatusAgendamento {
  codigo: number;
  codigoPessoa: number;
  documento: string;
  razao: string;
  dataPrimeiraEmissao: string;
  valor: string;
  status: string;
}

@Component({
  selector: 'app-agendamento-nfe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzCardModule, NzTableModule, NzIconModule, NzButtonModule,
    NzSkeletonModule, NzInputModule, NzMessageModule, NzPopconfirmModule, NzToolTipModule,
    PageTitleComponent, ExportExcelButtonComponent
  ],
  template: `
    <div class="page">
      <app-page-title title="Agendamento emissão NFE" subtitle="Monitoramento e interação dos agendamentos de nota fiscal do mês"></app-page-title>

      <div class="kpis">
        <nz-card class="kpi" *ngFor="let k of kpiStats; trackBy: trackByKpi">
          <div class="kpi-icon"><i nz-icon [nzType]="k.icon" [style.color]="k.color"></i></div>
          <div class="kpi-value" [style.color]="k.color" *ngIf="!loading">{{ k.value }}</div>
          <div class="kpi-label">{{ k.label }}</div>
        </nz-card>
      </div>

      <nz-card class="grid-card">
        <div class="toolbar">
          <nz-input-group class="toolbar-search" [nzPrefix]="prefixIcon">
            <input nz-input placeholder="Pesquisar..." [(ngModel)]="busca" (ngModelChange)="onBuscaChange()" />
          </nz-input-group>
          <ng-template #prefixIcon><i nz-icon nzType="search"></i></ng-template>
          <app-export-excel-button [data]="$any(listaFiltrada)" [columns]="exportColumns" fileName="agendamento-nfe" />
        </div>

        <ng-container *ngIf="loading">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton>
        </ng-container>

        <div *ngIf="!loading" class="agend-table-wrap">
          <nz-table
            #agendamentoTable
            class="agend-table"
            [nzData]="listaFiltrada"
            nzBordered
            nzSize="middle"
            [nzTableLayout]="'fixed'"
            [nzScroll]="{ x: '1120px' }"
            [nzShowPagination]="listaFiltrada.length > pageSize"
            [nzPageSize]="pageSize"
            [nzFrontPagination]="true"
            [(nzPageIndex)]="pageIndex">
            <thead>
              <tr>
                <th nzWidth="72px">Código</th>
                <th nzWidth="88px">Cód. Cliente</th>
                <th nzWidth="132px">CNPJ</th>
                <th nzWidth="240px">Nome</th>
                <th nzWidth="96px">Data</th>
                <th nzWidth="88px" [nzSortFn]="sortValor">Valor</th>
                <th nzWidth="128px" [nzSortFn]="sortStatus" nzSortOrder="ascend">Status</th>
                <th nzWidth="156px" nzAlign="center" nzRight>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of agendamentoTable.data; trackBy: trackByCodigo">
                <td class="mono">{{ item.codigo }}</td>
                <td class="mono">{{ item.codigoPessoa }}</td>
                <td class="doc-cell">{{ item.documento }}</td>
                <td class="nome-cell" nz-tooltip [nzTooltipTitle]="item.razao">{{ item.razao }}</td>
                <td class="nowrap">{{ item.dataPrimeiraEmissao }}</td>
                <td class="nowrap">{{ item.valor }}</td>
                <td class="status-cell" [style.color]="corStatus(item.status)">{{ item.status }}</td>
                <td nzAlign="center" nzRight>
                  <div class="acoes-col">
                    <button
                      *ngIf="podeEmitirNacional(item)"
                      nz-button
                      nzType="default"
                      nzSize="small"
                      class="btn-emitir"
                      nz-popconfirm
                      nzPopconfirmTitle="Enviar DPS à NFS-e nacional (SEFIN) para este agendamento?"
                      (nzOnConfirm)="emitirNfseNacional(item)"
                      [nzLoading]="emitindoCodigo === item.codigo">
                      <i nz-icon nzType="thunderbolt"></i> Emitir
                    </button>
                    <button nz-button nzType="primary" nzSize="small" (click)="abrirDetalhes(item)">
                      <i nz-icon nzType="eye"></i> Detalhes
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="listaFiltrada.length === 0">
                <td colspan="8" class="empty">Nenhum agendamento encontrado.</td>
              </tr>
            </tbody>
          </nz-table>
        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { padding: 8px 0; max-width: 100%; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
    .kpi { flex: 1; min-width: 140px; text-align: center; }
    .kpi-icon { font-size: 22px; margin-bottom: 4px; }
    .kpi-label { color: rgba(0,0,0,.45); font-size: .88rem; }
    .kpi-value { font-size: 1.35rem; font-weight: 800; margin: 2px 0; }
    :host ::ng-deep .kpi .ant-card-body { padding: 14px 12px; }

    .grid-card { margin-top: 14px; }
    :host ::ng-deep .grid-card .ant-card-body { padding: 16px 16px 12px; }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .toolbar-search { flex: 0 1 320px; min-width: 200px; max-width: 100%; }

    .agend-table-wrap { width: 100%; overflow: hidden; }
    .mono { font-variant-numeric: tabular-nums; }
    .doc-cell { font-size: 0.9rem; white-space: nowrap; }
    .nome-cell {
      max-width: 240px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .nowrap { white-space: nowrap; }
    .status-cell { font-weight: 600; white-space: nowrap; }

    .acoes-col {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      align-items: center;
      max-width: 100%;
    }

    .empty { text-align: center; padding: 32px; color: rgba(0,0,0,.45); }
    .btn-emitir { border-color: #722ed1; color: #722ed1; }

    :host ::ng-deep .agend-table .ant-table { margin: 0; }
    :host ::ng-deep .agend-table .ant-table-container { border-radius: 4px; }
  `]
})
export class AgendamentoNfeComponent implements OnInit {
  private readonly api = environment.apiUrl;
  private buscaTimer?: ReturnType<typeof setTimeout>;

  loading = true;
  emitindoCodigo: number | null = null;
  lista: ListaStatusAgendamento[] = [];
  listaFiltrada: ListaStatusAgendamento[] = [];
  busca = '';
  pageIndex = 1;
  readonly pageSize = 10;

  kpiStats: { label: string; value: number; icon: string; color: string }[] = [];

  readonly exportColumns: ExcelExportColumn<ListaStatusAgendamento>[] = [
    { key: 'codigo', title: 'Código' },
    { key: 'codigoPessoa', title: 'Cód. Cliente' },
    { key: 'documento', title: 'CNPJ' },
    { key: 'razao', title: 'Nome' },
    { key: 'dataPrimeiraEmissao', title: 'Data' },
    { key: 'valor', title: 'Valor' },
    { key: 'status', title: 'Status' }
  ];

  sortValor = (a: ListaStatusAgendamento, b: ListaStatusAgendamento) =>
    this.parseValor(a.valor) - this.parseValor(b.valor);

  sortStatus = (a: ListaStatusAgendamento, b: ListaStatusAgendamento) =>
    this.prioridadeStatus(a.status) - this.prioridadeStatus(b.status)
    || this.parseValor(a.valor) - this.parseValor(b.valor);

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(
    private http: HttpClient,
    private message: NzMessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  trackByKpi(_: number, k: { label: string }): string { return k.label; }
  trackByCodigo(_: number, item: ListaStatusAgendamento): number { return item.codigo; }

  carregar(): void {
    this.loading = true;
    const statusDefault: StatusAgendamento = { execusao: 0, erro: 0, sucesso: 0, aguardando: 0 };

    forkJoin({
      status: this.http.get<StatusAgendamento>(`${this.api}/CorpoEmissaoNota/RetornaStatusAgendamento`, { headers: this.h })
        .pipe(timeout(12000), catchError(() => of(statusDefault))),
      lista: this.http.get<ListaStatusAgendamento[]>(`${this.api}/CorpoEmissaoNota/RetornaStatusAgendamentoLista`, { headers: this.h })
        .pipe(timeout(12000), catchError(() => of([] as ListaStatusAgendamento[])))
    }).subscribe({
      next: ({ status, lista }) => {
        const s = status ?? statusDefault;
        this.kpiStats = [
          { label: 'Erro', value: s.erro ?? 0, icon: 'close-circle', color: '#ff4d4f' },
          { label: 'Executando', value: s.execusao ?? 0, icon: 'loading', color: '#d4a017' },
          { label: 'Sucesso', value: s.sucesso ?? 0, icon: 'check-circle', color: '#52c41a' },
          { label: 'Aguardando', value: s.aguardando ?? 0, icon: 'clock-circle', color: '#1890ff' }
        ];
        this.lista = lista.map((item: unknown) => this.normalizarItem(item));
        this.ordenarPorStatus();
        this.aplicarFiltro();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Erro ao carregar agendamentos NFE.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onBuscaChange(): void {
    clearTimeout(this.buscaTimer);
    this.buscaTimer = setTimeout(() => {
      this.aplicarFiltro();
      this.cdr.markForCheck();
    }, 250);
  }

  aplicarFiltro(): void {
    const termo = this.busca.trim().toLowerCase();
    if (!termo) {
      this.listaFiltrada = [...this.lista];
    } else {
      this.listaFiltrada = this.lista.filter(item =>
        [item.codigo, item.codigoPessoa, item.documento, item.razao, item.dataPrimeiraEmissao, item.valor, item.status]
          .some(v => String(v ?? '').toLowerCase().includes(termo))
      );
    }
    this.ordenarLista(this.listaFiltrada);
    this.pageIndex = 1;
  }

  corStatus(status: string): string {
    switch (status) {
      case 'Sucesso': return '#389e0d';
      case 'Aguardando Execução': return '#4169e1';
      case 'Erro': return '#cf1322';
      case 'Executando': return '#B18904';
      default: return '#B18904';
    }
  }

  abrirDetalhes(item: ListaStatusAgendamento): void {
    this.router.navigate(['/administrativo/agendamento-nfe/detalhe', item.codigo], {
      queryParams: { status: item.status }
    });
  }

  podeEmitirNacional(item: ListaStatusAgendamento): boolean {
    const s = (item.status || '').toLowerCase();
    return s.includes('aguardando') || s.includes('erro');
  }

  emitirNfseNacional(item: ListaStatusAgendamento): void {
    this.emitindoCodigo = item.codigo;
    this.cdr.markForCheck();
    this.http.post<{
      sucesso?: boolean;
      mensagem?: string;
      numeroNfe?: number;
      respostaSefin?: string;
    }>(`${this.api}/NfseNacional/emissao/agendamento/${item.codigo}`, {}, { headers: this.h })
      .pipe(timeout(300000), catchError(err => {
        const e = err as { error?: { mensagem?: string; message?: string } };
        const msg = e?.error?.mensagem || e?.error?.message || 'Falha na comunicação com a API.';
        this.message.error(msg);
        this.emitindoCodigo = null;
        this.cdr.markForCheck();
        return of(null);
      }))
      .subscribe(res => {
        if (!res) return;
        const ok = res.sucesso === true;
        if (ok) {
          this.message.success(res.mensagem || `NFS-e emitida (NF ${res.numeroNfe ?? '—'}).`);
          this.carregar();
        } else {
          this.message.error(res.mensagem || 'Emissão não concluída. Veja detalhes do agendamento.');
          this.carregar();
        }
        this.emitindoCodigo = null;
        this.cdr.markForCheck();
      });
  }

  private normalizarItem(item: unknown): ListaStatusAgendamento {
    const r = item as Record<string, unknown>;
    return {
      codigo: Number(r['codigo'] ?? r['Codigo']),
      codigoPessoa: Number(r['codigoPessoa'] ?? r['CodigoPessoa']),
      documento: String(r['documento'] ?? r['Documento'] ?? ''),
      razao: String(r['razao'] ?? r['Razao'] ?? ''),
      dataPrimeiraEmissao: String(r['dataPrimeiraEmissao'] ?? r['DataPrimeiraEmissao'] ?? ''),
      valor: String(r['valor'] ?? r['Valor'] ?? ''),
      status: String(r['status'] ?? r['Status'] ?? '')
    };
  }

  private ordenarPorStatus(): void {
    this.ordenarLista(this.lista);
  }

  /** Ordem: Erro → Aguardando → Executando → Sucesso; desempate por valor. */
  private ordenarLista(itens: ListaStatusAgendamento[]): void {
    itens.sort((a, b) =>
      this.prioridadeStatus(a.status) - this.prioridadeStatus(b.status)
      || this.parseValor(a.valor) - this.parseValor(b.valor)
    );
  }

  private prioridadeStatus(status: string): number {
    const s = (status || '').toLowerCase();
    if (s.includes('erro')) return 0;
    if (s.includes('aguardando')) return 1;
    if (s.includes('executando') || s.includes('execusao') || s.includes('execução')) return 2;
    if (s.includes('sucesso')) return 3;
    return 4;
  }

  private parseValor(valor: string): number {
    if (!valor) return 0;
    const n = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }
}
