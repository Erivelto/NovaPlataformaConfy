import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { fmtCurrency, fmtDate } from '../utils/excel-export.helpers';
import { LoginService } from '../services/login.service';
import { ArquivoService } from '../services/arquivo.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

const AREA_FIXA = 'Contabilidade';
const ATENDENTE_FIXO = 'Analista Contabil';
const PRIORIDADE_PADRAO = 2;
const TIPO_GUIA_PAGAMENTO = 'Atualização guia pagamento';

type AbaImposto = 'das' | 'parcelamentoReceita' | 'parcelamentoPrefeitura' | 'inss' | 'tfe';

interface DasItem {
  codigo: number;
  codigoPessoa: number;
  periodo: string;
  valorTributado: string;
  valorTributo: string;
  mensagem: string;
  data: string;
  excluido: boolean;
  status: string;
  nomeArquivo: string;
  statusContfy: string | null;
  documento: string | null;
  razao: string | null;
}

interface ArquivoDebito {
  codigo: number;
  codigoPessoa: number;
  parcela?: number;
  tipo: string;
  dataVencimento?: string;
  dataCriacao?: string;
  arquivo: string;
}

interface AbaConfig {
  id: AbaImposto;
  titulo: string;
  modoDas: boolean;
  endpoint?: string;
  filtroTipo?: string;
}

@Component({
  selector: 'app-receita-imposto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzCardModule, NzTabsModule, NzTableModule, NzTagModule,
    NzAlertModule, NzIconModule, NzButtonModule,
    NzSkeletonModule, NzMessageModule,
    PageTitleComponent, ExportExcelButtonComponent
  ],
  template: `
    <div class="receita-imposto">
      <app-page-title title="Impostos/Debitos" subtitle="Impostos e Obrigações"></app-page-title>

      <nz-alert
        nzType="warning"
        nzShowIcon
        nzMessage="Atenção à TFE (Taxa de Fiscalização de Estabelecimentos)"
        nzDescription="Geralmente, a prefeitura envia o boleto desta taxa diretamente para o endereço cadastrado da empresa. Se você não recebeu o documento ou está com o pagamento pendente, entre em contato. Nossa equipe está à disposição para realizar o levantamento dos valores e ajudar na regularização."
        style="margin-top:16px">
      </nz-alert>

      <nz-card style="margin-top:16px">
        <nz-tabset [(nzSelectedIndex)]="abaIndex" (nzSelectedIndexChange)="onAbaChange($event)">
          <nz-tab *ngFor="let aba of abas" [nzTitle]="aba.titulo">
            <div class="tab-content">
              <nz-alert
                *ngIf="aba.modoDas && erro"
                nzType="error"
                [nzMessage]="erro"
                nzShowIcon
                style="margin-bottom:12px">
              </nz-alert>

              <ng-container *ngIf="carregando.has(aba.id)">
                <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 4 }"></nz-skeleton>
              </ng-container>

              <!-- Aba DAS -->
              <ng-container *ngIf="aba.modoDas && !carregando.has(aba.id)">
                <div style="margin-bottom:12px;display:flex;justify-content:flex-end">
                  <app-export-excel-button [data]="$any(listaDas)" [columns]="exportColumnsDas" fileName="impostos-das" />
                </div>
                <nz-table
                  #dasTable
                  [nzData]="listaDas"
                  nzBordered
                  nzSize="middle"
                  [nzShowPagination]="listaDas.length > pageSize"
                  [nzPageSize]="pageSize"
                  [nzFrontPagination]="true"
                  [(nzPageIndex)]="pageIndex[aba.id]">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Data Vencimento</th>
                      <th>Valor Tributado</th>
                      <th>Valor Tributo</th>
                      <th nzAlign="center">Status</th>
                      <th>Mensagem</th>
                      <th nzWidth="220px" nzAlign="center">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of dasTable.data">
                      <td>{{ item.periodo }}</td>
                      <td>{{ vencimento(item.periodo) | date:'dd/MM/yyyy' }}</td>
                      <td>{{ parseBrl(item.valorTributado) | currency:'BRL':'symbol':'1.2-2' }}</td>
                      <td>{{ item.valorTributo }}</td>
                      <td nzAlign="center">
                        <nz-tag *ngIf="item.status !== 'Pago'" [nzColor]="statusDasItem(item) === 'Disponível' ? 'green' : 'red'">{{ statusDasItem(item) }}</nz-tag>
                      </td>
                      <td>
                        <span *ngIf="dasVencido(item)" class="msg-vencida">
                          Vencida, não pode ser paga, solicite uma nova!
                        </span>
                        <span *ngIf="!dasVencido(item)">—</span>
                      </td>
                      <td nzAlign="center" class="acoes-arquivo">
                        <ng-container *ngIf="item.status !== 'Pago' && isValorZero(item)">
                          <button nz-button nzType="default" nzSize="small" (click)="gerarBoletoDas(item)">
                            <i nz-icon nzType="download"></i> Baixar
                          </button>
                        </ng-container>
                        <ng-container *ngIf="item.status !== 'Pago' && temTributoDas(item)">
                          <button nz-button nzType="primary" nzSize="small"
                            [disabled]="dasVencido(item)"
                            (click)="gerarBoletoDas(item)">
                            <i nz-icon nzType="file-text"></i> Gerar Boleto
                          </button>
                          <button nz-button nzType="default" nzSize="small"
                            [nzLoading]="salvando.has(item.codigo)"
                            (click)="marcarComoPaga(item)">
                            <i nz-icon nzType="check-circle"></i> Marca como paga
                          </button>
                          <button
                            *ngIf="dasVencido(item)"
                            nz-button
                            nzType="default"
                            nzSize="small"
                            [nzLoading]="solicitando.has(item.codigo)"
                            (click)="solicitarNovaGuiaDas(item)">
                            <i nz-icon nzType="plus"></i> Solicitar Novo
                          </button>
                        </ng-container>
                        <nz-tag *ngIf="item.status === 'Pago'" nzColor="green">Pago</nz-tag>
                      </td>
                    </tr>
                    <tr *ngIf="listaDas.length === 0">
                      <td colspan="7" class="empty">Nenhum DAS encontrado.</td>
                    </tr>
                  </tbody>
                </nz-table>
              </ng-container>

              <!-- Abas de documentos -->
              <ng-container *ngIf="!aba.modoDas && !carregando.has(aba.id)">
                <div style="margin-bottom:12px;display:flex;justify-content:flex-end">
                  <app-export-excel-button
                    [data]="$any(listas[aba.id])"
                    [columns]="exportColumnsArquivo(aba)"
                    [fileName]="'impostos-' + aba.id" />
                </div>
                <nz-table
                  #arquivoTable
                  [nzData]="listas[aba.id]"
                  nzBordered
                  nzSize="middle"
                  [nzShowPagination]="listas[aba.id].length > pageSize"
                  [nzPageSize]="pageSize"
                  [nzFrontPagination]="true"
                  [(nzPageIndex)]="pageIndex[aba.id]">
                  <thead>
                    <tr>
                      <th *ngIf="aba.id === 'parcelamentoReceita' || aba.id === 'parcelamentoPrefeitura'" nzWidth="80px">Parcela</th>
                      <th *ngIf="aba.id !== 'parcelamentoReceita' && aba.id !== 'parcelamentoPrefeitura'">Tipo</th>
                      <th nzWidth="120px">Vencimento</th>
                      <th nzWidth="120px">Cadastro</th>
                      <th>Mensagem</th>
                      <th nzWidth="200px" nzAlign="center">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of arquivoTable.data">
                      <td *ngIf="aba.id === 'parcelamentoReceita' || aba.id === 'parcelamentoPrefeitura'">{{ item.parcela ?? '—' }}</td>
                      <td *ngIf="aba.id !== 'parcelamentoReceita' && aba.id !== 'parcelamentoPrefeitura'"><nz-tag>{{ item.tipo || '—' }}</nz-tag></td>
                      <td>{{ formatarData(item.dataVencimento) }}</td>
                      <td>{{ formatarData(item.dataCriacao) }}</td>
                      <td>
                        <span *ngIf="estaVencida(item)" class="msg-vencida">
                          Vencida, não pode ser paga, solicite uma nova!
                        </span>
                        <span *ngIf="!estaVencida(item)">—</span>
                      </td>
                      <td nzAlign="center" class="acoes-arquivo">
                        <button
                          nz-button
                          nzType="primary"
                          nzSize="small"
                          [disabled]="estaVencida(item)"
                          (click)="abrirArquivo(item, aba)">
                          <i nz-icon nzType="download"></i> Baixar
                        </button>
                        <button
                          *ngIf="estaVencida(item)"
                          nz-button
                          nzType="default"
                          nzSize="small"
                          [nzLoading]="solicitando.has(item.codigo)"
                          (click)="solicitarNovo(aba, item)">
                          <i nz-icon nzType="plus"></i> Solicitar Novo
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="listas[aba.id].length === 0">
                      <td [attr.colspan]="5" class="empty">
                        Nenhum documento encontrado.
                      </td>
                    </tr>
                  </tbody>
                </nz-table>
              </ng-container>
            </div>
          </nz-tab>
        </nz-tabset>
      </nz-card>
    </div>
  `,
  styles: [`
    .receita-imposto { padding: 8px 4px; }
    .tab-content { padding: 8px 4px; }
    .empty { text-align: center; color: rgba(0,0,0,.45); padding: 32px 0; }
    .acoes-arquivo { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
    .msg-vencida { color: #ff4d4f; font-weight: 600; font-size: 0.88rem; }
  `]
})
export class ReceitaImpostoComponent implements OnInit {
  private readonly apiBase = environment.apiUrl;

  readonly abas: AbaConfig[] = [
    { id: 'das', titulo: 'DAS', modoDas: true },
    { id: 'parcelamentoReceita', titulo: 'Parcelamento Receita', modoDas: false, endpoint: 'PessoaPrefeituraDASDebitos', filtroTipo: 'Receita' },
    { id: 'parcelamentoPrefeitura', titulo: 'Parcelamento Prefeitura', modoDas: false, endpoint: 'PessoaPrefeituraDASDebitos', filtroTipo: 'Prefeitura' },
    { id: 'inss', titulo: 'Prolabore/INSS', modoDas: false, endpoint: 'PessoaINSS' },
    { id: 'tfe', titulo: 'TFE', modoDas: false, endpoint: 'PessoaTFE' }
  ];

  abaIndex = 0;
  listaDas: DasItem[] = [];
  listas: Record<AbaImposto, ArquivoDebito[]> = {
    das: [],
    parcelamentoReceita: [],
    parcelamentoPrefeitura: [],
    inss: [],
    tfe: []
  };
  pageIndex: Record<AbaImposto, number> = {
    das: 1,
    parcelamentoReceita: 1,
    parcelamentoPrefeitura: 1,
    inss: 1,
    tfe: 1
  };
  readonly pageSize = 6;
  carregando = new Set<AbaImposto>();
  erro = '';
  salvando = new Set<number>();
  solicitando = new Set<number>();

  readonly exportColumnsDas: ExcelExportColumn[] = [
    { key: 'periodo', title: 'Período' },
    { key: 'periodo', title: 'Data Vencimento', format: v => fmtDate(this.vencimento(String(v ?? ''))) },
    { key: 'valorTributado', title: 'Valor Tributado', format: v => fmtCurrency(this.parseBrl(String(v ?? ''))) },
    { key: 'valorTributo', title: 'Valor Tributo' },
    { key: 'status', title: 'Status', format: (_v, row) => {
      const item = row as unknown as DasItem;
      return item.status === 'Pago' ? 'Pago' : this.statusDasItem(item);
    }},
    { key: 'periodo', title: 'Mensagem', format: (_v, row) => {
      const item = row as unknown as DasItem;
      return this.dasVencido(item) ? 'Vencida, não pode ser paga, solicite uma nova!' : '—';
    }}
  ];

  exportColumnsArquivo(aba: AbaConfig): ExcelExportColumn[] {
    const cols: ExcelExportColumn[] = [];
    if (aba.id === 'parcelamentoReceita' || aba.id === 'parcelamentoPrefeitura') {
      cols.push({ key: 'parcela', title: 'Parcela' });
    } else {
      cols.push({ key: 'tipo', title: 'Tipo' });
    }
    cols.push(
      { key: 'dataVencimento', title: 'Vencimento', format: fmtDate },
      { key: 'dataCriacao', title: 'Cadastro', format: fmtDate },
      { key: 'dataVencimento', title: 'Mensagem', format: (_v, row) => this.estaVencida(row as unknown as ArquivoDebito) ? 'Vencida, não pode ser paga, solicite uma nova!' : '—' }
    );
    return cols;
  }

  private codigoPessoa = 0;
  private solicitante = '';

  constructor(
    private http: HttpClient,
    private loginService: LoginService,
    private arquivoService: ArquivoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const usuario = this.loginService.obterUsuario();
    const pessoa = this.loginService.obterPessoa();
    if (!pessoa?.codigo) {
      this.loginService.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.codigoPessoa = pessoa.codigo;
    this.solicitante = usuario?.email || usuario?.nome || '';
    this.carregarAba('das');
  }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  onAbaChange(_index: number): void {
    const aba = this.abas[this.abaIndex];
    if (!aba) return;
    const jaCarregou = aba.modoDas
      ? this.listaDas.length > 0
      : this.listas[aba.id].length > 0;
    if (!jaCarregou && !this.carregando.has(aba.id)) {
      this.carregarAba(aba.id);
    }
  }

  carregarAba(abaId: AbaImposto): void {
    const aba = this.abas.find(a => a.id === abaId);
    if (!aba) return;

    this.carregando.add(abaId);
    this.cdr.markForCheck();

    if (aba.modoDas) {
      this.carregarDas(abaId);
      return;
    }
    this.carregarArquivos(abaId, aba);
  }

  private carregarDas(abaId: AbaImposto): void {
    this.erro = '';
    this.http.get<DasItem | DasItem | null>(
      `${this.apiBase}/DAS/ObterListaEnvio/codigoPessoa/${this.codigoPessoa}`,
      { headers: this.headers }
    ).pipe(timeout(10000), catchError(() => of(null))).subscribe({
      next: (res) => {
        if (res == null) {
          this.erro = 'Erro ao carregar os dados. Tente novamente.';
          this.listaDas = [];
        } else {
          const raw = Array.isArray(res) ? res : [res];
          this.listaDas = raw.filter(Boolean) as DasItem[];
        }
        this.pageIndex[abaId] = 1;
        this.carregando.delete(abaId);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.erro = `Erro ao carregar os dados (${err.status}). Tente novamente.`;
        this.listaDas = [];
        this.carregando.delete(abaId);
        this.cdr.markForCheck();
      }
    });
  }

  private carregarArquivos(abaId: AbaImposto, aba: AbaConfig): void {
    this.http.get<unknown[]>(
      `${this.apiBase}/${aba.endpoint}/ObterPorCodigo/${this.codigoPessoa}`,
      { headers: this.headers }
    ).pipe(timeout(10000), catchError(() => of([]))).subscribe({
      next: (raw) => {
        let itens = (raw || []).map(item => this.mapArquivo(item));
        if (aba.filtroTipo) {
          itens = itens.filter(i => i.tipo.toLowerCase() === aba.filtroTipo!.toLowerCase());
        }
        const key = abaId;
        this.listas[key] = this.ordenarArquivos(itens);
        this.pageIndex[abaId] = 1;
        this.carregando.delete(abaId);
        this.cdr.markForCheck();
      },
      error: () => {
        this.listas[abaId] = [];
        this.carregando.delete(abaId);
        this.cdr.markForCheck();
      }
    });
  }

  abrirArquivo(item: ArquivoDebito, aba?: AbaConfig): void {
    if (this.estaVencida(item)) return;
    if (!item.arquivo) {
      this.message.warning('Arquivo não encontrado.');
      return;
    }
    this.arquivoService.abrir(item.codigoPessoa, item.arquivo, this.nomeArquivoDebito(item, aba));
  }

  statusDasItem(item: DasItem): string {
    if (this.isSemTributoDas(item)) {
      return 'Disponível';
    }
    return new Date().getDate() < 20 ? 'Disponível' : 'Vencido';
  }

  /** Sem tributo quando Valor Tributado ou Valor Tributo for zero. */
  isSemTributoDas(item: DasItem): boolean {
    return this.parseBrl(item.valorTributado) === 0 || this.parseBrl(item.valorTributo) === 0;
  }

  /** Possui tributo quando Valor Tributado ou Valor Tributo for diferente de zero. */
  temTributoDas(item: DasItem): boolean {
    return this.parseBrl(item.valorTributado) !== 0 || this.parseBrl(item.valorTributo) !== 0;
  }

  dasVencido(item: DasItem): boolean {
    if (item.status === 'Pago' || !this.temTributoDas(item)) return false;
    return this.statusDasItem(item) === 'Vencido';
  }

  vencimento(_periodo?: string): Date {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 20);
  }

  formatarData(data?: string): string {
    if (!data) return '—';
    const d = new Date(data);
    return isNaN(d.getTime()) ? data : d.toLocaleDateString('pt-BR');
  }

  estaVencida(item: ArquivoDebito): boolean {
    if (!item.dataVencimento) return false;
    const venc = new Date(item.dataVencimento);
    if (isNaN(venc.getTime())) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    venc.setHours(0, 0, 0, 0);
    return venc < hoje;
  }

  solicitarNovo(aba: AbaConfig, item: ArquivoDebito): void {
    this.criarSolicitacaoGuia(aba.titulo, item.codigo);
  }

  solicitarNovaGuiaDas(item: DasItem): void {
    this.criarSolicitacaoGuia(`DAS - ${item.periodo}`, item.codigo);
  }

  private criarSolicitacaoGuia(tituloGuia: string, codigo: number): void {
    if (this.solicitando.has(codigo)) return;

    this.solicitando.add(codigo);
    this.cdr.markForCheck();

    const agora = new Date().toISOString();
    const mensagem = `Gerar uma nova guia para pagamento do ${tituloGuia}`;
    const payload = {
      codigoPessoa: this.codigoPessoa,
      atendente: ATENDENTE_FIXO,
      solicitante: this.solicitante,
      titulo: TIPO_GUIA_PAGAMENTO,
      mensagem,
      status: 'N',
      prioridade: PRIORIDADE_PADRAO,
      tipo: AREA_FIXA,
      slaTempo: this.slaPorPrioridade(PRIORIDADE_PADRAO),
      dataCriacao: agora,
      chamadoHistoricos: [{
        dataHistorico: agora,
        descricao: 'Criação de solicitação',
        usuario: this.solicitante
      }]
    };

    this.http.post(`${this.apiBase}/Chamado`, payload, { headers: this.headers })
      .pipe(timeout(30000), catchError(() => of(null)))
      .subscribe({
        next: (res) => {
          this.solicitando.delete(codigo);
          if (res === null) {
            this.message.error('Erro ao criar solicitação. Tente novamente.');
          } else {
            this.message.success('Solicitação criada com sucesso!');
            this.router.navigate(['/solicitacoes']);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.solicitando.delete(codigo);
          this.message.error(`Erro ao criar solicitação (${err.status}).`);
          this.cdr.markForCheck();
        }
      });
  }

  private slaPorPrioridade(p: number): number {
    return ({ 1: 2, 2: 8, 3: 120 } as Record<number, number>)[p] ?? 8;
  }

  parseBrl(valor: string | number | undefined | null): number {
    if (valor == null) return 0;
    if (typeof valor === 'number') return valor;
    const s = String(valor);
    if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    return parseFloat(s) || 0;
  }

  isValorZero(item: DasItem): boolean {
    return this.parseBrl(item.valorTributado) === 0 && this.parseBrl(item.valorTributo) === 0;
  }

  gerarBoletoDas(item: DasItem): void {
    if (this.dasVencido(item)) return;
    this.arquivoService.abrir(item.codigoPessoa, item.nomeArquivo, this.nomeArquivoDas(item));
  }

  private nomeArquivoDas(item: DasItem): string {
    const periodo = item.periodo?.trim();
    return periodo ? `DAS ${periodo}` : 'DAS';
  }

  private nomeArquivoDebito(item: ArquivoDebito, aba?: AbaConfig): string {
    const tipo = item.tipo?.trim();
    if (tipo) {
      return item.parcela != null ? `${tipo} - Parcela ${item.parcela}` : tipo;
    }
    if (aba) {
      return item.parcela != null ? `${aba.titulo} - Parcela ${item.parcela}` : aba.titulo;
    }
    return 'Documento';
  }

  marcarComoPaga(item: DasItem): void {
    if (this.salvando.has(item.codigo)) return;
    this.salvando.add(item.codigo);
    const payload: DasItem = { ...item, status: 'Pago' };
    this.http.put<DasItem>(`${this.apiBase}/DAS`, payload, { headers: this.headers })
      .subscribe({
        next: () => {
          item.status = 'Pago';
          this.salvando.delete(item.codigo);
          this.message.success('DAS marcado como pago com sucesso.');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.salvando.delete(item.codigo);
          this.message.error(`Erro ao marcar como pago (${err.status}). Tente novamente.`);
          this.cdr.markForCheck();
        }
      });
  }

  private ordenarArquivos(itens: ArquivoDebito[]): ArquivoDebito[] {
    return [...itens].sort((a, b) => {
      const diff = this.dataOrdenacao(b) - this.dataOrdenacao(a);
      return diff !== 0 ? diff : b.codigo - a.codigo;
    });
  }

  private dataOrdenacao(item: ArquivoDebito): number {
    const raw = item.dataCriacao;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return isNaN(t) ? 0 : t;
  }

  private mapArquivo(raw: unknown): ArquivoDebito {
    const r = raw as Record<string, unknown>;
    return {
      codigo: Number(r['codigo'] ?? r['Codigo'] ?? 0),
      codigoPessoa: Number(r['codigoPessoa'] ?? r['CodigoPessoa'] ?? 0),
      parcela: r['parcela'] != null || r['Parcela'] != null ? Number(r['parcela'] ?? r['Parcela']) : undefined,
      tipo: String(r['tipo'] ?? r['Tipo'] ?? ''),
      dataVencimento: String(r['dataVencimento'] ?? r['DataVencimento'] ?? ''),
      dataCriacao: String(r['dataCriacao'] ?? r['DataCriacao'] ?? ''),
      arquivo: String(r['arquivo'] ?? r['Arquivo'] ?? '')
    };
  }
}
