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
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

interface PessoaExcluida {
  codigo: number;
  documento: string;
  nome: string;
  razao: string;
  dataInclusao: string;
  dataCancelamento?: string | null;
  dataAtulizacao?: string | null;
  motivoExcluido?: string | null;
  fisica: boolean;
  excluido: boolean;
  numeroWhats?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-clientes-excluidos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzToolTipModule,
    NzModalModule, NzMessageModule,
    PageTitleComponent
  ],
  template: `
    <div class="page">
      <app-page-title title="Clientes Excluídos" subtitle="Clientes online e pessoa física cancelados"></app-page-title>

      <div class="kpis">
        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="user" style="color:#ff4d4f"></i></div>
          <ng-container *ngIf="loading">
            <nz-skeleton [nzActive]="true" [nzTitle]="{ width: '50px' }" [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </ng-container>
          <div class="kpi-value red" *ngIf="!loading">{{ clientes.length }}</div>
          <div class="kpi-label">Total Excluídos</div>
        </nz-card>
        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="team" style="color:#1890ff"></i></div>
          <div class="kpi-value primary" *ngIf="!loading">{{ totalOnline }}</div>
          <div class="kpi-label">Online</div>
        </nz-card>
        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="idcard" style="color:#722ed1"></i></div>
          <div class="kpi-value purple" *ngIf="!loading">{{ totalFisica }}</div>
          <div class="kpi-label">Pessoa Física</div>
        </nz-card>
      </div>

      <nz-card style="margin-top:14px">
        <div style="margin-bottom:12px">
          <nz-input-group [nzPrefix]="pfx" style="max-width:420px">
            <input nz-input placeholder="Buscar por documento, nome, código ou motivo..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
          </nz-input-group>
          <ng-template #pfx><i nz-icon nzType="search"></i></ng-template>
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
              <th nzWidth="150px">Documento</th>
              <th>Nome / Razão Social</th>
              <th nzWidth="130px">Data Cancelamento</th>
              <th nzWidth="200px">Motivo</th>
              <th nzWidth="110px" nzAlign="center">Reativar</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of clientesTable.data">
              <td>{{ c.codigo }}</td>
              <td>
                <nz-tag [nzColor]="c.fisica ? 'purple' : 'blue'">{{ c.fisica ? 'Física' : 'Online' }}</nz-tag>
              </td>
              <td>{{ c.documento || '—' }}</td>
              <td>{{ c.razao || c.nome || '—' }}</td>
              <td>{{ dataCancelamentoExibicao(c) ? (dataCancelamentoExibicao(c) | date:'dd/MM/yyyy') : '—' }}</td>
              <td>
                <nz-tag [nzColor]="corMotivo(c.motivoExcluido)">{{ c.motivoExcluido || '—' }}</nz-tag>
              </td>
              <td nzAlign="center">
                <button nz-button nzType="primary" nzSize="small" nz-tooltip nzTooltipTitle="Reativar cliente" (click)="abrirReativacao(c)">
                  <i nz-icon nzType="redo"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="clientesFiltrados.length === 0">
              <td colspan="7" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">Nenhum cliente excluído encontrado.</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <nz-modal
      [(nzVisible)]="reativarVisible"
      nzTitle="Reativar cliente"
      [nzWidth]="460"
      [nzFooter]="ftReativar"
      (nzOnCancel)="fecharReativacao()">
      <ng-container *nzModalContent>
        <p *ngIf="selecionado">
          Deseja reativar <strong>{{ selecionado.razao || selecionado.nome }}</strong>?
        </p>
        <p *ngIf="selecionado?.motivoExcluido" style="color:rgba(0,0,0,.55);margin-top:8px">
          Motivo do cancelamento: <strong>{{ selecionado?.motivoExcluido }}</strong>
        </p>
        <p style="color:rgba(0,0,0,.45);font-size:13px;margin-top:12px">
          O cliente voltará a aparecer na lista de clientes ativos.
        </p>
      </ng-container>
      <ng-template #ftReativar>
        <button nz-button (click)="fecharReativacao()" [disabled]="salvando">Cancelar</button>
        <button nz-button nzType="primary" (click)="confirmarReativacao()" [nzLoading]="salvando">Reativar</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
    .kpi { flex: 1; min-width: 160px; text-align: center; }
    .kpi-icon { font-size: 24px; margin-bottom: 6px; }
    .kpi-label { color: rgba(0,0,0,.45); font-size: .88rem; margin-top: 4px; }
    .kpi-value { font-size: 1.5rem; font-weight: 800; margin: 4px 0; }
    .kpi-value.red { color: #ff4d4f; }
    .kpi-value.primary { color: #1890ff; }
    .kpi-value.purple { color: #722ed1; }
    @media(max-width:720px) { .kpis { flex-direction: column; } }
  `]
})
export class ClientesExcluidosComponent implements OnInit {
  private readonly api = environment.apiUrl;

  loading = true;
  salvando = false;
  clientes: PessoaExcluida[] = [];
  clientesFiltrados: PessoaExcluida[] = [];
  filtro = '';
  pageIndex = 1;
  totalOnline = 0;
  totalFisica = 0;

  reativarVisible = false;
  selecionado: PessoaExcluida | null = null;

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  constructor(
    private http: HttpClient,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.http.get<PessoaExcluida[]>(`${this.api}/Pessoa/Excluidos`, { headers: this.headers })
      .pipe(timeout(8000), catchError(() => of([] as PessoaExcluida[])))
      .subscribe({
        next: (lista) => {
          this.clientes = this.ordenarPorDataRecente((lista ?? []).map(p => this.normalize(p)));
          this.totalOnline = this.clientes.filter(c => !c.fisica).length;
          this.totalFisica = this.clientes.filter(c => c.fisica).length;
          this.clientesFiltrados = [...this.clientes];
          this.pageIndex = 1;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.message.error('Erro ao carregar clientes excluídos.');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  filtrar(): void {
    const f = this.filtro.toLowerCase().trim();
    this.clientesFiltrados = f
      ? this.clientes.filter(c =>
          c.razao?.toLowerCase().includes(f) ||
          c.nome?.toLowerCase().includes(f) ||
          c.documento?.toLowerCase().includes(f) ||
          c.motivoExcluido?.toLowerCase().includes(f) ||
          String(c.codigo).includes(f))
      : [...this.clientes];
    this.pageIndex = 1;
    this.cdr.markForCheck();
  }

  corMotivo(motivo?: string | null): string {
    switch (motivo) {
      case 'Inadimplente': return 'red';
      case 'Mudança de Contabilidade': return 'blue';
      case 'Fora do Simples': return 'orange';
      case 'Fechamento da Empresa': return 'default';
      default: return 'default';
    }
  }

  dataCancelamentoExibicao(c: PessoaExcluida): string | null {
    return c.dataCancelamento ?? c.dataAtulizacao ?? null;
  }

  private ordenarPorDataRecente(lista: PessoaExcluida[]): PessoaExcluida[] {
    return [...lista].sort((a, b) => {
      const diff = this.dataReferenciaOrdenacao(b) - this.dataReferenciaOrdenacao(a);
      return diff !== 0 ? diff : b.codigo - a.codigo;
    });
  }

  private dataReferenciaOrdenacao(c: PessoaExcluida): number {
    const data = this.dataCancelamentoExibicao(c);
    return data ? new Date(data).getTime() : 0;
  }

  abrirReativacao(c: PessoaExcluida): void {
    this.selecionado = c;
    this.reativarVisible = true;
    this.cdr.markForCheck();
  }

  fecharReativacao(): void {
    this.reativarVisible = false;
    this.selecionado = null;
    this.cdr.markForCheck();
  }

  confirmarReativacao(): void {
    if (!this.selecionado) return;

    this.salvando = true;
    this.cdr.markForCheck();

    const payload = {
      ...this.selecionado,
      excluido: false,
      Excluido: false,
      motivoExcluido: null,
      MotivoExcluido: null,
      dataCancelamento: null,
      DataCancelamento: null
    };

    this.http.put(`${this.api}/Pessoa`, payload, { headers: this.headers }).subscribe({
      next: () => {
        this.message.success('Cliente reativado com sucesso.');
        this.clientes = this.clientes.filter(c => c.codigo !== this.selecionado!.codigo);
        this.totalOnline = this.clientes.filter(c => !c.fisica).length;
        this.totalFisica = this.clientes.filter(c => c.fisica).length;
        this.filtrar();
        this.salvando = false;
        this.fecharReativacao();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.message.error(`Erro ao reativar cliente (${err.status}).`);
        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }

  private normalize(raw: Record<string, unknown>): PessoaExcluida {
    return {
      ...raw,
      codigo: (raw['codigo'] ?? raw['Codigo']) as number,
      documento: (raw['documento'] ?? raw['Documento'] ?? '') as string,
      nome: (raw['nome'] ?? raw['Nome'] ?? '') as string,
      razao: (raw['razao'] ?? raw['Razao'] ?? '') as string,
      dataInclusao: (raw['dataInclusao'] ?? raw['DataInclusao'] ?? '') as string,
      dataCancelamento: (raw['dataCancelamento'] ?? raw['DataCancelamento'] ?? null) as string | null,
      dataAtulizacao: (raw['dataAtulizacao'] ?? raw['DataAtulizacao'] ?? raw['dataAtualizacao'] ?? raw['DataAtualizacao'] ?? null) as string | null,
      motivoExcluido: (raw['motivoExcluido'] ?? raw['MotivoExcluido'] ?? null) as string | null,
      fisica: (raw['fisica'] ?? raw['Fisica'] ?? false) as boolean,
      excluido: (raw['excluido'] ?? raw['Excluido'] ?? true) as boolean,
      numeroWhats: (raw['numeroWhats'] ?? raw['NumeroWhats'] ?? '') as string
    };
  }
}
