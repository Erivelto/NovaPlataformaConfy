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
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { PageTitleComponent } from '../page-title.component';
import { LoginService } from '../services/login.service';
import { environment } from '../../environments/environment';

const AREA_FIXA = 'Contabilidade';
const ATENDENTE_FIXO = 'Analista Contabil';
const ARQUIVO_BASE_URL = 'https://armazenamento.contfy.com.br/Arquivos/Resultado';

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

interface ChamadoUpload {
  codigo: number;
  chamadoId: number;
  dataCriacao: string;
  arquivo: string;
  tipo: string;
}

@Component({
  selector: 'app-solicitacoes-cliente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTableModule, NzTagModule, NzIconModule, NzButtonModule,
    NzSkeletonModule, NzModalModule, NzFormModule, NzSelectModule, NzInputModule,
    NzPopconfirmModule, NzMessageModule, NzDividerModule, NzGridModule, NzUploadModule, PageTitleComponent
  ],
  template: `
    <div class="page">
      <app-page-title title="Solicitar Serviço" subtitle="Abra e acompanhe seus chamados com a contabilidade"></app-page-title>

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
    <nz-modal [(nzVisible)]="novoVisible" nzTitle="Nova Solicitação" [nzWidth]="720" [nzFooter]="ftNovo" (nzOnCancel)="novoVisible=false">
      <ng-container *nzModalContent>
        <div class="modal-form">
          <nz-form-item>
            <nz-form-label [nzSpan]="24" nzRequired>Prioridade</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <nz-select [(ngModel)]="form.prioridade" nzPlaceHolder="Selecione" style="width:100%">
                <nz-option [nzValue]="1" nzLabel="Alta"></nz-option>
                <nz-option [nzValue]="2" nzLabel="Média"></nz-option>
                <nz-option [nzValue]="3" nzLabel="Baixa"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item class="campo-tipo">
            <nz-form-label [nzSpan]="24" nzRequired>Tipo de Solicitação</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <nz-select
                [(ngModel)]="form.titulo"
                nzPlaceHolder="Selecione o tipo"
                nzShowSearch
                nzAllowClear
                style="width:100%">
                <nz-option *ngFor="let t of tiposSolicitacao" [nzValue]="t" [nzLabel]="t"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <div nz-row [nzGutter]="16" class="campos-fixos">
            <div nz-col [nzSpan]="12" [nzXs]="24" [nzSm]="12">
              <div class="campo-readonly">
                <label>Área</label>
                <input nz-input [value]="areaFixa" disabled />
              </div>
            </div>
            <div nz-col [nzSpan]="12" [nzXs]="24" [nzSm]="12">
              <div class="campo-readonly">
                <label>Atendente</label>
                <input nz-input [value]="atendenteFixo" disabled />
              </div>
            </div>
          </div>

          <nz-form-item>
            <nz-form-label [nzSpan]="24">Anexo de Arquivo</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <nz-upload
                nzAction=""
                [nzBeforeUpload]="beforeUpload"
                [nzFileList]="fileList"
                [nzMultiple]="true"
                (nzRemove)="onRemoveArquivo">
                <button nz-button type="button">
                  <span nz-icon nzType="inbox"></span> Selecionar arquivo(s)
                </button>
              </nz-upload>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzSpan]="24" nzRequired>Descrição</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <textarea nz-input [(ngModel)]="form.mensagem" [nzAutosize]="{minRows:5,maxRows:10}" placeholder="Descreva sua solicitação..."></textarea>
            </nz-form-control>
          </nz-form-item>
        </div>
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
          <nz-divider nzText="Anexos" nzOrientation="left"></nz-divider>
          <ng-container *ngIf="carregandoAnexos"><nz-skeleton [nzActive]="true" [nzParagraph]="{rows:2}"></nz-skeleton></ng-container>
          <div *ngIf="!carregandoAnexos && anexos.length === 0" class="vazio-hist">Sem anexos.</div>
          <div *ngFor="let a of anexos" class="anexo-item">
            <span>{{ a.tipo }} — {{ a.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</span>
            <button nz-button nzType="link" nzSize="small" (click)="abrirAnexo(a)">
              <span nz-icon nzType="paper-clip"></span> Abrir
            </button>
          </div>
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
    .modal-form { padding: 4px 0; }
    .modal-form nz-form-item { margin-bottom: 16px; }
    .modal-form ::ng-deep .ant-form-item { flex-direction: column; align-items: stretch; }
    .modal-form ::ng-deep .ant-form-item-label { text-align: left; width: 100%; padding: 0 0 6px; }
    .modal-form ::ng-deep .ant-form-item-label > label { height: auto; font-weight: 600; }
    .modal-form ::ng-deep .ant-form-item-control { width: 100%; max-width: 100%; }
    .modal-form ::ng-deep .ant-select-selector { min-height: 36px; height: auto !important; align-items: center; }
    .modal-form ::ng-deep .ant-select-selection-item,
    .modal-form ::ng-deep .ant-select-selection-placeholder {
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      line-height: 1.35;
      padding: 4px 0;
    }
    .modal-form .campo-tipo ::ng-deep .ant-select { width: 100%; }
    .campos-fixos { margin-bottom: 8px; }
    .campo-readonly label {
      display: block;
      font-weight: 600;
      color: rgba(0,0,0,.65);
      font-size: .82rem;
      margin-bottom: 6px;
    }
    .campo-readonly input { width: 100%; }
    .detalhe { margin-bottom: 12px; }
    .detalhe label { font-weight: 600; color: rgba(0,0,0,.55); font-size: .78rem; text-transform: uppercase; display: block; margin-bottom: 4px; }
    .detalhe div { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 4px; padding: 6px 10px; }
    .detalhe .msg { white-space: pre-wrap; }
    .hist-item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .hist-data { font-size: .8rem; color: rgba(0,0,0,.45); margin-bottom: 2px; }
    .hist-desc { font-size: .92rem; }
    .anexo-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: .9rem; }
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
  form: { prioridade: number | null; titulo: string | null; mensagem: string } = { prioridade: null, titulo: null, mensagem: '' };
  fileList: NzUploadFile[] = [];

  viewVisible = false;
  selecionado: Chamado | null = null;
  historico: ChamadoHistorico[] = [];
  anexos: ChamadoUpload[] = [];
  carregandoHistorico = false;
  carregandoAnexos = false;
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
    this.form = { prioridade: null, titulo: null, mensagem: '' };
    this.fileList = [];
    this.novoVisible = true;
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
      next: (chamado) => {
        const chamadoId = chamado?.id ?? (chamado as { ID?: number })?.ID;
        const arquivos = this.getArquivosSelecionados();
        if (!chamadoId || arquivos.length === 0) {
          this.finalizarCadastro();
          return;
        }
        this.uploadAnexos(chamadoId, arquivos)
          .then(() => this.finalizarCadastro())
          .catch(() => {
            this.message.warning('Solicitação criada, mas houve erro ao enviar um ou mais anexos.');
            this.finalizarCadastro();
          });
      },
      error: (e) => {
        this.message.error(e?.error?.message || e?.error || `Erro ao cadastrar (${e.status})`);
        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }

  private finalizarCadastro(): void {
    this.message.success('Solicitação cadastrada com sucesso!');
    this.salvando = false;
    this.novoVisible = false;
    this.fileList = [];
    this.carregar();
  }

  private uploadAnexos(chamadoId: number, arquivos: File[]): Promise<void> {
    return Promise.all(arquivos.map(arquivo => this.uploadUmAnexo(chamadoId, arquivo))).then(() => undefined);
  }

  private uploadUmAnexo(chamadoId: number, arquivo: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const guid = crypto.randomUUID();
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.http.post(`${this.api}/ArmazenamentoDeObjeto`, {
          codigo: guid,
          image: base64,
          pasta: String(this.codigoPessoa)
        }, { headers: this.h }).pipe(timeout(30000), catchError(() => of(null))).subscribe({
          next: () => {
            const uploadPayload = {
              chamadoId,
              dataCriacao: new Date().toISOString(),
              arquivo: guid,
              tipo: AREA_FIXA
            };
            this.http.post(`${this.api}/Chamado/ChamadoUpload`, uploadPayload, { headers: this.h })
              .pipe(timeout(15000))
              .subscribe({
                next: () => resolve(),
                error: (e) => reject(e)
              });
          },
          error: (e) => reject(e)
        });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(arquivo);
    });
  }

  visualizar(c: Chamado): void {
    this.selecionado = c;
    this.historico = [];
    this.anexos = [];
    this.viewVisible = true;
    this.carregandoHistorico = true;
    this.carregandoAnexos = true;
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

    this.http.get<ChamadoUpload[]>(`${this.api}/Chamado/ChamadoUpload/ObterPorCodigo/${c.id}`, { headers: this.h })
      .pipe(timeout(8000), catchError(() => of([] as ChamadoUpload[])))
      .subscribe({
        next: (a) => {
          this.anexos = a || [];
          this.carregandoAnexos = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregandoAnexos = false;
          this.cdr.markForCheck();
        }
      });
  }

  abrirAnexo(anexo: ChamadoUpload): void {
    const url = `${ARQUIVO_BASE_URL}?diretorioCompleto=${this.codigoPessoa}&nomeArquivo=${anexo.arquivo}`;
    window.open(url, '_blank');
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
