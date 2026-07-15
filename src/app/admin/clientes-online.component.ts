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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ClienteMensagemRef, MensagemClienteLoteComponent } from '../components/mensagem-cliente-lote.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { fmtDate } from '../utils/excel-export.helpers';
import { LoginService } from '../services/login.service';
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
}

interface DadosEmissaoNota {
  codigoPessoa: number;
  prefeitura?: string;
  [key: string]: any;
}

interface PessoaCobranca {
  codigoPessoa?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-clientes-online',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTableModule, NzTagModule, NzIconModule,
    NzButtonModule, NzSkeletonModule, NzInputModule, NzToolTipModule,
    NzModalModule, NzMessageModule, NzFormModule, NzSelectModule, NzCheckboxModule,
    PageTitleComponent, ExportExcelButtonComponent, MensagemClienteLoteComponent
  ],
  template: `
    <div class="clientes-online">
      <app-page-title title="Clientes Online" subtitle="Clientes Plataforma">
        <app-export-excel-button
          [data]="$any(clientesFiltrados)"
          [columns]="exportColumns"
          fileName="clientes-online"
          [loading]="loading" />
      </app-page-title>

      <!-- KPIs -->
      <div class="kpis">
        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="user" style="color:#52c41a"></i></div>
          <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="{ width:'50px' }" [nzParagraph]="{ rows:0 }"></nz-skeleton></ng-container>
          <div class="kpi-value green" *ngIf="!loading">{{ clientes.length }}</div>
          <div class="kpi-label">Clientes Ativos</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="heart" style="color:#1890ff"></i></div>
          <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="{ width:'50px' }" [nzParagraph]="{ rows:0 }"></nz-skeleton></ng-container>
          <div class="kpi-value primary" *ngIf="!loading">{{ clientesNovos }}</div>
          <div class="kpi-label">Clientes Novos</div>
        </nz-card>

        <nz-card class="kpi" nzBordered>
          <div class="kpi-icon"><i nz-icon nzType="dollar" style="color:#ff4d4f"></i></div>
          <ng-container *ngIf="loading"><nz-skeleton [nzActive]="true" [nzTitle]="{ width:'50px' }" [nzParagraph]="{ rows:0 }"></nz-skeleton></ng-container>
          <div class="kpi-value red" *ngIf="!loading">{{ inadimplentes }}</div>
          <div class="kpi-label">Devedores</div>
        </nz-card>

        <nz-card class="kpi kpi-action" nzBordered (click)="abrirModalAdicionar()">
          <div class="kpi-icon"><i nz-icon nzType="plus-circle" style="color:#722ed1"></i></div>
          <div class="kpi-value purple"><button nz-button nzType="primary" nzShape="round" nzSize="small"><i nz-icon nzType="plus"></i></button></div>
          <div class="kpi-label">Novo Cliente</div>
        </nz-card>
      </div>

      <!-- Tabela -->
      <nz-card style="margin-top:14px">
        <div style="margin-bottom:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <nz-input-group [nzPrefix]="prefixSearch" style="max-width:380px">
            <input nz-input placeholder="Buscar por CNPJ, razão social ou código..." [(ngModel)]="filtro" (ngModelChange)="filtrar()" />
          </nz-input-group>
          <ng-template #prefixSearch><i nz-icon nzType="search"></i></ng-template>
          <nz-select
            [(ngModel)]="filtroPrefeitura"
            (ngModelChange)="filtrar()"
            nzShowSearch
            nzAllowClear
            nzPlaceHolder="Filtrar por prefeitura"
            style="min-width:220px">
            <nz-option nzValue="" nzLabel="Todas as prefeituras"></nz-option>
            <nz-option *ngFor="let p of prefeiturasOpcoes" [nzValue]="p" [nzLabel]="p"></nz-option>
            <nz-option nzValue="__sem__" nzLabel="Sem Prefeitura"></nz-option>
          </nz-select>
          <button
            nz-button
            nzType="default"
            [disabled]="selecionados.size === 0"
            (click)="abrirMensagemLote()">
            <i nz-icon nzType="message"></i>
            Mensagem ao Cliente
            <span *ngIf="selecionados.size > 0">({{ selecionados.size }})</span>
          </button>
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
              <th nzWidth="48px" nzAlign="center">
                <label
                  nz-checkbox
                  [ngModel]="todosSelecionados"
                  [nzIndeterminate]="selecaoParcial"
                  (ngModelChange)="toggleSelecionarTodos($event)"></label>
              </th>
              <th nzWidth="90px">Código</th>
              <th nzWidth="150px">CNPJ</th>
              <th>Razão Social</th>
              <th nzWidth="140px">Prefeitura</th>
              <th nzWidth="130px">WhatsApp</th>
              <th nzWidth="132px" nzAlign="center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of clientesTable.data">
              <td nzAlign="center">
                <label
                  nz-checkbox
                  [ngModel]="estaSelecionado(c.codigo)"
                  (ngModelChange)="toggleSelecao(c.codigo, $event)"></label>
              </td>
              <td>
                <nz-tag *ngIf="c.isTop5" nzColor="green" style="margin-right:4px;font-size:10px;border-radius:8px">⭐ NOVO</nz-tag>
                <nz-tag *ngIf="c.isNovo && !c.isTop5" nzColor="blue" style="margin-right:4px;font-size:10px">NOVO</nz-tag>
                {{ c.codigo }}
              </td>
              <td>{{ c.documento || '—' }}</td>
              <td>{{ c.razao || '—' }}</td>
              <td>
                <span *ngIf="c.prefeitura; else semPrefeitura">{{ c.prefeitura }}</span>
                <ng-template #semPrefeitura><span class="sem-dado">Sem Prefeitura</span></ng-template>
              </td>
              <td>
                <span *ngIf="c.numeroWhats; else semWhats">{{ c.numeroWhats }}</span>
                <ng-template #semWhats><span class="sem-dado">Sem WhatsApp</span></ng-template>
              </td>
              <td nzAlign="center" class="acoes-cell">
                <button nz-button nzType="default" nzSize="small" nz-tooltip nzTooltipTitle="Faturamento" (click)="faturamento(c)">
                  <i nz-icon nzType="bar-chart"></i>
                </button>
                <button nz-button nzType="primary" nzSize="small" nz-tooltip nzTooltipTitle="Editar" (click)="editar(c)">
                  <i nz-icon nzType="edit"></i>
                </button>
                <button nz-button nzDanger nzSize="small" nz-tooltip nzTooltipTitle="Cancelar cliente" (click)="abrirModalCancelamento(c)">
                  <i nz-icon nzType="close-circle"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="clientesFiltrados.length === 0">
              <td colspan="7" style="text-align:center;color:rgba(0,0,0,0.45);padding:32px">
                Nenhum cliente encontrado.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <!-- Modal Cancelamento -->
    <nz-modal
      [(nzVisible)]="cancelamentoVisible"
      nzTitle="Cancelamento de Cliente"
      [nzWidth]="480"
      [nzFooter]="footerCancelamento"
      (nzOnCancel)="fecharModalCancelamento()">
      <ng-container *nzModalContent>
        <p *ngIf="clienteSelecionado" style="margin-bottom:16px">
          Cliente: <strong>{{ clienteSelecionado.razao || clienteSelecionado.nome }}</strong> ({{ clienteSelecionado.documento }})
        </p>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Motivo do cancelamento</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-select [(ngModel)]="cancelMotivo" nzPlaceHolder="Selecione o motivo" style="width:100%">
              <nz-option *ngFor="let m of motivosCancelamento" [nzValue]="m" [nzLabel]="m"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      </ng-container>
      <ng-template #footerCancelamento>
        <button nz-button (click)="fecharModalCancelamento()" [disabled]="salvando">Fechar</button>
        <button nz-button nzDanger (click)="salvarCancelamento()" [nzLoading]="salvando">Cancelar Cliente</button>
      </ng-template>
    </nz-modal>

    <!-- Modal Novo Cliente -->
    <nz-modal
      [(nzVisible)]="adicionarVisible"
      nzTitle="Novo Cliente"
      [nzWidth]="520"
      [nzFooter]="footerAdicionar"
      (nzOnCancel)="fecharModalAdicionar()">
      <ng-container *nzModalContent>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>CNPJ</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <input nz-input [(ngModel)]="novoCliente.cnpj" placeholder="00.000.000/0000-00" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label [nzSpan]="24">Celular</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <input nz-input [(ngModel)]="novoCliente.celular" placeholder="(00) 00000-0000" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>E-mail</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <input nz-input [(ngModel)]="novoCliente.email" placeholder="email@empresa.com.br" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Razão Social</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <input nz-input [(ngModel)]="novoCliente.razao" placeholder="Razão Social da empresa" />
          </nz-form-control>
        </nz-form-item>
      </ng-container>
      <ng-template #footerAdicionar>
        <button nz-button (click)="fecharModalAdicionar()" [disabled]="salvando">Fechar</button>
        <button nz-button nzType="primary" (click)="salvarNovoCliente()" [nzLoading]="salvando">Salvar</button>
      </ng-template>
    </nz-modal>

    <app-mensagem-cliente-lote
      [(visible)]="mensagemVisible"
      [clientes]="clientesMensagem"
      (envioConcluido)="limparSelecao()" />
  `,
  styles: [`
    .clientes-online { padding: 8px 4px; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
    .kpi { flex: 1; min-width: 180px; text-align: center; }
    .kpi-icon { font-size: 26px; margin-bottom: 6px; }
    .kpi-label { color: rgba(0,0,0,0.45); font-size: 0.88rem; margin-top: 4px; }
    .kpi-value { font-size: 1.6rem; font-weight: 800; margin: 4px 0; }
    .kpi-value.green { color: #52c41a; }
    .kpi-value.primary { color: #1890ff; }
    .kpi-value.red { color: #ff4d4f; }
    .kpi-value.purple { color: #722ed1; }
    .kpi-action { cursor: pointer; transition: box-shadow .2s; }
    .kpi-action:hover { box-shadow: 0 4px 16px rgba(114,46,209,.2); }
    .sem-dado { color: #ff4d4f; font-weight: 500; }
    .acoes-cell { white-space: nowrap; }
    .acoes-cell .ant-btn { margin: 0 2px; }
    @media(max-width:720px) { .kpis { flex-direction: column; } }
  `]
})
export class ClientesOnlineComponent implements OnInit {
  private readonly api = environment.apiUrl;

  loading = true;
  clientes: Pessoa[] = [];
  clientesFiltrados: Pessoa[] = [];
  filtro = '';
  filtroPrefeitura = '';
  prefeiturasOpcoes: string[] = [];
  pageIndex = 1;
  clientesNovos = 0;
  inadimplentes = 0;
  salvando = false;

  // Modal cancelamento
  cancelamentoVisible = false;
  clienteSelecionado: Pessoa | null = null;
  cancelMotivo = '';
  readonly motivosCancelamento = [
    'Mudança de Contabilidade',
    'Inadimplente',
    'Fora do Simples',
    'Fechamento da Empresa'
  ];

  // Modal novo cliente
  adicionarVisible = false;
  novoCliente = { cnpj: '', celular: '', email: '', razao: '' };

  selecionados = new Set<number>();
  mensagemVisible = false;
  clientesMensagem: ClienteMensagemRef[] = [];

  readonly exportColumns: ExcelExportColumn<Pessoa>[] = [
    { key: 'codigo', title: 'Código' },
    { key: 'documento', title: 'CNPJ' },
    { key: 'razao', title: 'Razão Social' },
    { key: 'prefeitura', title: 'Prefeitura' },
    { key: 'numeroWhats', title: 'WhatsApp' },
    { key: 'dataInclusao', title: 'Data Cadastro', format: fmtDate }
  ];

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  constructor(
    private http: HttpClient,
    private loginService: LoginService,
    private router: Router,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    const safe = <T>(obs: any) => obs.pipe(timeout(8000), catchError(() => of([] as T[])));

    forkJoin({
      pessoas:  safe<Pessoa>(this.http.get<Pessoa[]>(`${this.api}/Pessoa`, { headers: this.headers })),
      status:   safe<Pessoa>(this.http.get<Pessoa[]>(`${this.api}/Pessoa/Status`, { headers: this.headers })),
      emissao:  safe<DadosEmissaoNota>(this.http.get<DadosEmissaoNota[]>(`${this.api}/DadosEmissaoNota`, { headers: this.headers })),
      naoPagos: safe<PessoaCobranca>(this.http.get<PessoaCobranca[]>(`${this.api}/PessoaCobranca/ObterNaoPagos`, { headers: this.headers }))
    }).subscribe({
      next: ({ pessoas, status, emissao, naoPagos }) => {
        const emissaoMap = new Map<number, DadosEmissaoNota>();
        (emissao as DadosEmissaoNota[]).forEach(e => emissaoMap.set(e.codigoPessoa, e));

        // Merge: prefere dados de /Status quando o mesmo codigo existir (igual ao getPessoa() do legado)
        const statusMap = new Map<number, Pessoa>();
        (status as Pessoa[]).filter(p => !p.fisica).forEach(p => statusMap.set(p.codigo, p));
        const listGeral = (pessoas as Pessoa[]).filter(p => !p.fisica);
        const merged = listGeral.map(p => statusMap.get(p.codigo) ?? p);

        const agora = new Date();

        const listMapeada = merged.map(p => {
            const diffDays = (agora.getTime() - new Date(p.dataInclusao).getTime()) / (1000 * 60 * 60 * 24);
            const emissaoData = emissaoMap.get(p.codigo);
            return {
              ...p,
              prefeitura: emissaoData?.prefeitura ?? '',
              isNovo: diffDays < 30,
              isTop5: false
            };
          });

        // Ordena: mais recentes primeiro
        listMapeada.sort((a, b) => new Date(b.dataInclusao).getTime() - new Date(a.dataInclusao).getTime());

        // Marca os 5 primeiros com até 60 dias de cadastro como destaque
        listMapeada.slice(0, 5).forEach(p => {
          const diff = (agora.getTime() - new Date(p.dataInclusao).getTime()) / 86400000;
          p.isTop5 = diff <= 60;
        });

        this.clientes = listMapeada;
        this.atualizarOpcoesPrefeitura();

        this.clientesNovos = this.clientes.filter(c => {
          const diff = (agora.getTime() - new Date(c.dataInclusao).getTime()) / (1000 * 60 * 60 * 24);
          return diff < 60;
        }).length;

        this.inadimplentes = Array.isArray(naoPagos) ? (naoPagos as any[]).length : 0;
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

  private atualizarOpcoesPrefeitura(): void {
    const set = new Set<string>();
    this.clientes.forEach(c => {
      const p = c.prefeitura?.trim();
      if (p) set.add(p);
    });
    this.prefeiturasOpcoes = [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  private passaFiltroPrefeitura(c: Pessoa): boolean {
    const filtro = this.filtroPrefeitura ?? '';
    if (!filtro) return true;
    if (filtro === '__sem__') return !c.prefeitura?.trim();
    return (c.prefeitura || '').trim() === filtro;
  }

  filtrar(): void {
    const f = this.filtro.toLowerCase().trim();
    let base = f
      ? this.clientes.filter(c =>
          c.razao?.toLowerCase().includes(f) ||
          c.nome?.toLowerCase().includes(f) ||
          c.documento?.toLowerCase().includes(f) ||
          String(c.codigo).includes(f))
      : [...this.clientes];
    base = base.filter(c => this.passaFiltroPrefeitura(c));
    // mantém ordenação: mais recentes primeiro
    this.clientesFiltrados = base.sort((a, b) =>
      new Date(b.dataInclusao).getTime() - new Date(a.dataInclusao).getTime());
    this.pageIndex = 1;
    this.cdr.markForCheck();
  }

  editar(c: Pessoa): void {
    this.router.navigate(['/administrativo/cliente', c.codigo, 'editar']);
  }

  faturamento(c: Pessoa): void {
    this.router.navigate(['/administrativo/cliente', c.codigo, 'faturamento'], {
      queryParams: { origem: 'clientes' }
    });
  }

  estaSelecionado(codigo: number): boolean {
    return this.selecionados.has(codigo);
  }

  toggleSelecao(codigo: number, checked: boolean): void {
    if (checked) this.selecionados.add(codigo);
    else this.selecionados.delete(codigo);
    this.cdr.markForCheck();
  }

  get todosSelecionados(): boolean {
    return this.clientesFiltrados.length > 0
      && this.clientesFiltrados.every(c => this.selecionados.has(c.codigo));
  }

  get selecaoParcial(): boolean {
    const n = this.clientesFiltrados.filter(c => this.selecionados.has(c.codigo)).length;
    return n > 0 && n < this.clientesFiltrados.length;
  }

  toggleSelecionarTodos(checked: boolean): void {
    if (checked) this.clientesFiltrados.forEach(c => this.selecionados.add(c.codigo));
    else this.clientesFiltrados.forEach(c => this.selecionados.delete(c.codigo));
    this.cdr.markForCheck();
  }

  abrirMensagemLote(): void {
    this.clientesMensagem = this.clientes
      .filter(c => this.selecionados.has(c.codigo))
      .map(c => ({ codigo: c.codigo, nome: c.razao || c.nome || String(c.codigo) }));
    this.mensagemVisible = true;
    this.cdr.markForCheck();
  }

  limparSelecao(): void {
    this.selecionados.clear();
    this.cdr.markForCheck();
  }

  // --- Modal Cancelamento ---
  abrirModalCancelamento(c: Pessoa): void {
    this.clienteSelecionado = c;
    this.cancelMotivo = '';
    this.cancelamentoVisible = true;
    this.cdr.markForCheck();
  }

  fecharModalCancelamento(): void {
    this.cancelamentoVisible = false;
    this.clienteSelecionado = null;
    this.cdr.markForCheck();
  }

  salvarCancelamento(): void {
    if (!this.cancelMotivo.trim()) {
      this.message.warning('Selecione o motivo do cancelamento.');
      return;
    }
    this.salvando = true;
    this.cdr.markForCheck();

    const codigo = this.clienteSelecionado!.codigo;

    this.http.put(`${this.api}/Pessoa/Cancelar`, {
      codigo,
      motivoExcluido: this.cancelMotivo
    }, { headers: this.headers }).subscribe({
      next: () => {
        this.message.success('Cliente cancelado com sucesso.');
        this.clientes = this.clientes.filter(c => c.codigo !== codigo);
        this.filtrar();
        this.salvando = false;
        this.cancelamentoVisible = false;
        this.clienteSelecionado = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.message.error(`Erro ao cancelar cliente (${err.status ?? 'sem resposta'}).`);
        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // --- Modal Novo Cliente ---
  abrirModalAdicionar(): void {
    this.novoCliente = { cnpj: '', celular: '', email: '', razao: '' };
    this.adicionarVisible = true;
    this.cdr.markForCheck();
  }

  fecharModalAdicionar(): void {
    this.adicionarVisible = false;
    this.cdr.markForCheck();
  }

  salvarNovoCliente(): void {
    if (!this.novoCliente.cnpj.trim() || !this.novoCliente.email.trim() || !this.novoCliente.razao.trim()) {
      this.message.warning('Preencha CNPJ, e-mail e razão social.');
      return;
    }
    this.salvando = true;
    this.cdr.markForCheck();

    // Igual ao legado: GET /api/Contratacao/MudarDeContador?cnpj=&nome=&email=&celular=
    const params = new URLSearchParams({
      cnpj:    this.novoCliente.cnpj.trim(),
      nome:    this.novoCliente.razao.trim(),
      email:   this.novoCliente.email.trim(),
      celular: this.novoCliente.celular.trim()
    });

    this.http.get(`${this.api}/Contratacao/MudarDeContador?${params}`, { headers: this.headers }).subscribe({
      next: () => {
        this.message.success('Cliente adicionado com sucesso!');
        this.salvando = false;
        this.adicionarVisible = false;
        this.carregar();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.message.error(`Erro ao adicionar cliente (${err.status}).`);
        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }
}
