import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzInputModule } from 'ng-zorro-antd/input';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface Devedor {
  codigo: number;
  reference: string;
  transacao: string;
  dateVencimento: string;
  valorBruto: number;
  status: string;
  urlBoleto?: string;
  codigoPessoa?: number;
  razao?: string;
  documento?: string;
}

interface DevedorGrupo {
  codigoPessoa: number;
  documento: string;
  razao: string;
  valorTotal: number;
  qtdDebitos: number;
  debitos: Devedor[];
  expand: boolean;
}

@Component({
  selector: 'app-devedores-anterior',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzSkeletonModule, NzInputModule, PageTitleComponent],
  template: `
    <div class="page">
      <app-page-title title="Clientes Devedores — Todos os Meses"></app-page-title>

      <div class="tiles-row">
        <div class="tile-stats">
          <div class="count red" *ngIf="!loading">{{ valorTotal | currency:'BRL':'symbol':'1.2-2' }}</div>
          <nz-skeleton *ngIf="loading" [nzActive]="true" [nzTitle]="{width:'120px'}" [nzParagraph]="false"></nz-skeleton>
          <h3>Total</h3>
        </div>
        <div class="tile-stats" *ngIf="!loading">
          <div class="count red">{{ gruposFiltrados.length }}</div>
          <h3>Clientes</h3>
        </div>
      </div>

      <div style="margin:12px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <nz-input-group [nzPrefix]="pfx" style="max-width:360px">
          <input nz-input placeholder="Buscar razão social ou CNPJ..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
        </nz-input-group>
        <ng-template #pfx><span nz-icon nzType="search"></span></ng-template>
        <span style="color:rgba(0,0,0,.45);font-size:.88rem" *ngIf="!loading">
          {{ gruposFiltrados.length }} cliente(s) · {{ totalDebitosFiltrados }} débito(s)
        </span>
      </div>

      <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton></ng-container>
      <nz-table *ngIf="!loading"
        #tabelaGrupos
        [nzData]="gruposFiltrados"
        nzBordered
        nzSize="small"
        [nzShowPagination]="true"
        [nzPageSize]="15"
        [nzScroll]="{x:'960px'}">
        <thead>
          <tr>
            <th nzWidth="48px"></th>
            <th nzWidth="80px" [nzSortFn]="sortCodigo">Codigo</th>
            <th nzWidth="155px">CNPJ</th>
            <th>Razão Social</th>
            <th nzWidth="130px" [nzSortFn]="sortValorTotal">Total Dívida</th>
            <th nzWidth="90px" nzAlign="center" [nzSortFn]="sortQtd" nzSortOrder="descend">Débitos</th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngFor="let g of tabelaGrupos.data">
            <tr class="row-grupo" (click)="toggleGrupo(g)">
              <td [nzShowExpand]="true" [(nzExpand)]="g.expand" (click)="$event.stopPropagation()"></td>
              <td><span class="cod">{{ g.codigoPessoa }}</span></td>
              <td>{{ g.documento || '—' }}</td>
              <td>{{ g.razao || '—' }}</td>
              <td class="valor-total">{{ g.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td nzAlign="center"><nz-tag nzColor="red">{{ g.qtdDebitos }}</nz-tag></td>
            </tr>
            <tr [nzExpand]="g.expand">
              <td colspan="6" class="nested-cell">
                <nz-table [nzData]="g.debitos" nzSize="small" nzBordered [nzShowPagination]="false" class="nested-table">
                  <thead>
                    <tr>
                      <th nzWidth="130px">Vencimento</th>
                      <th nzWidth="120px">Valor</th>
                      <th nzWidth="100px" nzAlign="center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let d of g.debitos" class="row-debito">
                      <td>{{ d.dateVencimento | date:'dd/MM/yyyy' }}</td>
                      <td>{{ d.valorBruto | currency:'BRL':'symbol':'1.2-2' }}</td>
                      <td nzAlign="center">
                        <a *ngIf="d.urlBoleto" [href]="d.urlBoleto" target="_blank" rel="noopener noreferrer" class="btn-boleto" (click)="$event.stopPropagation()">Boleto</a>
                        <span *ngIf="!d.urlBoleto" class="sem-boleto">—</span>
                      </td>
                    </tr>
                  </tbody>
                </nz-table>
              </td>
            </tr>
          </ng-container>
          <tr *ngIf="gruposFiltrados.length===0">
            <td colspan="6" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">
              Nenhum devedor encontrado.
            </td>
          </tr>
        </tbody>
      </nz-table>
    </div>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .tiles-row { display: flex; gap: 16px; flex-wrap: wrap; margin: 12px 0; }
    .tile-stats { background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; padding: 20px 32px; min-width: 180px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .tile-stats .count { font-size: 2rem; font-weight: 800; line-height: 1; margin-bottom: 4px; }
    .tile-stats .count.red { color: #ff4d4f; }
    .tile-stats h3 { color: rgba(0,0,0,.55); font-size: .95rem; margin: 0; font-weight: 500; }
    .row-grupo { cursor: pointer; }
    .row-grupo td { color: #ff4d4f !important; font-weight: 500; }
    .row-grupo:hover td { background: #fff1f0 !important; }
    .row-grupo .cod { font-weight: 700; }
    .row-grupo .valor-total { font-weight: 700; font-size: 1rem; }
    .nested-cell { padding: 8px 12px 12px 48px !important; background: #fafafa; }
    .nested-table { margin: 0; }
    .row-debito td { color: #cf1322 !important; font-weight: 500; }
    .sem-boleto { color: rgba(0,0,0,.35); }
    .btn-boleto { display:inline-block;padding:4px 14px;background:#1890ff;color:#fff;border-radius:20px;font-size:.85rem;font-weight:500;text-decoration:none; }
    .btn-boleto:hover { background:#40a9ff;color:#fff; }
  `]
})
export class DevedoresAnteriorComponent implements OnInit {
  private readonly api = environment.apiUrl;
  loading = true;
  lista: Devedor[] = [];
  grupos: DevedorGrupo[] = [];
  gruposFiltrados: DevedorGrupo[] = [];
  filtro = '';
  valorTotal = 0;
  totalDebitosFiltrados = 0;

  sortCodigo = (a: DevedorGrupo, b: DevedorGrupo) => a.codigoPessoa - b.codigoPessoa;
  sortValorTotal = (a: DevedorGrupo, b: DevedorGrupo) => a.valorTotal - b.valorTotal;
  sortQtd = (a: DevedorGrupo, b: DevedorGrupo) => a.qtdDebitos - b.qtdDebitos;

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.carregar(); }

  carregar() {
    this.loading = true;
    const safe = <T>(o: any) => o.pipe(timeout(12000), catchError(() => of([] as T[])));
    forkJoin({
      cobrancas: safe<Devedor>(this.http.get<Devedor[]>(`${this.api}/PessoaCobranca/ObterPagamentoVencido`, { headers: this.h })),
      pessoas: safe<any>(this.http.get<any[]>(`${this.api}/Pessoa`, { headers: this.h }))
    }).subscribe({
      next: ({ cobrancas, pessoas }) => {
        const pm = new Map<string, any>();
        (pessoas as any[]).forEach(p => { if (p.documento) pm.set(p.documento, p); });
        this.lista = (cobrancas as Devedor[])
          .map(c => {
            const p = pm.get(c.reference);
            return { ...c, codigoPessoa: p?.codigo, razao: p?.razao, documento: c.reference };
          })
          .filter(c => c.codigoPessoa);
        this.grupos = this.agruparPorCliente(this.lista);
        this.valorTotal = this.grupos.reduce((s, g) => s + g.valorTotal, 0);
        this.filtrar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  private agruparPorCliente(lista: Devedor[]): DevedorGrupo[] {
    const map = new Map<number, DevedorGrupo>();
    for (const d of lista) {
      const key = d.codigoPessoa!;
      if (!map.has(key)) {
        map.set(key, {
          codigoPessoa: key,
          documento: d.documento || '',
          razao: d.razao || '',
          valorTotal: 0,
          qtdDebitos: 0,
          debitos: [],
          expand: false
        });
      }
      const g = map.get(key)!;
      g.debitos.push(d);
      g.valorTotal += d.valorBruto || 0;
      g.qtdDebitos++;
    }
    for (const g of map.values()) {
      g.debitos.sort((a, b) => (b.valorBruto || 0) - (a.valorBruto || 0));
    }
    return [...map.values()]
      .filter(g => g.qtdDebitos > 1)
      .sort((a, b) => b.qtdDebitos - a.qtdDebitos || b.valorTotal - a.valorTotal);
  }

  filtrar() {
    const f = this.filtro.toLowerCase().trim();
    const base = f
      ? this.grupos.filter(g =>
          (g.razao || '').toLowerCase().includes(f) ||
          (g.documento || '').includes(f) ||
          String(g.codigoPessoa).includes(f))
      : [...this.grupos];
    this.gruposFiltrados = base.sort((a, b) => b.qtdDebitos - a.qtdDebitos || b.valorTotal - a.valorTotal);
    this.totalDebitosFiltrados = this.gruposFiltrados.reduce((s, g) => s + g.qtdDebitos, 0);
    this.cdr.markForCheck();
  }

  toggleGrupo(g: DevedorGrupo) {
    g.expand = !g.expand;
    this.cdr.markForCheck();
  }
}
