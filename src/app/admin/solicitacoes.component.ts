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
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { PageTitleComponent } from '../page-title.component';
import { LoginService } from '../services/login.service';
import { environment } from '../../environments/environment';

const ARQUIVO_BASE_URL = 'https://armazenamento.contfy.com.br/Arquivos/Resultado';

const TIPOS_SOLICITACAO = [
  'Erro na Plataforma',
  'Imposto de Renda',
  'Alteração na Empresa',
  'Problemas no Pagamento',
  'Atualização guia pagamento',
  'Solitação de Documento',
  'Envio de Documento',
  'Problema com Impostos',
  'Problema com Nota Fiscal',
  'Outros'
];

const AREAS = ['Contabilidade', 'TI'];

const ATENDENTES = [
  { email: 'amanda@contfy.com', nome: 'Amanda' },
  { email: 'barbara@contfy.com', nome: 'Barbara' },
  { email: 'beatriz@contfy.com', nome: 'Beatriz' },
  { email: 'diego@contfy.com', nome: 'Diego' },
  { email: 'dionathan@contfy.com', nome: 'Dionathan' },
  { email: 'fabio@contfy.com', nome: 'Fabio' },
  { email: 'fabricio@contfy.com', nome: 'Fabricio' },
  { email: 'gilvan@contfy.com', nome: 'Gilvan' },
  { email: 'laerte@contfy.com', nome: 'Laerte' },
  { email: 'thaina@contfy.com', nome: 'Thaina' }
];

interface Chamado {
  id: number;
  codigoPessoa: number;
  atendente: string;
  solicitante: string;
  titulo: string;
  mensagem: string;
  dataCriacao: string;
  status: string;
  prioridade: number;
  tipo: string;
  slaTempo?: number;
  razao?: string;
}

interface ChamadoHistorico {
  id?: number;
  chamadoId: number;
  usuario: string;
  descricao: string;
  dataHistorico: string;
}

interface ChamadoUpload {
  codigo: number;
  chamadoId: number;
  dataCriacao: string;
  arquivo: string;
  tipo: string;
}

interface FormAtendimento {
  codigoPessoa: number;
  prioridade: number;
  titulo: string;
  tipo: string;
  status: string;
  atendente: string;
  mensagem: string;
  detalhamento: string;
}

@Component({
  selector: 'app-solicitacoes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTableModule, NzTagModule, NzIconModule, NzButtonModule,
    NzSkeletonModule, NzInputModule, NzToolTipModule, NzModalModule, NzMessageModule,
    NzFormModule, NzSelectModule, NzDividerModule, NzGridModule, NzUploadModule, PageTitleComponent
  ],
  template: `
    <div class="page">
      <app-page-title title="Solicitações Lista" subtitle="Atendimento, interação e conclusão dos chamados dos clientes"></app-page-title>

      <div class="kpis">
        <nz-card class="kpi" *ngFor="let k of kpiStats; trackBy: trackByKpi">
          <div class="kpi-icon"><i nz-icon [nzType]="k.icon" [style.color]="k.color"></i></div>
          <div class="kpi-value" [style.color]="k.color" *ngIf="!loading">{{ k.value }}</div>
          <div class="kpi-label">{{ k.label }}</div>
        </nz-card>
      </div>

      <nz-card style="margin-top:14px">
        <div class="toolbar">
          <nz-input-group [nzPrefix]="pfx" class="busca">
            <input nz-input placeholder="Buscar por título, cliente, atendente..." [(ngModel)]="filtro" (ngModelChange)="onFiltroChange()" />
          </nz-input-group>
          <ng-template #pfx><i nz-icon nzType="search"></i></ng-template>
          <nz-select [(ngModel)]="statusFiltro" (ngModelChange)="filtrar()" style="width:180px" nzPlaceHolder="Status">
            <nz-option nzValue="" nzLabel="Todos"></nz-option>
            <nz-option nzValue="abertos" nzLabel="Somente abertos"></nz-option>
            <nz-option nzValue="N" nzLabel="Novo"></nz-option>
            <nz-option nzValue="A" nzLabel="Em Atendimento"></nz-option>
            <nz-option nzValue="C" nzLabel="Concluído"></nz-option>
          </nz-select>
          <button nz-button nzType="primary" (click)="abrirNovo()">
            <i nz-icon nzType="plus"></i> Novo Chamado
          </button>
        </div>

        <ng-container *ngIf="loading">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:8}"></nz-skeleton>
        </ng-container>

        <nz-table *ngIf="!loading" [nzData]="listaFiltrada" nzBordered nzSize="middle" [nzShowPagination]="true" [nzPageSize]="15">
          <thead>
            <tr>
              <th nzWidth="70px">ID</th>
              <th nzWidth="160px">Tipo</th>
              <th>Cliente</th>
              <th nzWidth="140px">Atendente</th>
              <th nzWidth="130px">Data</th>
              <th nzWidth="110px" nzAlign="center">Status</th>
              <th nzWidth="90px" nzAlign="center">Prioridade</th>
              <th nzWidth="90px" nzAlign="center">Área</th>
              <th nzWidth="100px" nzAlign="center">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of listaFiltrada; trackBy: trackByChamado" [class.row-concluido]="c.status === 'C'">
              <td>#{{ c.id }}</td>
              <td>{{ c.titulo }}</td>
              <td>{{ c.razao || c.solicitante || '—' }}</td>
              <td>{{ atendenteNome(c.atendente) }}</td>
              <td>{{ c.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</td>
              <td nzAlign="center"><nz-tag [nzColor]="statusColor(c.status)">{{ statusLabel(c.status) }}</nz-tag></td>
              <td nzAlign="center"><nz-tag [nzColor]="prioColor(c.prioridade)">{{ prioLabel(c.prioridade) }}</nz-tag></td>
              <td>{{ c.tipo || '—' }}</td>
              <td nzAlign="center">
                <button nz-button nzType="primary" nzSize="small" (click)="abrirAtendimento(c)" nz-tooltip nzTooltipTitle="Atender / Detalhar">
                  <i nz-icon nzType="customer-service"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="listaFiltrada.length === 0">
              <td colspan="9" class="vazio">Nenhuma solicitação encontrada.</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <!-- Modal atendimento -->
    <nz-modal
      *ngIf="atendVisible"
      [(nzVisible)]="atendVisible"
      [nzTitle]="atendTitulo"
      [nzWidth]="920"
      [nzFooter]="ftAtend"
      (nzOnCancel)="fecharAtendimento()">
      <ng-container *nzModalContent>
        <ng-container *ngIf="selecionado">
          <div class="meta-linha">
            <span>Abertura: {{ selecionado.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</span>
            <span *ngIf="selecionado.solicitante">Solicitante: {{ selecionado.solicitante }}</span>
          </div>

          <div nz-row [nzGutter]="16" class="form-grid">
            <div nz-col [nzSpan]="12" [nzXs]="24">
              <nz-form-item>
                <nz-form-label [nzSpan]="24" nzRequired>Cliente</nz-form-label>
                <nz-form-control [nzSpan]="24">
                  <nz-select
                    [(ngModel)]="form.codigoPessoa"
                    nzShowSearch
                    [nzLoading]="carregandoPessoas"
                    style="width:100%"
                    nzPlaceHolder="Selecione">
                    <nz-option *ngFor="let p of pessoasSelect; trackBy: trackByPessoa" [nzValue]="p.codigo" [nzLabel]="nomePessoa(p)"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="6" [nzXs]="12">
              <nz-form-item>
                <nz-form-label [nzSpan]="24" nzRequired>Prioridade</nz-form-label>
                <nz-form-control [nzSpan]="24">
                  <nz-select [(ngModel)]="form.prioridade" style="width:100%">
                    <nz-option [nzValue]="1" nzLabel="Alta"></nz-option>
                    <nz-option [nzValue]="2" nzLabel="Média"></nz-option>
                    <nz-option [nzValue]="3" nzLabel="Baixa"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="6" [nzXs]="12">
              <nz-form-item>
                <nz-form-label [nzSpan]="24" nzRequired>Status</nz-form-label>
                <nz-form-control [nzSpan]="24">
                  <nz-select [(ngModel)]="form.status" style="width:100%">
                    <nz-option nzValue="N" nzLabel="Novo"></nz-option>
                    <nz-option nzValue="A" nzLabel="Em Atendimento"></nz-option>
                    <nz-option nzValue="C" nzLabel="Concluído"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12" [nzXs]="24">
              <nz-form-item>
                <nz-form-label [nzSpan]="24" nzRequired>Tipo de Solicitação</nz-form-label>
                <nz-form-control [nzSpan]="24">
                  <nz-select [(ngModel)]="form.titulo" nzShowSearch style="width:100%">
                    <nz-option *ngFor="let t of tiposSolicitacao" [nzValue]="t" [nzLabel]="t"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="6" [nzXs]="12">
              <nz-form-item>
                <nz-form-label [nzSpan]="24" nzRequired>Área</nz-form-label>
                <nz-form-control [nzSpan]="24">
                  <nz-select [(ngModel)]="form.tipo" style="width:100%">
                    <nz-option *ngFor="let a of areas" [nzValue]="a" [nzLabel]="a"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="6" [nzXs]="12">
              <nz-form-item>
                <nz-form-label [nzSpan]="24" nzRequired>Atendente</nz-form-label>
                <nz-form-control [nzSpan]="24">
                  <nz-select [(ngModel)]="form.atendente" nzShowSearch style="width:100%">
                    <nz-option *ngFor="let a of atendentes" [nzValue]="a.email" [nzLabel]="a.nome"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <nz-form-item>
            <nz-form-label [nzSpan]="24">Descrição do Cliente</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <textarea nz-input [(ngModel)]="form.mensagem" [nzAutosize]="{minRows:4,maxRows:8}"></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzSpan]="24" nzRequired>Detalhamento / Resposta do Atendimento</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <textarea nz-input [(ngModel)]="form.detalhamento" [nzAutosize]="{minRows:4,maxRows:8}" placeholder="Registre a interação, resposta ou conclusão deste atendimento..."></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzSpan]="24">Anexar Arquivo</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <nz-upload nzAction="" [nzBeforeUpload]="beforeUpload" [nzFileList]="fileList" [nzMultiple]="true" [nzRemove]="onRemoveArquivo">
                <button nz-button type="button"><i nz-icon nzType="inbox"></i> Selecionar arquivo(s)</button>
              </nz-upload>
            </nz-form-control>
          </nz-form-item>

          <nz-divider nzText="Anexos existentes" nzOrientation="left"></nz-divider>
          <ng-container *ngIf="carregandoAnexos"><nz-skeleton [nzActive]="true" [nzParagraph]="{rows:2}"></nz-skeleton></ng-container>
          <div *ngIf="!carregandoAnexos && anexos.length === 0" class="vazio-hist">Sem anexos.</div>
          <div *ngFor="let a of anexos" class="anexo-item">
            <span>{{ a.tipo }} — {{ a.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</span>
            <button nz-button nzType="link" nzSize="small" (click)="abrirAnexo(a)">
              <i nz-icon nzType="paper-clip"></i> Abrir
            </button>
          </div>

          <nz-divider nzText="Histórico de interações" nzOrientation="left"></nz-divider>
          <ng-container *ngIf="carregandoHistorico"><nz-skeleton [nzActive]="true" [nzParagraph]="{rows:3}"></nz-skeleton></ng-container>
          <div *ngIf="!carregandoHistorico && historico.length === 0" class="vazio-hist">Sem histórico registrado.</div>
          <div *ngFor="let h of historico" class="hist-item">
            <div class="hist-data">{{ h.dataHistorico | date:'dd/MM/yyyy HH:mm' }} — {{ h.usuario }}</div>
            <div class="hist-desc">{{ h.descricao }}</div>
          </div>
        </ng-container>
      </ng-container>
      <ng-template #ftAtend>
        <button nz-button (click)="fecharAtendimento()" [disabled]="salvando">Fechar</button>
        <button nz-button nzType="default" (click)="salvarAtendimento('A')" [nzLoading]="salvando && acaoSalvar === 'A'" [disabled]="salvando">
          <i nz-icon nzType="clock-circle"></i> Em Atendimento
        </button>
        <button nz-button nzType="primary" (click)="salvarAtendimento('C')" [nzLoading]="salvando && acaoSalvar === 'C'" [disabled]="salvando">
          <i nz-icon nzType="check-circle"></i> Concluir
        </button>
        <button nz-button nzType="primary" (click)="salvarAtendimento()" [nzLoading]="salvando && !acaoSalvar" [disabled]="salvando">Salvar</button>
      </ng-template>
    </nz-modal>

    <!-- Modal novo chamado -->
    <nz-modal *ngIf="novoVisible" [(nzVisible)]="novoVisible" nzTitle="Novo Chamado" [nzWidth]="640" [nzFooter]="ftNovo" (nzOnCancel)="novoVisible=false">
      <ng-container *nzModalContent>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Cliente</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-select [(ngModel)]="novoChamado.codigoPessoa" nzShowSearch [nzLoading]="carregandoPessoas" style="width:100%" nzPlaceHolder="Selecione o cliente">
              <nz-option *ngFor="let p of pessoasSelect; trackBy: trackByPessoa" [nzValue]="p.codigo" [nzLabel]="nomePessoa(p)"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label [nzSpan]="24" nzRequired>Tipo</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select [(ngModel)]="novoChamado.titulo" nzShowSearch style="width:100%">
                  <nz-option *ngFor="let t of tiposSolicitacao" [nzValue]="t" [nzLabel]="t"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label [nzSpan]="24">Prioridade</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select [(ngModel)]="novoChamado.prioridade" style="width:100%">
                  <nz-option [nzValue]="1" nzLabel="Alta"></nz-option>
                  <nz-option [nzValue]="2" nzLabel="Média"></nz-option>
                  <nz-option [nzValue]="3" nzLabel="Baixa"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label [nzSpan]="24">Área</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select [(ngModel)]="novoChamado.tipo" style="width:100%">
                  <nz-option *ngFor="let a of areas" [nzValue]="a" [nzLabel]="a"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label [nzSpan]="24">Atendente</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select [(ngModel)]="novoChamado.atendente" nzShowSearch style="width:100%">
                  <nz-option *ngFor="let a of atendentes" [nzValue]="a.email" [nzLabel]="a.nome"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Descrição</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <textarea nz-input [(ngModel)]="novoChamado.mensagem" [nzAutosize]="{minRows:4}"></textarea>
          </nz-form-control>
        </nz-form-item>
      </ng-container>
      <ng-template #ftNovo>
        <button nz-button (click)="novoVisible=false" [disabled]="salvando">Fechar</button>
        <button nz-button nzType="primary" (click)="salvarNovo()" [nzLoading]="salvando">Abrir Chamado</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
    .kpi { flex: 1; min-width: 130px; text-align: center; }
    .kpi-icon { font-size: 22px; margin-bottom: 6px; }
    .kpi-label { color: rgba(0,0,0,.45); font-size: .85rem; }
    .kpi-value { font-size: 1.35rem; font-weight: 800; margin: 4px 0; }
    .toolbar { margin-bottom: 12px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .busca { max-width: 360px; }
    .vazio, .vazio-hist { text-align: center; padding: 24px; color: rgba(0,0,0,.45); }
    .row-concluido { opacity: .72; }
    .meta-linha { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 12px; font-size: .88rem; color: rgba(0,0,0,.55); }
    .form-grid nz-form-item { margin-bottom: 8px; }
    .hist-item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .hist-data { font-size: .8rem; color: rgba(0,0,0,.45); margin-bottom: 2px; }
    .hist-desc { font-size: .92rem; white-space: pre-wrap; }
    .anexo-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: .9rem; }
  `]
})
export class SolicitacoesComponent implements OnInit {
  private readonly api = environment.apiUrl;
  readonly tiposSolicitacao = TIPOS_SOLICITACAO;
  readonly areas = AREAS;
  readonly atendentes = ATENDENTES;

  loading = true;
  lista: Chamado[] = [];
  listaFiltrada: Chamado[] = [];
  pessoas: { codigo: number; razao?: string; nome?: string }[] = [];
  pessoasSelect: { codigo: number; razao?: string; nome?: string }[] = [];
  pessoasMap = new Map<number, { codigo: number; razao?: string; nome?: string }>();
  carregandoPessoas = false;
  pessoasCarregadas = false;
  filtro = '';
  statusFiltro = 'abertos';
  private filtroTimer?: ReturnType<typeof setTimeout>;
  salvando = false;
  acaoSalvar: string | null = null;
  adminEmail = '';

  kpiStats = [
    { label: 'Novos', icon: 'plus-circle', color: '#1890ff', value: 0 },
    { label: 'Em Atendimento', icon: 'clock-circle', color: '#fa8c16', value: 0 },
    { label: 'Concluídos', icon: 'check-circle', color: '#52c41a', value: 0 },
    { label: 'Abertos', icon: 'message', color: '#722ed1', value: 0 }
  ];

  atendVisible = false;
  selecionado: Chamado | null = null;
  form: FormAtendimento = this.formVazio();
  historico: ChamadoHistorico[] = [];
  anexos: ChamadoUpload[] = [];
  carregandoHistorico = false;
  carregandoAnexos = false;
  fileList: NzUploadFile[] = [];

  novoVisible = false;
  novoChamado = { codigoPessoa: 0, titulo: '', mensagem: '', prioridade: 3, tipo: 'Contabilidade', atendente: '' };

  get atendTitulo(): string {
    return this.selecionado ? `Atendimento — Chamado #${this.selecionado.id}` : 'Atendimento';
  }

  trackByChamado = (_: number, c: Chamado) => c.id;
  trackByKpi = (_: number, k: { label: string }) => k.label;
  trackByPessoa = (_: number, p: { codigo: number }) => p.codigo;

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(
    private http: HttpClient,
    private message: NzMessageService,
    private login: LoginService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.adminEmail = this.login.obterUsuario()?.email || 'admin@contfy.com';
    this.carregar();
  }

  private formVazio(): FormAtendimento {
    return { codigoPessoa: 0, prioridade: 3, titulo: '', tipo: 'Contabilidade', status: 'N', atendente: '', mensagem: '', detalhamento: '' };
  }

  carregar(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.get<Chamado[]>(`${this.api}/Chamado`, { headers: this.h })
      .pipe(timeout(15000), catchError(() => of([] as Chamado[])))
      .subscribe({
        next: (chamados) => {
          this.lista = (chamados || [])
            .filter(c => !c.mensagem?.includes('[Solicitação excluída pelo cliente]'))
            .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
          this.atualizarKpis();
          this.filtrar();
          this.loading = false;
          this.cdr.markForCheck();
          setTimeout(() => this.carregarPessoasEmBackground(), 0);
        },
        error: () => {
          this.loading = false;
          this.message.error('Erro ao carregar solicitações.');
          this.cdr.markForCheck();
        }
      });
  }

  private carregarPessoasEmBackground(): void {
    if (this.pessoasCarregadas || this.carregandoPessoas) return;
    this.carregandoPessoas = true;
    this.http.get<{ codigo: number; razao?: string; nome?: string }[]>(`${this.api}/Pessoa`, { headers: this.h })
      .pipe(timeout(30000), catchError(() => of([])))
      .subscribe({
        next: (pessoas) => {
          this.aplicarPessoas(pessoas || []);
          this.carregandoPessoas = false;
          this.pessoasCarregadas = true;
          this.enriquecerListaComRazao();
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregandoPessoas = false;
          this.cdr.markForCheck();
        }
      });
  }

  private aplicarPessoas(pessoas: { codigo: number; razao?: string; nome?: string }[]): void {
    this.pessoas = pessoas;
    this.pessoasMap.clear();
    pessoas.forEach(p => this.pessoasMap.set(p.codigo, p));
    this.pessoasSelect = [...pessoas];
  }

  private enriquecerListaComRazao(): void {
    if (this.pessoasMap.size === 0) return;
    this.lista = this.lista.map(c => ({
      ...c,
      razao: this.pessoasMap.get(c.codigoPessoa)?.razao || c.razao
    }));
    this.filtrar();
  }

  private garantirPessoasParaModal(codigoPessoa?: number): void {
    if (this.pessoasCarregadas) {
      this.pessoasSelect = [...this.pessoas];
      if (codigoPessoa && !this.pessoasMap.has(codigoPessoa)) {
        this.http.get<{ codigo: number; razao?: string; nome?: string }>(`${this.api}/Pessoa/${codigoPessoa}`, { headers: this.h })
          .pipe(timeout(8000), catchError(() => of(null)))
          .subscribe(p => {
            if (p) {
              this.pessoasMap.set(p.codigo, p);
              if (!this.pessoas.some(x => x.codigo === p.codigo)) {
                this.pessoas = [...this.pessoas, p];
              }
              this.pessoasSelect = [...this.pessoas];
              this.cdr.markForCheck();
            }
          });
      }
      return;
    }
    if (this.carregandoPessoas) return;
    this.carregandoPessoas = true;
    this.cdr.markForCheck();
    this.http.get<{ codigo: number; razao?: string; nome?: string }[]>(`${this.api}/Pessoa`, { headers: this.h })
      .pipe(timeout(30000), catchError(() => of([])))
      .subscribe({
        next: (pessoas) => {
          this.aplicarPessoas(pessoas || []);
          this.pessoasCarregadas = true;
          this.carregandoPessoas = false;
          this.enriquecerListaComRazao();
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregandoPessoas = false;
          this.message.warning('Não foi possível carregar a lista de clientes.');
          this.cdr.markForCheck();
        }
      });
  }

  private atualizarKpis(): void {
    const novos = this.lista.filter(c => c.status === 'N').length;
    const emAtendimento = this.lista.filter(c => c.status === 'A').length;
    const concluidos = this.lista.filter(c => c.status === 'C').length;
    const abertos = this.lista.filter(c => c.status !== 'C').length;
    this.kpiStats = [
      { label: 'Novos', icon: 'plus-circle', color: '#1890ff', value: novos },
      { label: 'Em Atendimento', icon: 'clock-circle', color: '#fa8c16', value: emAtendimento },
      { label: 'Concluídos', icon: 'check-circle', color: '#52c41a', value: concluidos },
      { label: 'Abertos', icon: 'message', color: '#722ed1', value: abertos }
    ];
  }

  onFiltroChange(): void {
    clearTimeout(this.filtroTimer);
    this.filtroTimer = setTimeout(() => this.filtrar(), 300);
  }

  filtrar(): void {
    let l = [...this.lista];
    if (this.statusFiltro === 'abertos') l = l.filter(c => c.status !== 'C');
    else if (this.statusFiltro) l = l.filter(c => c.status === this.statusFiltro);
    const f = this.filtro.toLowerCase().trim();
    if (f) {
      l = l.filter(c =>
        (c.titulo || '').toLowerCase().includes(f) ||
        (c.razao || '').toLowerCase().includes(f) ||
        (c.solicitante || '').toLowerCase().includes(f) ||
        (c.atendente || '').toLowerCase().includes(f) ||
        String(c.id).includes(f)
      );
    }
    this.listaFiltrada = l;
    this.cdr.markForCheck();
  }

  abrirAtendimento(c: Chamado): void {
    this.selecionado = c;
    this.form = {
      codigoPessoa: c.codigoPessoa,
      prioridade: c.prioridade || 3,
      titulo: c.titulo || '',
      tipo: c.tipo || 'Contabilidade',
      status: c.status || 'N',
      atendente: c.atendente || '',
      mensagem: c.mensagem || '',
      detalhamento: ''
    };
    this.historico = [];
    this.anexos = [];
    this.fileList = [];
    this.atendVisible = true;
    this.carregandoHistorico = true;
    this.carregandoAnexos = true;
    this.garantirPessoasParaModal(c.codigoPessoa);
    this.cdr.markForCheck();

    this.http.get<ChamadoHistorico[]>(`${this.api}/Chamado/ChamadoHistorico/${c.id}`, { headers: this.h })
      .pipe(timeout(8000), catchError(() => of([] as ChamadoHistorico[])))
      .subscribe({
        next: (h) => {
          this.historico = (h || []).sort((a, b) => new Date(b.dataHistorico).getTime() - new Date(a.dataHistorico).getTime());
          this.carregandoHistorico = false;
          this.cdr.markForCheck();
        },
        error: () => { this.carregandoHistorico = false; this.cdr.markForCheck(); }
      });

    this.http.get<ChamadoUpload[]>(`${this.api}/Chamado/ChamadoUpload/ObterPorCodigo/${c.id}`, { headers: this.h })
      .pipe(timeout(8000), catchError(() => of([] as ChamadoUpload[])))
      .subscribe({
        next: (a) => { this.anexos = a || []; this.carregandoAnexos = false; this.cdr.markForCheck(); },
        error: () => { this.carregandoAnexos = false; this.cdr.markForCheck(); }
      });
  }

  fecharAtendimento(): void {
    this.atendVisible = false;
    this.selecionado = null;
    this.fileList = [];
    this.cdr.markForCheck();
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.fileList = [...this.fileList, file];
    this.cdr.markForCheck();
    return false;
  };

  onRemoveArquivo = (file: NzUploadFile): boolean => {
    this.fileList = this.fileList.filter(f => f.uid !== file.uid);
    this.cdr.markForCheck();
    return true;
  };

  private getArquivosSelecionados(): File[] {
    return this.fileList
      .map(f => (f as NzUploadFile & { originFileObj?: File }).originFileObj)
      .filter((f): f is File => !!f);
  }

  salvarAtendimento(forcarStatus?: string): void {
    if (!this.selecionado) return;
    if (!this.form.codigoPessoa) { this.message.warning('Selecione o cliente.'); return; }
    if (!this.form.titulo?.trim()) { this.message.warning('Selecione o tipo de solicitação.'); return; }
    if (!this.form.atendente?.trim()) { this.message.warning('Selecione o atendente.'); return; }
    if (!this.form.detalhamento?.trim()) { this.message.warning('Informe o detalhamento da interação.'); return; }

    const status = forcarStatus || this.form.status;
    this.acaoSalvar = forcarStatus || null;
    this.salvando = true;
    this.cdr.markForCheck();

    const agora = new Date().toISOString();
    const payload = {
      ...this.selecionado,
      codigoPessoa: this.form.codigoPessoa,
      prioridade: this.form.prioridade,
      titulo: this.form.titulo,
      tipo: this.form.tipo,
      status,
      atendente: this.form.atendente,
      mensagem: this.form.mensagem,
      chamadoHistoricos: [{
        dataHistorico: agora,
        descricao: this.form.detalhamento.trim(),
        usuario: this.adminEmail
      }]
    };

    this.http.put<Chamado>(`${this.api}/Chamado`, payload, { headers: this.h }).subscribe({
      next: () => {
        const arquivos = this.getArquivosSelecionados();
        if (arquivos.length === 0) {
          this.finalizarAtendimento(status);
          return;
        }
        this.uploadAnexos(this.selecionado!.id, this.form.codigoPessoa, this.form.tipo, arquivos)
          .then(() => this.finalizarAtendimento(status))
          .catch(() => {
            this.message.warning('Atendimento salvo, mas houve erro ao enviar um ou mais anexos.');
            this.finalizarAtendimento(status);
          });
      },
      error: (e) => {
        this.message.error(e?.error?.message || e?.error || `Erro ao salvar (${e.status})`);
        this.salvando = false;
        this.acaoSalvar = null;
        this.cdr.markForCheck();
      }
    });
  }

  private finalizarAtendimento(status: string): void {
    const msg = status === 'C' ? 'Solicitação concluída!' : 'Atendimento salvo com sucesso!';
    this.message.success(msg);
    this.atualizarListaAposSalvar(status);
    this.salvando = false;
    this.acaoSalvar = null;
    this.atendVisible = false;
    this.selecionado = null;
    this.fileList = [];
    this.cdr.markForCheck();
  }

  private atualizarListaAposSalvar(status: string): void {
    if (!this.selecionado) return;
    const idx = this.lista.findIndex(c => c.id === this.selecionado!.id);
    if (idx >= 0) {
      this.lista[idx] = {
        ...this.lista[idx],
        codigoPessoa: this.form.codigoPessoa,
        prioridade: this.form.prioridade,
        titulo: this.form.titulo,
        tipo: this.form.tipo,
        status,
        atendente: this.form.atendente,
        mensagem: this.form.mensagem,
        razao: this.pessoasMap.get(this.form.codigoPessoa)?.razao || this.lista[idx].razao
      };
      this.atualizarKpis();
      this.filtrar();
    }
  }

  private uploadAnexos(chamadoId: number, codigoPessoa: number, tipo: string, arquivos: File[]): Promise<void> {
    return Promise.all(arquivos.map(arquivo => this.uploadUmAnexo(chamadoId, codigoPessoa, tipo, arquivo))).then(() => undefined);
  }

  private uploadUmAnexo(chamadoId: number, codigoPessoa: number, tipo: string, arquivo: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const guid = crypto.randomUUID();
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.http.post(`${this.api}/ArmazenamentoDeObjeto`, { codigo: guid, image: base64, pasta: String(codigoPessoa) }, { headers: this.h })
          .pipe(timeout(30000), catchError(() => of(null)))
          .subscribe({
            next: () => {
              const uploadPayload = { chamadoId, dataCriacao: new Date().toISOString(), arquivo: guid, tipo };
              this.http.post(`${this.api}/Chamado/ChamadoUpload`, uploadPayload, { headers: this.h })
                .pipe(timeout(15000))
                .subscribe({ next: () => resolve(), error: (e) => reject(e) });
            },
            error: (e) => reject(e)
          });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(arquivo);
    });
  }

  abrirAnexo(anexo: ChamadoUpload): void {
    if (!this.selecionado) return;
    const url = `${ARQUIVO_BASE_URL}?diretorioCompleto=${this.selecionado.codigoPessoa}&nomeArquivo=${anexo.arquivo}`;
    window.open(url, '_blank');
  }

  abrirNovo(): void {
    this.novoChamado = { codigoPessoa: 0, titulo: '', mensagem: '', prioridade: 3, tipo: 'Contabilidade', atendente: this.adminEmail };
    this.novoVisible = true;
    this.garantirPessoasParaModal();
    this.cdr.markForCheck();
  }

  salvarNovo(): void {
    if (!this.novoChamado.codigoPessoa || !this.novoChamado.titulo?.trim() || !this.novoChamado.mensagem?.trim()) {
      this.message.warning('Preencha cliente, tipo e descrição.');
      return;
    }
    this.salvando = true;
    this.cdr.markForCheck();
    const agora = new Date().toISOString();
    const payload = {
      ...this.novoChamado,
      solicitante: this.adminEmail,
      status: 'N',
      slaTempo: this.slaPorPrioridade(this.novoChamado.prioridade),
      dataCriacao: agora,
      chamadoHistoricos: [{ dataHistorico: agora, descricao: 'Chamado aberto pelo administrador', usuario: this.adminEmail }]
    };
    this.http.post<Chamado>(`${this.api}/Chamado`, payload, { headers: this.h }).subscribe({
      next: () => {
        this.message.success('Chamado aberto!');
        this.salvando = false;
        this.novoVisible = false;
        this.carregar();
      },
      error: (e) => {
        this.message.error(e?.error?.message || e?.error || `Erro (${e.status})`);
        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }

  nomePessoa(p: { razao?: string; nome?: string }): string {
    return p.razao || p.nome || '—';
  }

  atendenteNome(email: string): string {
    if (!email) return '—';
    const found = ATENDENTES.find(a => a.email === email);
    if (found) return found.nome;
    if (email.includes('@')) return email.split('@')[0];
    return email;
  }

  private slaPorPrioridade(p: number): number {
    return ({ 1: 2, 2: 8, 3: 120 } as Record<number, number>)[p] ?? 8;
  }

  statusLabel(s: string): string {
    return ({ N: 'Novo', A: 'Em Atendimento', C: 'Concluído' } as Record<string, string>)[s] || s || '—';
  }

  statusColor(s: string): string {
    return ({ N: 'blue', A: 'orange', C: 'green' } as Record<string, string>)[s] || 'default';
  }

  prioLabel(p: number): string {
    return ({ 1: 'Alta', 2: 'Média', 3: 'Baixa' } as Record<number, string>)[p] || '—';
  }

  prioColor(p: number): string {
    return ({ 1: 'red', 2: 'orange', 3: 'blue' } as Record<number, string>)[p] || 'default';
  }
}
