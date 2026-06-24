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
    NzSkeletonModule, NzInputModule, NzMessageModule, PageTitleComponent, ExportExcelButtonComponent
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

      <nz-card style="margin-top:14px">
        <div class="toolbar">
          <nz-input-group [nzPrefix]="prefixIcon" style="max-width:320px">
            <input nz-input placeholder="Pesquisar..." [(ngModel)]="busca" (ngModelChange)="onBuscaChange()" />
          </nz-input-group>
          <ng-template #prefixIcon><i nz-icon nzType="search"></i></ng-template>
          <app-export-excel-button [data]="$any(listaFiltrada)" [columns]="exportColumns" fileName="agendamento-nfe" />
        </div>

        <ng-container *ngIf="loading">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton>
        </ng-container>

        <nz-table
          *ngIf="!loading"
          #agendamentoTable
          [nzData]="listaFiltrada"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="listaFiltrada.length > pageSize"
          [nzPageSize]="pageSize"
          [nzFrontPagination]="true"
          [(nzPageIndex)]="pageIndex">
          <thead>
            <tr>
              <th nzWidth="80px">Código</th>
              <th nzWidth="100px">Cód. Cliente</th>
              <th nzWidth="140px">CNPJ</th>
              <th>Nome</th>
              <th nzWidth="110px">Data</th>
              <th nzWidth="100px" [nzSortFn]="sortValor">Valor</th>
              <th nzWidth="150px">Status</th>
              <th nzWidth="110px" nzAlign="center"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of agendamentoTable.data; trackBy: trackByCodigo" [style.color]="corStatus(item.status)">
              <td>{{ item.codigo }}</td>
              <td>{{ item.codigoPessoa }}</td>
              <td>{{ item.documento }}</td>
              <td>{{ item.razao }}</td>
              <td>{{ item.dataPrimeiraEmissao }}</td>
              <td>{{ item.valor }}</td>
              <td>{{ item.status }}</td>
              <td nzAlign="center">
                <button nz-button nzType="primary" nzSize="small" nzShape="round" (click)="abrirDetalhes(item)">
                  <i nz-icon nzType="eye"></i> Detalhes
                </button>
              </td>
            </tr>
            <tr *ngIf="listaFiltrada.length === 0">
              <td colspan="8" class="empty">Nenhum agendamento encontrado.</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
    .kpi { flex: 1; min-width: 150px; text-align: center; }
    .kpi-icon { font-size: 24px; margin-bottom: 6px; }
    .kpi-label { color: rgba(0,0,0,.45); font-size: .88rem; }
    .kpi-value { font-size: 1.4rem; font-weight: 800; margin: 4px 0; }
    .toolbar { margin-bottom: 12px; }
    .empty { text-align: center; padding: 32px; color: rgba(0,0,0,.45); }
  `]
})
export class AgendamentoNfeComponent implements OnInit {
  private readonly api = environment.apiUrl;
  private buscaTimer?: ReturnType<typeof setTimeout>;

  loading = true;
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
        this.ordenarPorValor();
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

  private ordenarPorValor(): void {
    this.lista.sort((a, b) => this.parseValor(a.valor) - this.parseValor(b.valor));
  }

  private parseValor(valor: string): number {
    if (!valor) return 0;
    const n = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }
}
