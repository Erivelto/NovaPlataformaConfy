import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { fmtDate } from '../utils/excel-export.helpers';
import { environment } from '../../environments/environment';

interface Pessoa {
  codigo: number;
  documento: string;
  nome: string;
  razao: string;
  dataInclusao: string;
  fisica: boolean;
  numeroWhats?: string;
  prefeitura?: string;
  isNovo?: boolean;
  isTop5?: boolean;
  tipoCliente?: string;
}

interface DadosEmissaoNota {
  codigoPessoa: number;
  prefeitura?: string;
}

@Component({
  selector: 'app-gestao-debitos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzToolTipModule,
    NzSelectModule, PageTitleComponent, ExportExcelButtonComponent
  ],
  template: `
    <div class="gestao-debitos">
      <app-page-title
        title="Gestão Débitos"
        subtitle="Clientes online e pessoa física">
      </app-page-title>

      <div class="kpis">
        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="team" style="color:#52c41a"></i></div>
          <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="{ width:'50px' }" [nzParagraph]="{ rows:0 }"></nz-skeleton></ng-container>
          <div class="kpi-value green" *ngIf="!loading">{{ clientes.length }}</div>
          <div class="kpi-label">Total de Clientes</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="shop" style="color:#1890ff"></i></div>
          <div class="kpi-value primary" *ngIf="!loading">{{ totalOnline }}</div>
          <div class="kpi-label">Clientes Online</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="user" style="color:#722ed1"></i></div>
          <div class="kpi-value purple" *ngIf="!loading">{{ totalFisica }}</div>
          <div class="kpi-label">Clientes Física</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="heart" style="color:#fa8c16"></i></div>
          <div class="kpi-value orange" *ngIf="!loading">{{ clientesNovos }}</div>
          <div class="kpi-label">Clientes Novos (60 dias)</div>
        </nz-card>
      </div>

      <nz-card style="margin-top:14px">
        <div class="toolbar">
          <nz-input-group [nzPrefix]="prefixSearch" class="search-input">
            <input
              nz-input
              placeholder="Buscar por documento, nome, razão ou código..."
              [(ngModel)]="filtro"
              (ngModelChange)="filtrar()" />
          </nz-input-group>
          <ng-template #prefixSearch><i nz-icon nzType="search"></i></ng-template>

          <nz-select
            class="filtro-tipo"
            [(ngModel)]="filtroTipo"
            (ngModelChange)="filtrar()"
            nzPlaceHolder="Tipo de cliente">
            <nz-option nzValue="todos" nzLabel="Todos"></nz-option>
            <nz-option nzValue="online" nzLabel="Online"></nz-option>
            <nz-option nzValue="fisica" nzLabel="Física"></nz-option>
          </nz-select>

          <button nz-button (click)="carregar()" [nzLoading]="loading">
            <i nz-icon nzType="reload"></i> Atualizar
          </button>
          <app-export-excel-button [data]="$any(clientesFiltrados)" [columns]="exportColumns" fileName="gestao-debitos" />
        </div>

        <ng-container *ngIf="loading">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 8 }"></nz-skeleton>
        </ng-container>

        <nz-table
          #clientesTable
          *ngIf="!loading"
          [nzData]="clientesFiltrados"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="clientesFiltrados.length > 15"
          [nzPageSize]="15"
          [nzFrontPagination]="true"
          [(nzPageIndex)]="pageIndex">
          <thead>
            <tr>
              <th nzWidth="80px">Código</th>
              <th nzWidth="100px">Tipo</th>
              <th nzWidth="140px">Documento</th>
              <th>Nome / Razão Social</th>
              <th nzWidth="130px">Prefeitura</th>
              <th nzWidth="130px">WhatsApp</th>
              <th nzWidth="120px">Cadastro</th>
              <th nzWidth="70px" nzAlign="center">Débitos</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of clientesTable.data">
              <td>
                <nz-tag *ngIf="c.isTop5" nzColor="green" style="margin-right:4px;font-size:10px;border-radius:8px">⭐ NOVO</nz-tag>
                <nz-tag *ngIf="c.isNovo && !c.isTop5" nzColor="blue" style="margin-right:4px;font-size:10px">NOVO</nz-tag>
                {{ c.codigo }}
              </td>
              <td>
                <nz-tag [nzColor]="c.fisica ? 'purple' : 'blue'">{{ c.tipoCliente }}</nz-tag>
              </td>
              <td>{{ c.documento || '—' }}</td>
              <td>{{ c.razao || c.nome || '—' }}</td>
              <td>
                <span *ngIf="c.prefeitura; else semPrefeitura">{{ c.prefeitura }}</span>
                <ng-template #semPrefeitura><span class="sem-dado">{{ c.fisica ? '—' : 'Sem Prefeitura' }}</span></ng-template>
              </td>
              <td>
                <span *ngIf="c.numeroWhats; else semWhats">{{ c.numeroWhats }}</span>
                <ng-template #semWhats><span class="sem-dado">Sem WhatsApp</span></ng-template>
              </td>
              <td>{{ c.dataInclusao | date:'dd/MM/yyyy' }}</td>
              <td nzAlign="center">
                <button nz-button nzType="primary" nzSize="small" nz-tooltip nzTooltipTitle="Gerenciar débitos" (click)="editar(c)">
                  <i nz-icon nzType="idcard"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="clientesFiltrados.length === 0">
              <td colspan="8" class="empty">Nenhum cliente encontrado.</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .gestao-debitos { padding: 8px 4px; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
    .kpi { flex: 1; min-width: 160px; text-align: center; }
    .kpi-icon { font-size: 24px; margin-bottom: 6px; }
    .kpi-label { color: rgba(0,0,0,.45); font-size: .88rem; margin-top: 4px; }
    .kpi-value { font-size: 1.5rem; font-weight: 800; margin: 4px 0; }
    .kpi-value.green { color: #52c41a; }
    .kpi-value.primary { color: #1890ff; }
    .kpi-value.purple { color: #722ed1; }
    .kpi-value.orange { color: #fa8c16; }
    .toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
    .search-input { max-width: 380px; flex: 1; min-width: 220px; }
    .filtro-tipo { width: 160px; }
    .sem-dado { color: #ff4d4f; font-weight: 500; }
    .empty { text-align: center; color: rgba(0,0,0,.45); padding: 32px; }
    @media (max-width: 720px) { .kpis { flex-direction: column; } }
  `]
})
export class GestaoDebitosComponent implements OnInit {
  private readonly api = environment.apiUrl;

  loading = true;
  clientes: Pessoa[] = [];
  clientesFiltrados: Pessoa[] = [];
  filtro = '';
  filtroTipo: 'todos' | 'online' | 'fisica' = 'todos';
  pageIndex = 1;

  totalOnline = 0;
  totalFisica = 0;
  clientesNovos = 0;

  readonly exportColumns: ExcelExportColumn<Pessoa>[] = [
    { key: 'codigo', title: 'Código' },
    { key: 'tipoCliente', title: 'Tipo' },
    { key: 'documento', title: 'Documento' },
    { key: 'razao', title: 'Nome / Razão Social', format: (_v, row) => row.razao || row.nome || '' },
    { key: 'prefeitura', title: 'Prefeitura' },
    { key: 'numeroWhats', title: 'WhatsApp' },
    { key: 'dataInclusao', title: 'Cadastro', format: fmtDate }
  ];

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const safe = <T>(obs: ReturnType<HttpClient['get']>) =>
      obs.pipe(timeout(8000), catchError(() => of([] as T[])));

    forkJoin({
      pessoas: safe<Pessoa>(this.http.get<Pessoa[]>(`${this.api}/Pessoa`, { headers: this.headers })),
      status: safe<Pessoa>(this.http.get<Pessoa[]>(`${this.api}/Pessoa/Status`, { headers: this.headers })),
      emissao: safe<DadosEmissaoNota>(this.http.get<DadosEmissaoNota[]>(`${this.api}/DadosEmissaoNota`, { headers: this.headers }))
    }).subscribe({
      next: ({ pessoas, status, emissao }) => {
        const emissaoMap = new Map<number, DadosEmissaoNota>();
        (emissao as DadosEmissaoNota[]).forEach(e => emissaoMap.set(e.codigoPessoa, e));

        const statusMap = new Map<number, Pessoa>();
        (status as Pessoa[]).forEach(p => statusMap.set(p.codigo, p));

        const agora = new Date();
        const merged = (pessoas as Pessoa[]).map(p => {
          const base = statusMap.get(p.codigo) ?? p;
          const diffDays = (agora.getTime() - new Date(base.dataInclusao).getTime()) / 86400000;
          const emissaoData = emissaoMap.get(base.codigo);
          return {
            ...base,
            fisica: Boolean(base.fisica),
            tipoCliente: base.fisica ? 'Física' : 'Online',
            prefeitura: base.fisica ? '' : (emissaoData?.prefeitura ?? ''),
            isNovo: diffDays < 30,
            isTop5: false
          } as Pessoa;
        });

        merged.sort((a, b) => new Date(b.dataInclusao).getTime() - new Date(a.dataInclusao).getTime());

        merged.slice(0, 5).forEach(p => {
          const diff = (agora.getTime() - new Date(p.dataInclusao).getTime()) / 86400000;
          p.isTop5 = diff <= 60;
        });

        this.clientes = merged;
        this.totalOnline = merged.filter(c => !c.fisica).length;
        this.totalFisica = merged.filter(c => c.fisica).length;
        this.clientesNovos = merged.filter(c => {
          const diff = (agora.getTime() - new Date(c.dataInclusao).getTime()) / 86400000;
          return diff < 60;
        }).length;

        this.filtrar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  filtrar(): void {
    const f = this.filtro.toLowerCase().trim();
    let base = [...this.clientes];

    if (this.filtroTipo === 'online') {
      base = base.filter(c => !c.fisica);
    } else if (this.filtroTipo === 'fisica') {
      base = base.filter(c => c.fisica);
    }

    if (f) {
      base = base.filter(c =>
        (c.razao || '').toLowerCase().includes(f) ||
        (c.nome || '').toLowerCase().includes(f) ||
        (c.documento || '').toLowerCase().includes(f) ||
        (c.tipoCliente || '').toLowerCase().includes(f) ||
        String(c.codigo).includes(f)
      );
    }

    this.clientesFiltrados = base.sort((a, b) =>
      new Date(b.dataInclusao).getTime() - new Date(a.dataInclusao).getTime()
    );
    this.pageIndex = 1;
    this.cdr.markForCheck();
  }

  editar(c: Pessoa): void {
    this.router.navigate(['/administrativo/cliente', c.codigo, 'editar-debitos']);
  }
}
