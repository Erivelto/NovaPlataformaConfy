import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { fmtCurrency, fmtDate } from '../utils/excel-export.helpers';
import { ArquivoService } from '../services/arquivo.service';
import { EnvioArquivoClienteComponent, ArquivoEnvioRef } from '../components/envio-arquivo-cliente.component';
import { environment } from '../../environments/environment';

interface NotaFiscal {
  numeroNFE: number;
  dataEmissao: string;
  cancelada?: boolean;
  excluido?: number;
  valorTotal?: number;
  valor?: string | number;
  tomador?: string;
  descricao?: string;
}

interface PessoaResumo {
  codigo: number;
  razao?: string;
  nome?: string;
  documento?: string;
  fisica?: boolean;
}

interface PessoaUploadNotas {
  codigo: number;
  codigoPessoa: number;
  arquivo: string;
  tipo: string;
  dataCriacao: string;
  numeroNfe?: number;
}

@Component({
  selector: 'app-gestao-faturamento-detalhe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTableModule, NzTagModule,
    NzAlertModule, NzIconModule, NzModalModule,
    NzSkeletonModule, NzDividerModule, NzButtonModule,
    NzDatePickerModule, NzSelectModule, NzMessageModule,
    NzFormModule, NzInputModule,
    NzUploadModule, NzPopconfirmModule, NzToolTipModule,
    PageTitleComponent, ExportExcelButtonComponent, EnvioArquivoClienteComponent
  ],
  template: `
    <div class="gestao-faturamento-detalhe">
      <div class="page-header">
        <button nz-button nzType="default" class="btn-voltar" (click)="voltar()">
          <i nz-icon nzType="arrow-left"></i> Voltar
        </button>
        <app-page-title
          class="page-header-title"
          title="Notas Fiscais"
          [subtitle]="subtituloCliente">
        </app-page-title>
      </div>

      <nz-card>
        <nz-alert
          *ngIf="erro"
          nzType="error"
          [nzMessage]="erro"
          nzShowIcon
          style="margin-bottom:12px">
        </nz-alert>

        <div class="filtros">
          <div class="filtros-periodo">
            <span class="filtro-label">Período de emissão</span>
            <nz-date-picker
              [(ngModel)]="dataInicial"
              nzFormat="dd/MM/yyyy"
              nzPlaceHolder="Data inicial"
              [nzAllowClear]="false">
            </nz-date-picker>
            <span class="filtro-sep">até</span>
            <nz-date-picker
              [(ngModel)]="dataFinal"
              nzFormat="dd/MM/yyyy"
              nzPlaceHolder="Data final"
              [nzAllowClear]="false">
            </nz-date-picker>

            <span class="filtro-label filtro-status-label">Status</span>
            <nz-select
              class="filtro-status"
              [(ngModel)]="filtroStatus"
              (ngModelChange)="filtrarNotas()"
              nzPlaceHolder="Status">
              <nz-option nzValue="todos" nzLabel="Todos"></nz-option>
              <nz-option nzValue="emitida" nzLabel="Emitida"></nz-option>
              <nz-option nzValue="cancelada" nzLabel="Cancelada"></nz-option>
            </nz-select>
          </div>

          <div class="filtros-acoes">
            <button nz-button nzType="default" (click)="aplicarPeriodoRapido('mes')">Último mês</button>
            <button nz-button nzType="default" (click)="aplicarPeriodoRapido('12m')">Últimos 12 meses</button>
            <button nz-button nzType="default" (click)="aplicarPeriodoRapido('ano')">Ano atual</button>
            <button nz-button nzType="primary" (click)="carregarNotas()" [nzLoading]="loadingNotas">
              <i nz-icon nzType="search"></i> Buscar
            </button>
          </div>
        </div>

        <div class="toolbar-resultado">
          <span class="resultado-info" *ngIf="!loadingNotas">
            {{ notasFiltradas.length }} nota(s) exibida(s)
            <ng-container *ngIf="notasBrutas.length !== notasFiltradas.length">
              · {{ notasBrutas.length }} retornada(s) pela API
            </ng-container>
          </span>
          <div class="toolbar-acoes">
            <button nz-button nzType="primary" (click)="abrirAddFaturamentoModal()">
              <i nz-icon nzType="plus"></i> Adic. Total NF
            </button>
            <button nz-button nzType="primary" class="btn-receita-anual" (click)="abrirReceitaAnual()">
              <i nz-icon nzType="bar-chart"></i> Receita Anual
            </button>
            <app-export-excel-button
              [data]="$any(notasFiltradas)"
              [columns]="exportColumns"
              [fileName]="exportFileName"
              [loading]="loadingNotas" />
          </div>
        </div>

        <ng-container *ngIf="loadingNotas">
          <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 6 }"></nz-skeleton>
        </ng-container>

        <nz-table
          *ngIf="!loadingNotas"
          [nzData]="notasFiltradas"
          nzBordered
          nzSize="middle"
          [nzShowPagination]="notasFiltradas.length > 10"
          [nzPageSize]="10">
          <thead>
            <tr>
              <th nzWidth="120px">Nº da Nota</th>
              <th nzWidth="140px">Data de Emissão</th>
              <th>Valor</th>
              <th nzWidth="140px">Status</th>
              <th nzWidth="220px" nzAlign="center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of notasFiltradas" [class.row-cancelada]="item.cancelada">
              <td>{{ item.numeroNFE }}</td>
              <td>{{ item.dataEmissao | date:'dd/MM/yyyy' }}</td>
              <td>{{ parseBrl(item.valor) | currency:'BRL':'symbol':'1.2-2' }}</td>
              <td>
                <nz-tag [nzColor]="item.cancelada ? 'red' : 'green'">
                  {{ item.cancelada ? 'Cancelada' : 'Emitida' }}
                </nz-tag>
              </td>
              <td nzAlign="center" class="acoes-cell">
                <button nz-button nzSize="small" (click)="verDetalhe(item)">
                  <i nz-icon nzType="eye"></i> Ver
                </button>
                <button
                  nz-button
                  nzSize="small"
                  nzType="default"
                  nz-tooltip
                  [nzTooltipTitle]="temAnexo(item.numeroNFE) ? 'PDF anexado — baixar ou enviar' : 'Anexar PDF da NF-e'"
                  (click)="abrirAnexoModal(item)">
                  <i nz-icon [nzType]="temAnexo(item.numeroNFE) ? 'file-text' : 'paper-clip'"></i>
                  {{ temAnexo(item.numeroNFE) ? 'PDF' : 'Anexar' }}
                </button>
              </td>
            </tr>
            <tr *ngIf="notasFiltradas.length === 0">
              <td colspan="5" style="text-align:center; color:rgba(0,0,0,0.45); padding:32px">
                Nenhuma nota fiscal encontrada com os filtros selecionados.
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <nz-modal
      [(nzVisible)]="detalheVisible"
      nzTitle="Detalhes da Nota Fiscal"
      [nzWidth]="620"
      [nzFooter]="null"
      (nzOnCancel)="detalheVisible = false">
      <ng-container *nzModalContent>
        <ng-container *ngIf="notaSelecionada">
          <div class="detalhe-grid">
            <div class="detalhe-row">
              <div class="detalhe-field">
                <label class="detalhe-label"><i nz-icon nzType="number"></i> Nº da Nota</label>
                <div class="detalhe-value">{{ notaSelecionada.numeroNFE }}</div>
              </div>
              <div class="detalhe-field">
                <label class="detalhe-label"><i nz-icon nzType="calendar"></i> Data de Emissão</label>
                <div class="detalhe-value">{{ notaSelecionada.dataEmissao | date:'dd/MM/yyyy' }}</div>
              </div>
              <div class="detalhe-field">
                <label class="detalhe-label"><i nz-icon nzType="dollar"></i> Valor</label>
                <div class="detalhe-value">{{ parseBrl(notaSelecionada.valor) | currency:'BRL':'symbol':'1.2-2' }}</div>
              </div>
            </div>
            <div class="detalhe-row">
              <div class="detalhe-field" style="flex:0 0 auto">
                <label class="detalhe-label"><i nz-icon nzType="info-circle"></i> Status</label>
                <div class="detalhe-value">
                  <nz-tag [nzColor]="notaSelecionada.cancelada ? 'red' : 'green'">
                    {{ notaSelecionada.cancelada ? 'Cancelada' : 'Emitida' }}
                  </nz-tag>
                </div>
              </div>
              <div class="detalhe-field" style="flex:2">
                <label class="detalhe-label"><i nz-icon nzType="user"></i> Tomador(Cliente)</label>
                <div class="detalhe-value">{{ notaSelecionada.tomador || '—' }}</div>
              </div>
            </div>
            <nz-divider></nz-divider>
            <div class="detalhe-field">
              <label class="detalhe-label"><i nz-icon nzType="file-text"></i> Descrição dos Serviços</label>
              <div class="detalhe-value detalhe-descricao">{{ notaSelecionada.descricao || '—' }}</div>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </nz-modal>

    <nz-modal
      [(nzVisible)]="anexoVisible"
      [nzTitle]="'Anexo NF-e ' + (notaAnexo?.numeroNFE ?? '')"
      [nzWidth]="520"
      [nzFooter]="footerAnexo"
      (nzOnCancel)="fecharAnexoModal()">
      <ng-container *nzModalContent>
        <ng-container *ngIf="anexoAtual; else uploadAnexo">
          <p style="margin-bottom:12px;color:rgba(0,0,0,.65)">
            PDF anexado em {{ anexoAtual.dataCriacao | date:'dd/MM/yyyy HH:mm' }}
          </p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button nz-button nzType="primary" (click)="baixarAnexo()">
              <i nz-icon nzType="download"></i> Baixar PDF
            </button>
            <button nz-button nzType="default" (click)="abrirEnvioAnexo()">
              <i nz-icon nzType="mail"></i> Enviar ao cliente
            </button>
            <button
              nz-button
              nzDanger
              [nzLoading]="excluindoAnexo"
              nz-popconfirm
              nzPopconfirmTitle="Excluir anexo desta NF-e?"
              (nzOnConfirm)="excluirAnexo()">
              <i nz-icon nzType="delete"></i> Excluir
            </button>
          </div>
          <nz-alert
            nzType="info"
            nzMessage="Esta NF-e já possui anexo. Para enviar outro arquivo, exclua o atual."
            nzShowIcon
            style="margin-top:16px">
          </nz-alert>
        </ng-container>
        <ng-template #uploadAnexo>
          <p style="margin-bottom:12px;color:rgba(0,0,0,.65)">
            Anexe o PDF da NF-e <strong>{{ notaAnexo?.numeroNFE }}</strong> (tipo: Notas Fiscal).
          </p>
          <nz-upload
            nzAction=""
            [nzBeforeUpload]="beforeUploadAnexo"
            [nzFileList]="fileListAnexo"
            nzAccept=".pdf"
            [nzMultiple]="false">
            <button nz-button><i nz-icon nzType="upload"></i> Selecionar PDF</button>
          </nz-upload>
        </ng-template>
      </ng-container>
      <ng-template #footerAnexo>
        <button nz-button (click)="fecharAnexoModal()" [disabled]="fazendoUploadAnexo">Fechar</button>
        <button
          *ngIf="!anexoAtual"
          nz-button
          nzType="primary"
          [nzLoading]="fazendoUploadAnexo"
          (click)="enviarAnexo()">
          Enviar
        </button>
      </ng-template>
    </nz-modal>

    <app-envio-arquivo-cliente
      [(visible)]="envioVisible"
      [itens]="envioItens" />

    <nz-modal
      [(nzVisible)]="addFaturamentoVisible"
      nzTitle="Adic. Total NF"
      [nzWidth]="440"
      [nzFooter]="footerAddFaturamento"
      (nzOnCancel)="fecharAddFaturamentoModal()">
      <ng-container *nzModalContent>
        <nz-alert
          nzType="warning"
          nzMessage="Atenção"
          nzDescription="Informe o mês/ano e o valor do faturamento. Os dados serão registrados como nota fiscal manual (status Prefeitura)."
          nzShowIcon
          style="margin-bottom:16px">
        </nz-alert>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Mês/Ano</nz-form-label>
          <nz-form-control [nzSpan]="24" nzExtra="Formato: MM/AAAA">
            <input
              nz-input
              placeholder="MM/AAAA"
              [(ngModel)]="addFaturamentoMesAno"
              maxlength="7"
              (input)="formatarMesAnoFaturamento($event)" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Valor</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <input
              nz-input
              [value]="addFaturamentoValor"
              (input)="onAddFaturamentoValorInput($event)"
              placeholder="R$ 0,00"
              inputmode="numeric"
              style="width:220px" />
          </nz-form-control>
        </nz-form-item>
      </ng-container>
      <ng-template #footerAddFaturamento>
        <button nz-button (click)="fecharAddFaturamentoModal()" [disabled]="salvandoAddFaturamento">Cancelar</button>
        <button nz-button nzType="primary" (click)="salvarAddFaturamento()" [nzLoading]="salvandoAddFaturamento">Salvar</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .gestao-faturamento-detalhe { padding: 8px 4px; }
    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }
    .page-header-title { flex: 1; min-width: 220px; }
    .btn-voltar { flex-shrink: 0; margin-top: 12px; }
    .btn-receita-anual {
      background: #52c41a;
      border-color: #52c41a;
    }
    .btn-receita-anual:hover, .btn-receita-anual:focus {
      background: #73d13d;
      border-color: #73d13d;
    }
    .filtros {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: flex-end;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
    .filtros-periodo {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filtro-label {
      font-weight: 600;
      color: rgba(0,0,0,.65);
      margin-right: 4px;
    }
    .filtro-sep { color: rgba(0,0,0,.45); }
    .filtro-status-label { margin-left: 8px; }
    .filtro-status { min-width: 140px; }
    .filtros-acoes {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .toolbar-resultado {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .toolbar-acoes {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .resultado-info { color: rgba(0,0,0,.45); font-size: .9rem; }
    .row-cancelada td { color: #cf1322 !important; }
    .detalhe-grid { display: flex; flex-direction: column; gap: 16px; }
    .detalhe-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .detalhe-field { flex: 1; min-width: 140px; }
    .detalhe-label {
      display: block;
      font-weight: 600;
      color: rgba(0,0,0,0.55);
      font-size: 12px;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: .4px;
    }
    .detalhe-value {
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      padding: 6px 10px;
      color: rgba(0,0,0,0.85);
      min-height: 34px;
    }
    .detalhe-descricao { white-space: pre-wrap; min-height: 80px; }
    .acoes-cell { white-space: nowrap; }
    .acoes-cell .ant-btn { margin: 0 2px; }
  `]
})
export class GestaoFaturamentoDetalheComponent implements OnInit {
  private readonly api = environment.apiUrl;
  private readonly tipoAnexoNfe = 'Notas Fiscal';

  codigoPessoa = 0;
  loadingCliente = true;
  loadingNotas = false;
  erro = '';
  notasBrutas: NotaFiscal[] = [];
  notasFiltradas: NotaFiscal[] = [];
  cliente: PessoaResumo | null = null;

  dataInicial: Date = new Date();
  dataFinal: Date = new Date();
  filtroStatus: 'todos' | 'emitida' | 'cancelada' = 'todos';

  detalheVisible = false;
  notaSelecionada: NotaFiscal | null = null;

  anexoVisible = false;
  notaAnexo: NotaFiscal | null = null;
  anexoAtual: PessoaUploadNotas | null = null;
  anexosPorNfe = new Map<number, PessoaUploadNotas>();
  fileListAnexo: NzUploadFile[] = [];
  selectedFileAnexo: File | null = null;
  fazendoUploadAnexo = false;
  excluindoAnexo = false;

  envioVisible = false;
  envioItens: ArquivoEnvioRef[] = [];

  addFaturamentoVisible = false;
  addFaturamentoMesAno = '';
  addFaturamentoValor = '';
  salvandoAddFaturamento = false;

  readonly exportColumns: ExcelExportColumn[] = [
    { key: 'numeroNFE', title: 'Nº da Nota' },
    { key: 'dataEmissao', title: 'Data de Emissão', format: fmtDate },
    { key: 'valor', title: 'Valor', format: v => fmtCurrency(this.parseBrl(v as string | number)) },
    { key: 'cancelada', title: 'Status', format: v => v ? 'Cancelada' : 'Emitida' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private message: NzMessageService,
    private arquivoService: ArquivoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.codigoPessoa = Number(id);
    if (!this.codigoPessoa) {
      this.erro = 'Cliente inválido.';
      this.loadingCliente = false;
      return;
    }
    this.aplicarPeriodoRapido('ano', false);
    this.carregarCliente();
    this.carregarAnexos();
    this.carregarNotas();
  }

  get subtituloCliente(): string {
    if (this.loadingCliente) return 'Carregando cliente...';
    if (!this.cliente) return `Cliente #${this.codigoPessoa}`;
    const nome = this.cliente.razao || this.cliente.nome || `Cliente #${this.codigoPessoa}`;
    const doc = this.cliente.documento ? ` · ${this.cliente.documento}` : '';
    const tipo = this.cliente.fisica ? 'Física' : 'Online';
    return `${nome}${doc} · ${tipo}`;
  }

  get exportFileName(): string {
    return `notas-fiscais-cliente-${this.codigoPessoa}`;
  }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  aplicarPeriodoRapido(tipo: 'mes' | '12m' | 'ano', recarregar = true): void {
    const hoje = this.inicioDoDia(new Date());

    if (tipo === 'mes') {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      this.dataInicial = inicio;
      this.dataFinal = fim;
    } else if (tipo === '12m') {
      const inicio = new Date(hoje);
      inicio.setMonth(inicio.getMonth() - 12);
      this.dataInicial = inicio;
      this.dataFinal = hoje;
    } else {
      this.dataInicial = new Date(hoje.getFullYear(), 0, 1);
      this.dataFinal = hoje;
    }

    this.cdr.markForCheck();
    if (recarregar) this.carregarNotas();
  }

  carregarCliente(): void {
    this.loadingCliente = true;
    this.cdr.markForCheck();

    this.http.get<PessoaResumo>(`${this.api}/Pessoa/${this.codigoPessoa}`, { headers: this.headers })
      .pipe(timeout(8000), catchError(() => of(null)))
      .subscribe({
        next: (pessoa) => {
          this.cliente = pessoa;
          this.loadingCliente = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingCliente = false;
          this.cdr.markForCheck();
        }
      });
  }

  carregarNotas(): void {
    if (!this.validarPeriodo()) return;

    this.loadingNotas = true;
    this.erro = '';
    this.notasBrutas = [];
    this.notasFiltradas = [];
    this.cdr.markForCheck();

    const params = new HttpParams()
      .set('inicial', this.formatDateParam(this.dataInicial))
      .set('final', this.formatDateParam(this.dataFinal));

    this.http.get<NotaFiscal[]>(`${this.api}/CorpoEmissaoNota/NotasFiscais/${this.codigoPessoa}`, {
      headers: this.headers,
      params
    }).pipe(timeout(15000), catchError(() => of([] as NotaFiscal[]))).subscribe({
      next: (notas) => {
        const raw = Array.isArray(notas) ? notas : [];
        this.notasBrutas = raw
          .map((n: any) => this.normalizarNota(n))
          .sort((a, b) => {
            const nfeA = a.numeroNFE ?? 0;
            const nfeB = b.numeroNFE ?? 0;
            if (nfeB !== nfeA) return nfeB - nfeA;
            return new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime();
          });
        this.filtrarNotas();
        this.loadingNotas = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.erro = `Erro ao carregar notas fiscais (${err.status ?? 'sem resposta'}). Tente novamente.`;
        this.loadingNotas = false;
        this.cdr.markForCheck();
      }
    });
  }

  filtrarNotas(): void {
    let base = this.notasBrutas.filter(n => this.notaNoPeriodo(n.dataEmissao));

    if (this.filtroStatus === 'emitida') {
      base = base.filter(n => !n.cancelada);
    } else if (this.filtroStatus === 'cancelada') {
      base = base.filter(n => n.cancelada);
    }

    this.notasFiltradas = base;
    this.cdr.markForCheck();
  }

  private notaNoPeriodo(dataEmissao: string): boolean {
    const emissao = this.dataEmissaoLocal(dataEmissao).getTime();
    const inicio = this.inicioDoDia(this.dataInicial).getTime();
    const fim = this.inicioDoDia(this.dataFinal).getTime();
    return emissao >= inicio && emissao <= fim;
  }

  private dataEmissaoLocal(dataEmissao: string): Date {
    const s = String(dataEmissao ?? '');
    const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return new Date(0);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private normalizarNota(n: any): NotaFiscal {
    return {
      ...n,
      cancelada: n.cancelada === true || n.Cancelada === true || n.excluido === 1,
      valor: n.valor ?? n.Valor ?? n.valorTotal ?? 0
    };
  }

  private validarPeriodo(): boolean {
    if (!this.dataInicial || !this.dataFinal) {
      this.message.warning('Informe a data inicial e final.');
      return false;
    }
    if (this.inicioDoDia(this.dataInicial).getTime() > this.inicioDoDia(this.dataFinal).getTime()) {
      this.message.warning('A data inicial não pode ser maior que a data final.');
      return false;
    }
    return true;
  }

  private formatDateParam(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private inicioDoDia(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  parseBrl(valor: string | number | undefined | null): number {
    if (valor == null) return 0;
    if (typeof valor === 'number') return valor;
    const s = String(valor);
    if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    return parseFloat(s) || 0;
  }

  verDetalhe(nota: NotaFiscal): void {
    this.notaSelecionada = nota;
    this.detalheVisible = true;
    this.cdr.markForCheck();
  }

  temAnexo(numeroNfe: number): boolean {
    return this.anexosPorNfe.has(this.nfeKey(numeroNfe));
  }

  private nfeKey(numero: number | string | undefined | null): number {
    return Number(numero ?? 0);
  }

  carregarAnexos(): void {
    this.http.get<any[]>(`${this.api}/PessoaUploadNotas/ObterPorCodigo/${this.codigoPessoa}`, { headers: this.headers })
      .pipe(timeout(10000), catchError(() => of([])))
      .subscribe(lista => {
        this.anexosPorNfe.clear();
        (lista || []).forEach(item => {
          const anexo = this.mapAnexo(item);
          if (anexo.numeroNfe) this.anexosPorNfe.set(this.nfeKey(anexo.numeroNfe), anexo);
        });
        this.cdr.markForCheck();
      });
  }

  abrirAnexoModal(nota: NotaFiscal): void {
    this.notaAnexo = nota;
    const key = this.nfeKey(nota.numeroNFE);
    this.anexoAtual = this.anexosPorNfe.get(key) ?? null;
    this.fileListAnexo = [];
    this.selectedFileAnexo = null;
    this.anexoVisible = true;

    this.http.get<any>(`${this.api}/PessoaUploadNotas/PorNota/${this.codigoPessoa}/${nota.numeroNFE}`, { headers: this.headers })
      .pipe(timeout(8000), catchError(() => of(null)))
      .subscribe(raw => {
        if (raw && (raw.codigo || raw.Codigo)) {
          this.anexoAtual = this.mapAnexo(raw);
          this.anexosPorNfe.set(key, this.anexoAtual);
        } else {
          this.anexoAtual = null;
          this.anexosPorNfe.delete(key);
        }
        this.cdr.markForCheck();
      });
  }

  fecharAnexoModal(): void {
    this.anexoVisible = false;
    this.notaAnexo = null;
    this.anexoAtual = null;
    this.fileListAnexo = [];
    this.selectedFileAnexo = null;
    this.cdr.markForCheck();
  }

  beforeUploadAnexo = (file: NzUploadFile): boolean => {
    if (this.anexoAtual) {
      this.message.warning('Exclua o anexo atual antes de enviar outro arquivo.');
      return false;
    }
    const ext = (file.name || '').split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') {
      this.message.error('Apenas arquivos PDF são aceitos.');
      this.fileListAnexo = [];
      this.selectedFileAnexo = null;
      this.cdr.markForCheck();
      return false;
    }
    this.selectedFileAnexo = file as unknown as File;
    this.fileListAnexo = [file];
    this.cdr.markForCheck();
    return false;
  };

  enviarAnexo(): void {
    if (this.anexoAtual) {
      this.message.warning('Esta NF-e já possui anexo.');
      return;
    }
    if (!this.notaAnexo) return;
    if (!this.selectedFileAnexo) {
      this.message.warning('Selecione um arquivo PDF.');
      return;
    }

    this.fazendoUploadAnexo = true;
    this.cdr.markForCheck();

    const arquivoGuid = crypto.randomUUID();
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.http.post(`${this.api}/ArmazenamentoDeObjeto`, {
        codigo: arquivoGuid,
        image: base64,
        pasta: String(this.codigoPessoa)
      }, { headers: this.headers }).pipe(timeout(60000), catchError(() => of(null))).subscribe({
        next: (res) => {
          if (res === null) {
            this.message.error('Erro ao enviar arquivo para o armazenamento.');
            this.fazendoUploadAnexo = false;
            this.cdr.markForCheck();
            return;
          }

          const payload = {
            codigoPessoa: this.codigoPessoa,
            dataCriacao: new Date().toISOString(),
            arquivo: arquivoGuid,
            tipo: this.tipoAnexoNfe,
            excluido: false,
            numeroNfe: this.notaAnexo!.numeroNFE
          };

          this.http.post(`${this.api}/PessoaUploadNotas`, payload, { headers: this.headers }).subscribe({
            next: (raw: any) => {
              this.message.success('Anexo enviado com sucesso!');
              this.anexoAtual = this.mapAnexo(raw);
              this.anexosPorNfe.set(this.nfeKey(this.notaAnexo!.numeroNFE), this.anexoAtual);
              this.fazendoUploadAnexo = false;
              this.fileListAnexo = [];
              this.selectedFileAnexo = null;
              this.cdr.markForCheck();
            },
            error: (err) => {
              const msg = err?.error?.message || err?.error || `Erro ao registrar anexo (${err.status}).`;
              this.message.error(typeof msg === 'string' ? msg : `Erro ao registrar anexo (${err.status}).`);
              this.fazendoUploadAnexo = false;
              this.cdr.markForCheck();
            }
          });
        }
      });
    };
    reader.onerror = () => {
      this.message.error('Erro ao ler o arquivo selecionado.');
      this.fazendoUploadAnexo = false;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(this.selectedFileAnexo);
  }

  baixarAnexo(): void {
    if (!this.anexoAtual) return;
    this.arquivoService.abrir(this.anexoAtual.codigoPessoa, this.anexoAtual.arquivo, this.anexoAtual.tipo);
  }

  abrirEnvioAnexo(): void {
    if (!this.anexoAtual || !this.notaAnexo) {
      this.message.warning('Anexo não disponível para envio.');
      return;
    }

    const nome = this.cliente?.razao || this.cliente?.nome || `Cliente #${this.codigoPessoa}`;
    const numero = this.notaAnexo.numeroNFE;
    this.envioItens = [{
      codigoPessoa: this.codigoPessoa,
      nome,
      nomeArquivo: this.anexoAtual.arquivo,
      tipoArquivo: `Notas Fiscal NF-e ${numero}`,
      categoria: 'Documento'
    }];
    this.envioVisible = true;
    this.cdr.markForCheck();
  }

  excluirAnexo(): void {
    if (!this.anexoAtual || !this.notaAnexo) return;
    this.excluindoAnexo = true;
    this.cdr.markForCheck();

    this.http.delete(`${this.api}/PessoaUploadNotas/ExcluirUpload/${this.anexoAtual.codigo}`, { headers: this.headers })
      .subscribe({
        next: () => {
          this.message.success('Anexo excluído.');
          this.anexosPorNfe.delete(this.notaAnexo!.numeroNFE);
          this.anexoAtual = null;
          this.excluindoAnexo = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          const msg = err?.error?.message || err?.error || `Erro ao excluir anexo (${err.status}).`;
          this.message.error(typeof msg === 'string' ? msg : `Erro ao excluir anexo (${err.status}).`);
          this.excluindoAnexo = false;
          this.cdr.markForCheck();
        }
      });
  }

  private mapAnexo(raw: any): PessoaUploadNotas {
    return {
      codigo: raw.codigo ?? raw.Codigo,
      codigoPessoa: raw.codigoPessoa ?? raw.CodigoPessoa,
      arquivo: String(raw.arquivo ?? raw.Arquivo),
      tipo: raw.tipo ?? raw.Tipo ?? this.tipoAnexoNfe,
      dataCriacao: raw.dataCriacao ?? raw.DataCriacao,
      numeroNfe: Number(raw.numeroNfe ?? raw.NumeroNfe ?? 0) || undefined
    };
  }

  voltar(): void {
    this.router.navigate(['/administrativo/gestao-faturamento']);
  }

  abrirReceitaAnual(): void {
    this.router.navigate(['/administrativo/receita-anual', this.codigoPessoa]);
  }

  abrirAddFaturamentoModal(): void {
    this.addFaturamentoMesAno = '';
    this.addFaturamentoValor = 'R$ 0,00';
    this.addFaturamentoVisible = true;
    this.cdr.markForCheck();
  }

  fecharAddFaturamentoModal(): void {
    this.addFaturamentoVisible = false;
    this.cdr.markForCheck();
  }

  formatarMesAnoFaturamento(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 6);
    this.addFaturamentoMesAno = v;
    input.value = v;
  }

  onAddFaturamentoValorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '');
    digits = digits.replace(/^0+/, '') || '0';
    while (digits.length < 3) digits = '0' + digits;
    const intPart = digits.slice(0, -2);
    const decPart = digits.slice(-2);
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    this.addFaturamentoValor = `R$ ${intFormatted},${decPart}`;
    setTimeout(() => {
      input.value = this.addFaturamentoValor;
      const len = input.value.length;
      input.setSelectionRange(len, len);
    });
  }

  salvarAddFaturamento(): void {
    const mesAno = this.addFaturamentoMesAno.trim();
    const valorStr = this.addFaturamentoValor.trim();

    if (!/^\d{2}\/\d{4}$/.test(mesAno)) {
      this.message.warning('Informe o mês/ano no formato MM/AAAA.');
      return;
    }
    if (!valorStr || valorStr === 'R$ 0,00') {
      this.message.warning('Informe o valor.');
      return;
    }

    const [mesStr, anoStr] = mesAno.split('/');
    const mes = parseInt(mesStr, 10);
    const ano = parseInt(anoStr, 10);

    if (mes < 1 || mes > 12) {
      this.message.warning('Mês inválido.');
      return;
    }

    const valorDecimal = parseFloat(valorStr.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
    if (isNaN(valorDecimal) || valorDecimal <= 0) {
      this.message.warning('Valor inválido.');
      return;
    }

    this.salvandoAddFaturamento = true;
    this.cdr.markForCheck();

    this.http
      .get<number>(`${this.api}/NotaFiscal/NotaFiscal/UltimaNfe/${this.codigoPessoa}`, { headers: this.headers })
      .subscribe({
        next: (ultimaNfe) => {
          const nfe = typeof ultimaNfe === 'number' ? ultimaNfe : 0;
          const mesPad = String(mes).padStart(2, '0');
          const body = {
            codigoPessoa: this.codigoPessoa,
            codigoVerificacao: '',
            urlNfe: '',
            dataEmissao: `${ano}-${mesPad}-01T00:00:00`,
            valorTotal: valorDecimal,
            numeroNFE: nfe + 1,
            statusPrefeitura: 'P',
            dataEnvio: new Date().toISOString()
          };

          this.http
            .post(`${this.api}/NotaFiscal`, body, { headers: this.headers })
            .subscribe({
              next: () => {
                this.salvandoAddFaturamento = false;
                this.addFaturamentoVisible = false;
                this.message.success('Nota fiscal adicionada com sucesso!');
                this.carregarNotas();
                this.cdr.markForCheck();
              },
              error: (err) => {
                this.salvandoAddFaturamento = false;
                this.message.error(`Erro ao salvar nota fiscal (${err.status}).`);
                this.cdr.markForCheck();
              }
            });
        },
        error: (err) => {
          this.salvandoAddFaturamento = false;
          this.message.error(`Erro ao buscar última NF (${err.status}).`);
          this.cdr.markForCheck();
        }
      });
  }
}
