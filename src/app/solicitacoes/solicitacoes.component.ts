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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PageTitleComponent } from '../page-title.component';
import { LoginService } from '../services/login.service';
import { environment } from '../../environments/environment';

const AREA_FIXA = 'Contabilidade';
const ATENDENTE_FIXO = 'Analista Contabil';

const TIPOS_SOLICITACAO = [
  'Emissão de Nota',
  'Erro na Plataforma',
  'Imposto de Renda',
  'Alteração na Empresa',
  'Problemas no Pagamento',
  'Solitação de Documento',
  'Envio de Documento',
  'Problema com Impostos',
  'Problema com Nota Fiscal',
  'Outros'
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
}

interface ChamadoHistorico {
  id?: number;
  chamadoId: number;
  usuario: string;
  descricao: string;
  dataHistorico: string;
}

@Component({
  selector: 'app-solicitacoes-cliente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTableModule, NzTagModule, NzIconModule, NzButtonModule,
    NzSkeletonModule, NzModalModule, NzFormModule, NzSelectModule, NzInputModule,
    NzPopconfirmModule, NzMessageModule, NzDividerModule, PageTitleComponent
  ],
  template: `
    <div class="page">
      <app-page-title title="Solicitações" subtitle="Abra e acompanhe suas solicitações com a contabilidade"></app-page-title>

      <nz-card>
        <div class="toolbar">
          <button nz-button nzType="primary" (click)="abrirNovo()">
            <span nz-icon nzType="plus"></span> Nova Solicitação
          </button>
          <span class="hint" *ngIf="!loading">{{ lista.length }} solicitação(ões)</span>
        </div>

        <ng-container *ngIf="loading">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{rows:6}"></nz-skeleton>
        </ng-container>

        <nz-table *ngIf="!loading" [nzData]="lista" nzBordered nzSize="middle" [nzShowPagination]="lista.length > 10" [nzPageSize]="10">
          <thead>
            <tr>
              <th nzWidth="70px">Código</th>
              <th>Tipo</th>
              <th nzWidth="110px" nzAlign="center">Prioridade</th>
              <th nzWidth="120px" nzAlign="center">Status</th>
              <th nzWidth="120px">Data</th>
              <th nzWidth="150px" nzAlign="center">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of lista">
              <td>#{{ c.id }}</td>
              <td>{{ c.titulo }}</td>
              <td nzAlign="center"><nz-tag [nzColor]="prioColor(c.prioridade)">{{ prioLabel(c.prioridade) }}</nz-tag></td>
              <td nzAlign="center"><nz-tag [nzColor]="statusColor(c.status)">{{ statusLabel(c.status) }}</nz-tag></td>
              <td>{{ c.dataCriacao | date:'dd/MM/yyyy' }}</td>
              <td nzAlign="center" class="acoes">
                <button nz-button nzType="default" nzSize="small" (click)="visualizar(c)">
                  <span nz-icon nzType="eye"></span>
                </button>
                <button *ngIf="c.status === 'N'" nz-button nzDanger nzSize="small"
                  nz-popconfirm nzPopconfirmTitle="Excluir esta solicitação?"
                  nzOkText="Excluir" nzCancelText="Cancelar"
                  (nzOnConfirm)="excluir(c)" [nzLoading]="excluindo.has(c.id)">
                  <span nz-icon nzType="delete"></span>
                </button>
              </td>
            </tr>
            <tr *ngIf="lista.length === 0">
              <td colspan="6" class="vazio">Nenhuma solicitação encontrada.</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <!-- Nova solicitação -->
    <nz-modal [(nzVisible)]="novoVisible" nzTitle="Nova Solicitação" [nzWidth]="640" [nzFooter]="ftNovo" (nzOnCancel)="novoVisible=false">
      <ng-container *nzModalContent>
        <div class="form-grid">
          <nz-form-item>
            <nz-form-label nzRequired>Prioridade</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="form.prioridade" nzPlaceHolder="Selecione" style="width:100%">
                <nz-option [nzValue]="0" nzLabel="Selecione" nzDisabled></nz-option>
                <nz-option [nzValue]="1" nzLabel="Alta"></nz-option>
                <nz-option [nzValue]="2" nzLabel="Média"></nz-option>
                <nz-option [nzValue]="3" nzLabel="Baixa"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label nzRequired>Tipo de Solicitação</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="form.titulo" nzPlaceHolder="Selecione" style="width:100%">
                <nz-option nzValue="" nzLabel="Selecione" nzDisabled></nz-option>
                <nz-option *ngFor="let t of tiposSolicitacao" [nzValue]="t" [nzLabel]="t"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Área</nz-form-label>
            <nz-form-control><input nz-input [value]="areaFixa" disabled /></nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Atendente</nz-form-label>
            <nz-form-control><input nz-input [value]="atendenteFixo" disabled /></nz-form-control>
          </nz-form-item>
        </div>
        <nz-form-item>
          <nz-form-label nzRequired>Descrição</nz-form-label>
          <nz-form-control>
            <textarea nz-input [(ngModel)]="form.mensagem" [nzAutosize]="{minRows:5,maxRows:10}" placeholder="Descreva sua solicitação..."></textarea>
          </nz-form-control>
        </nz-form-item>
      </ng-container>
      <ng-template #ftNovo>
        <button nz-button (click)="novoVisible=false" [disabled]="salvando">Cancelar</button>
        <button nz-button nzType="primary" (click)="salvarNovo()" [nzLoading]="salvando">Cadastrar</button>
      </ng-template>
    </nz-modal>

    <!-- Visualizar -->
    <nz-modal [(nzVisible)]="viewVisible" [nzTitle]="viewTitulo" [nzWidth]="680" [nzFooter]="ftView" (nzOnCancel)="viewVisible=false">
      <ng-container *nzModalContent>
        <ng-container *ngIf="selecionado">
          <div class="detalhe"><label>Prioridade</label><div>{{ prioLabel(selecionado.prioridade) }}</div></div>
          <div class="detalhe"><label>Área</label><div>{{ selecionado.tipo }}</div></div>
          <div class="detalhe"><label>Atendente</label><div>{{ selecionado.atendente }}</div></div>
          <div class="detalhe"><label>Status</label><div>{{ statusLabel(selecionado.status) }}</div></div>
          <div class="detalhe"><label>Data</label><div>{{ selecionado.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</div></div>
          <div class="detalhe"><label>Descrição</label><div class="msg">{{ selecionado.mensagem }}</div></div>
          <nz-divider nzText="Histórico" nzOrientation="left"></nz-divider>
          <ng-container *ngIf="carregandoHistorico"><nz-skeleton [nzActive]="true" [nzParagraph]="{rows:3}"></nz-skeleton></ng-container>
          <div *ngIf="!carregandoHistorico && historico.length === 0" class="vazio-hist">Sem histórico registrado.</div>
          <div *ngFor="let h of historico" class="hist-item">
            <div class="hist-data">{{ h.dataHistorico | date:'dd/MM/yyyy HH:mm' }} — {{ h.usuario }}</div>
            <div class="hist-desc">{{ h.descricao }}</div>
          </div>
        </ng-container>
      </ng-container>
      <ng-template #ftView>
        <button nz-button nzType="primary" (click)="viewVisible=false">Fechar</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
    .hint { color: rgba(0,0,0,.45); font-size: .88rem; }
    .acoes { display: flex; gap: 6px; justify-content: center; }
    .vazio, .vazio-hist { text-align: center; padding: 24px; color: rgba(0,0,0,.45); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
    .detalhe { margin-bottom: 12px; }
    .detalhe label { font-weight: 600; color: rgba(0,0,0,.55); font-size: .78rem; text-transform: uppercase; display: block; margin-bottom: 4px; }
    .detalhe div { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 4px; padding: 6px 10px; }
    .detalhe .msg { white-space: pre-wrap; }
    .hist-item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .hist-data { font-size: .8rem; color: rgba(0,0,0,.45); margin-bottom: 2px; }
    .hist-desc { font-size: .92rem; }
  `]
})
export class SolicitacoesClienteComponent implements OnInit {
  private readonly api = environment.apiUrl;
  readonly tiposSolicitacao = TIPOS_SOLICITACAO;
  readonly areaFixa = AREA_FIXA;
  readonly atendenteFixo = ATENDENTE_FIXO;

  loading = true;
  salvando = false;
  lista: Chamado[] = [];
  codigoPessoa = 0;
  solicitante = '';

  novoVisible = false;
  form = { prioridade: 0, titulo: '', mensagem: '' };

  viewVisible = false;
  selecionado: Chamado | null = null;
  historico: ChamadoHistorico[] = [];
  carregandoHistorico = false;
  excluindo = new Set<number>();

  get viewTitulo(): string {
    return this.selecionado ? `Solicitação #${this.selecionado.id}` : 'Solicitação';
  }

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(
    private http: HttpClient,
    private login: LoginService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const usuario = this.login.obterUsuario();
    const pessoa = this.login.obterPessoa();
    this.codigoPessoa = usuario?.codigoPessoa ?? pessoa?.codigo ?? 0;
    this.solicitante = usuario?.email || usuario?.nome || '';
    if (!this.codigoPessoa) {
      this.loading = false;
      this.message.warning('Não foi possível identificar o cliente logado.');
      this.cdr.markForCheck();
      return;
    }
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.get<Chamado[]>(`${this.api}/Chamado`, { headers: this.h })
      .pipe(timeout(10000), catchError(() => of([] as Chamado[])))
      .subscribe({
        next: (chamados) => {
          this.lista = (chamados || [])
            .filter(c => c.codigoPessoa === this.codigoPessoa && !c.mensagem?.includes('[Solicitação excluída pelo cliente]'))
            .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.message.error('Erro ao carregar solicitações.');
          this.cdr.markForCheck();
        }
      });
  }

  abrirNovo(): void {
    this.form = { prioridade: 0, titulo: '', mensagem: '' };
    this.novoVisible = true;
    this.cdr.markForCheck();
  }

  salvarNovo(): void {
    if (!this.form.prioridade || this.form.prioridade < 1) {
      this.message.warning('Selecione a prioridade.');
      return;
    }
    if (!this.form.titulo?.trim()) {
      this.message.warning('Selecione o tipo de solicitação.');
      return;
    }
    if (!this.form.mensagem?.trim()) {
      this.message.warning('Informe a descrição da solicitação.');
      return;
    }

    this.salvando = true;
    this.cdr.markForCheck();

    const agora = new Date().toISOString();
    const payload = {
      codigoPessoa: this.codigoPessoa,
      atendente: ATENDENTE_FIXO,
      solicitante: this.solicitante,
      titulo: this.form.titulo,
      mensagem: this.form.mensagem.trim(),
      status: 'N',
      prioridade: this.form.prioridade,
      tipo: AREA_FIXA,
      slaTempo: this.slaPorPrioridade(this.form.prioridade),
      dataCriacao: agora,
      chamadoHistoricos: [{
        dataHistorico: agora,
        descricao: 'Criação de solicitação',
        usuario: this.solicitante
      }]
    };

    this.http.post<Chamado>(`${this.api}/Chamado`, payload, { headers: this.h }).subscribe({
      next: () => {
        this.message.success('Solicitação cadastrada com sucesso!');
        this.salvando = false;
        this.novoVisible = false;
        this.carregar();
      },
      error: (e) => {
        this.message.error(e?.error?.message || e?.error || `Erro ao cadastrar (${e.status})`);
        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }

  visualizar(c: Chamado): void {
    this.selecionado = c;
    this.historico = [];
    this.viewVisible = true;
    this.carregandoHistorico = true;
    this.cdr.markForCheck();

    this.http.get<ChamadoHistorico[]>(`${this.api}/Chamado/ChamadoHistorico/${c.id}`, { headers: this.h })
      .pipe(timeout(8000), catchError(() => of([] as ChamadoHistorico[])))
      .subscribe({
        next: (h) => {
          this.historico = (h || []).sort((a, b) =>
            new Date(b.dataHistorico).getTime() - new Date(a.dataHistorico).getTime());
          this.carregandoHistorico = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregandoHistorico = false;
          this.cdr.markForCheck();
        }
      });
  }

  excluir(c: Chamado): void {
    if (c.status !== 'N' || this.excluindo.has(c.id)) return;
    this.excluindo.add(c.id);
    this.cdr.markForCheck();

    const payload = {
      ...c,
      status: 'C',
      mensagem: `${c.mensagem}\n[Solicitação excluída pelo cliente]`,
      chamadoHistoricos: [] as ChamadoHistorico[]
    };

    this.http.put<Chamado>(`${this.api}/Chamado`, payload, { headers: this.h }).subscribe({
      next: () => {
        this.excluindo.delete(c.id);
        this.message.success('Solicitação excluída.');
        this.carregar();
      },
      error: (e) => {
        this.excluindo.delete(c.id);
        this.message.error(e?.error?.message || e?.error || `Erro ao excluir (${e.status})`);
        this.cdr.markForCheck();
      }
    });
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
