import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { fmtCurrency } from '../utils/excel-export.helpers';
import { environment } from '../../environments/environment';

interface RelatorioNfeNota {
  codigo: number;
  numeroNFE: number;
  dataEmissao: string;
  valorTotal: number;
  cancelada: boolean;
  valorRepetido: boolean;
  numeroRepetido: boolean;
}

interface RelatorioNfeLinha {
  codigoPessoa: number;
  razao: string;
  documento: string;
  quantidadeNfe: number;
  valorTotalMesAtual: number;
  valorTotalMesPassado: number;
  alertaDuplicidade: boolean;
  expand: boolean;
  notas?: RelatorioNfeNota[];
  carregandoNotas?: boolean;
  notasCarregadas?: boolean;
}

interface RelatorioNfeDto {
  mesReferencia: number;
  anoReferencia: number;
  mesAnterior: number;
  anoAnterior: number;
  totalClientes: number;
  totalComNotasMesAtual: number;
  totalComAlertaDuplicidade: number;
  somaValorMesAtual: number;
  somaValorMesPassado: number;
  clientes: RelatorioNfeLinha[];
}

@Component({
  selector: 'app-relatorio-nfe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzCheckboxModule,
    NzToolTipModule, NzMessageModule,
    PageTitleComponent, ExportExcelButtonComponent
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <app-page-title
          title="Relatório NFE"
          [subtitle]="subtitulo">
        </app-page-title>
        <button nz-button nzType="default" (click)="carregar()" [nzLoading]="loading">
          <i nz-icon nzType="reload"></i> Atualizar
        </button>
      </div>

      <div class="tiles-row" *ngIf="!loading && relatorio">
        <div class="tile-stats">
          <div class="count primary">{{ relatorio.totalComNotasMesAtual }}</div>
          <h3>Com NF-e no mês</h3>
        </div>
        <div class="tile-stats">
          <div class="count green">{{ relatorio.somaValorMesAtual | currency:'BRL':'symbol':'1.2-2' }}</div>
          <h3>Total mês atual</h3>
        </div>
        <div class="tile-stats">
          <div class="count muted">{{ relatorio.somaValorMesPassado | currency:'BRL':'symbol':'1.2-2' }}</div>
          <h3>Total mês anterior</h3>
        </div>
        <div class="tile-stats">
          <div class="count warn">{{ relatorio.totalComAlertaDuplicidade }}</div>
          <h3>Valores repetidos</h3>
        </div>
      </div>

      <div class="toolbar" *ngIf="!loading">
        <nz-input-group [nzPrefix]="pfx" class="search">
          <input nz-input placeholder="Buscar código, razão ou documento..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
        </nz-input-group>
        <ng-template #pfx><span nz-icon nzType="search"></span></ng-template>
        <label nz-checkbox [(ngModel)]="somenteComNotas" (ngModelChange)="filtrar()">Somente com NF-e no mês atual</label>
        <app-export-excel-button
          [data]="$any(linhasFiltradasExport)"
          [columns]="exportColumns"
          fileName="relatorio-nfe"
          [loading]="loading" />
      </div>

      <ng-container *ngIf="loading">
        <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 10 }"></nz-skeleton>
      </ng-container>

      <nz-table
        *ngIf="!loading"
        #tabela
        [nzData]="linhasFiltradas"
        nzBordered
        nzSize="small"
        [nzPageSize]="20"
        [nzShowPagination]="linhasFiltradas.length > 20"
        [nzScroll]="{ x: '980px' }">
        <thead>
          <tr>
            <th nzWidth="48px"></th>
            <th nzWidth="90px" [nzSortFn]="sortCodigo">CodigoPessoa</th>
            <th>Razão Social</th>
            <th nzWidth="110px" nzAlign="center" [nzSortFn]="sortQtd">Quantidade NFE</th>
            <th nzWidth="150px" [nzSortFn]="sortAtual" nzSortOrder="descend">Valor Total Mês Atual</th>
            <th nzWidth="150px" [nzSortFn]="sortPassado">Valor Total Mês Passado</th>
            <th nzWidth="100px" nzAlign="center">Alerta</th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngFor="let g of tabela.data">
            <tr class="row-grupo" (click)="toggleLinha(g)">
              <td [nzShowExpand]="true" [(nzExpand)]="g.expand" (click)="$event.stopPropagation()"></td>
              <td><span class="cod">{{ g.codigoPessoa }}</span></td>
              <td>{{ g.razao || '—' }}</td>
              <td nzAlign="center"><nz-tag [nzColor]="g.quantidadeNfe ? 'blue' : 'default'">{{ g.quantidadeNfe }}</nz-tag></td>
              <td>{{ g.valorTotalMesAtual | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>{{ g.valorTotalMesPassado | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td nzAlign="center">
                <nz-tag *ngIf="g.alertaDuplicidade" nzColor="orange" nz-tooltip nzTooltipTitle="Há notas com o mesmo valor no mês">
                  <span nz-icon nzType="warning"></span> Repetição
                </nz-tag>
                <span *ngIf="!g.alertaDuplicidade" class="ok">—</span>
              </td>
            </tr>
            <tr [nzExpand]="g.expand">
              <td colspan="7" class="nested-cell">
                <div *ngIf="g.carregandoNotas" style="padding:12px">
                  <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 3 }"></nz-skeleton>
                </div>
                <div *ngIf="!g.carregandoNotas && g.notasCarregadas && !g.notas?.length" class="empty-nested">
                  Nenhuma NF-e no mês atual.
                </div>
                <nz-table
                  *ngIf="!g.carregandoNotas && g.notas?.length"
                  [nzData]="g.notas!"
                  nzSize="small"
                  nzBordered
                  [nzShowPagination]="g.notas!.length > 10"
                  [nzPageSize]="10"
                  class="nested-table">
                  <thead>
                    <tr>
                      <th nzWidth="100px">Nº NF-e</th>
                      <th nzWidth="120px">Emissão</th>
                      <th nzWidth="130px">Valor</th>
                      <th nzWidth="100px">Status</th>
                      <th>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let n of g.notas" [class.row-alerta]="n.valorRepetido || n.numeroRepetido">
                      <td>{{ n.numeroNFE }}</td>
                      <td>{{ n.dataEmissao | date:'dd/MM/yyyy' }}</td>
                      <td>{{ n.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
                      <td>
                        <nz-tag *ngIf="n.cancelada" nzColor="red">Cancelada</nz-tag>
                        <nz-tag *ngIf="!n.cancelada" nzColor="green">Ativa</nz-tag>
                      </td>
                      <td>
                        <span *ngIf="n.valorRepetido" class="hint-warn">Valor igual a outra nota do mês</span>
                        <span *ngIf="n.numeroRepetido" class="hint-warn">Número duplicado</span>
                        <span *ngIf="!n.valorRepetido && !n.numeroRepetido">—</span>
                      </td>
                    </tr>
                  </tbody>
                </nz-table>
              </td>
            </tr>
          </ng-container>
        </tbody>
      </nz-table>
    </div>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    .tiles-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 14px; }
    .tile-stats { background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; padding: 14px 16px; }
    .tile-stats h3 { margin: 6px 0 0; font-size: .82rem; color: rgba(0,0,0,.55); font-weight: 500; }
    .count { font-size: 1.35rem; font-weight: 700; }
    .count.primary { color: #1890ff; }
    .count.green { color: #52c41a; }
    .count.muted { color: rgba(0,0,0,.65); }
    .count.warn { color: #fa8c16; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 12px; }
    .search { max-width: 360px; flex: 1; min-width: 220px; }
    .row-grupo { cursor: pointer; }
    .row-grupo:hover td { background: #fafafa; }
    .cod { font-weight: 600; color: #1890ff; }
    .nested-cell { background: #fafafa; padding: 8px 12px 12px !important; }
    .nested-table { background: #fff; }
    .row-alerta td { background: #fff7e6 !important; }
    .hint-warn { color: #d46b08; font-size: .85rem; }
    .empty-nested { padding: 16px; color: rgba(0,0,0,.45); text-align: center; }
    .ok { color: rgba(0,0,0,.25); }
  `]
})
export class RelatorioNfeComponent implements OnInit {
  api = environment.apiUrl;
  loading = false;
  filtro = '';
  somenteComNotas = true;
  relatorio: RelatorioNfeDto | null = null;
  linhas: RelatorioNfeLinha[] = [];
  linhasFiltradas: RelatorioNfeLinha[] = [];

  exportColumns: ExcelExportColumn[] = [
    { key: 'codigoPessoa', title: 'CodigoPessoa' },
    { key: 'razao', title: 'Razão Social' },
    { key: 'documento', title: 'Documento' },
    { key: 'quantidadeNfe', title: 'Quantidade NFE' },
    { key: 'valorTotalMesAtual', title: 'Valor Total Mês Atual', format: v => fmtCurrency(v) },
    { key: 'valorTotalMesPassado', title: 'Valor Total Mês Passado', format: v => fmtCurrency(v) },
    { key: 'alertaDuplicidade', title: 'Alerta Duplicidade' }
  ];

  get subtitulo(): string {
    if (!this.relatorio) return 'Clientes Online — somatório de NF-e';
    const m = String(this.relatorio.mesReferencia).padStart(2, '0');
    return `Clientes Online (física = não) · ${m}/${this.relatorio.anoReferencia} vs mês anterior`;
  }

  get linhasFiltradasExport(): Record<string, unknown>[] {
    return this.linhasFiltradas.map(({ expand, notas, carregandoNotas, notasCarregadas, ...rest }) => rest);
  }

  sortCodigo = (a: RelatorioNfeLinha, b: RelatorioNfeLinha) => a.codigoPessoa - b.codigoPessoa;
  sortQtd = (a: RelatorioNfeLinha, b: RelatorioNfeLinha) => a.quantidadeNfe - b.quantidadeNfe;
  sortAtual = (a: RelatorioNfeLinha, b: RelatorioNfeLinha) => a.valorTotalMesAtual - b.valorTotalMesAtual;
  sortPassado = (a: RelatorioNfeLinha, b: RelatorioNfeLinha) => a.valorTotalMesPassado - b.valorTotalMesPassado;

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.get<RelatorioNfeDto>(`${this.api}/NotaFiscal/Relatorio`, { headers: this.h })
      .pipe(timeout(60000), catchError(() => of(null)))
      .subscribe(res => {
        if (!res) {
          this.message.error('Erro ao carregar relatório NFE.');
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        this.relatorio = res;
        this.linhas = (res.clientes || []).map(c => ({
          ...c,
          expand: false,
          notasCarregadas: false,
          carregandoNotas: false
        }));
        this.filtrar();
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  filtrar(): void {
    const f = this.filtro.toLowerCase().trim();
    let base = [...this.linhas];
    if (this.somenteComNotas) {
      base = base.filter(l => l.quantidadeNfe > 0);
    }
    if (f) {
      base = base.filter(l =>
        String(l.codigoPessoa).includes(f) ||
        (l.razao || '').toLowerCase().includes(f) ||
        (l.documento || '').toLowerCase().includes(f));
    }
    this.linhasFiltradas = base;
    this.cdr.markForCheck();
  }

  toggleLinha(g: RelatorioNfeLinha): void {
    g.expand = !g.expand;
    if (g.expand && !g.notasCarregadas) {
      this.carregarNotas(g);
    }
    this.cdr.markForCheck();
  }

  private carregarNotas(g: RelatorioNfeLinha): void {
    g.carregandoNotas = true;
    this.cdr.markForCheck();
    this.http.get<RelatorioNfeNota[]>(
      `${this.api}/NotaFiscal/Relatorio/${g.codigoPessoa}/MesAtual`,
      { headers: this.h }
    ).pipe(timeout(30000), catchError(() => of([] as RelatorioNfeNota[])))
      .subscribe(notas => {
        g.notas = notas || [];
        g.notasCarregadas = true;
        g.carregandoNotas = false;
        this.cdr.markForCheck();
      });
  }
}
