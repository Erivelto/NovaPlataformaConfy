import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { fmtDate } from '../utils/excel-export.helpers';
import { environment } from '../../environments/environment';

const ARQUIVO_BASE_URL = 'https://armazenamento.contfy.com.br/Arquivos/Resultado';

type AbaDebito = 'parcelamento' | 'das' | 'tfe' | 'inss';

interface PessoaResumo {
  codigo: number;
  nome?: string;
  razao?: string;
  documento?: string;
  fisica?: boolean;
}

interface DebitoArquivo {
  codigo: number;
  codigoPessoa: number;
  parcela?: number;
  dataCriacao?: string;
  arquivo: string;
  tipo: string;
  excluido?: boolean;
  dataVencimento?: string;
  periodo?: string;
  status?: string;
  valorTributado?: string;
  valorTributo?: string;
  data?: string;
}

interface AbaConfig {
  id: AbaDebito;
  titulo: string;
  endpoint: string;
  listPath: (codigoPessoa: number) => string;
  tipoPadrao: string;
  comParcela: boolean;
  modoDas: boolean;
  comTipoSelect?: boolean;
}

@Component({
  selector: 'app-editar-debitos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTabsModule, NzFormModule, NzInputModule, NzButtonModule,
    NzIconModule, NzTableModule, NzTagModule, NzModalModule, NzSkeletonModule,
    NzMessageModule, NzUploadModule, NzDatePickerModule, NzInputNumberModule,
    NzPopconfirmModule, NzSelectModule, PageTitleComponent, ExportExcelButtonComponent
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <button nz-button nzType="default" (click)="voltar()">
          <i nz-icon nzType="arrow-left"></i> Voltar
        </button>
        <app-page-title
          [title]="loading ? 'Carregando...' : (pessoa.razao || pessoa.nome || 'Cliente')"
          subtitle="Gestão de débitos e parcelamentos">
        </app-page-title>
        <nz-tag *ngIf="!loading && pessoa.documento" nzColor="default">{{ pessoa.documento }}</nz-tag>
        <nz-tag *ngIf="!loading && pessoa.fisica" nzColor="purple">Física</nz-tag>
        <nz-tag *ngIf="!loading && !pessoa.fisica" nzColor="blue">Online</nz-tag>
        <button nz-button nzType="link" (click)="irClienteEditar()">
          <i nz-icon nzType="edit"></i> Editar cadastro
        </button>
      </div>

      <ng-container *ngIf="loading">
        <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 8 }"></nz-skeleton>
      </ng-container>

      <nz-card *ngIf="!loading">
        <nz-tabset [(nzSelectedIndex)]="abaIndex" (nzSelectedIndexChange)="onAbaChange($event)">
          <nz-tab *ngFor="let aba of abas" [nzTitle]="aba.titulo">
            <div class="form-section">
              <div class="toolbar">
                <button nz-button nzType="primary" (click)="abrirUpload(aba.id)">
                  <i nz-icon nzType="upload"></i> Novo PDF
                </button>
                <button nz-button (click)="carregarLista(aba.id)" [nzLoading]="carregandoLista.has(aba.id)">
                  <i nz-icon nzType="reload"></i> Atualizar
                </button>
                <app-export-excel-button
                  [data]="$any(listas[aba.id])"
                  [columns]="exportColumnsFor(aba)"
                  [fileName]="exportFileNameFor(aba)" />
              </div>

              <nz-table
                #debitosTable
                [nzData]="listas[aba.id]"
                nzBordered
                nzSize="middle"
                [nzShowPagination]="listas[aba.id].length > pageSize"
                [nzPageSize]="pageSize"
                [nzFrontPagination]="true"
                [(nzPageIndex)]="pageIndex[aba.id]"
                [nzLoading]="carregandoLista.has(aba.id)">
                <thead>
                  <tr>
                    <th nzWidth="70px">Código</th>
                    <th *ngIf="aba.modoDas" nzWidth="100px">Período</th>
                    <th *ngIf="aba.modoDas">Status</th>
                    <th *ngIf="aba.modoDas" nzWidth="120px">Valor Trib.</th>
                    <th *ngIf="aba.modoDas" nzWidth="120px">Valor Tributo</th>
                    <th *ngIf="!aba.modoDas && aba.comParcela" nzWidth="80px">Parcela</th>
                    <th *ngIf="!aba.modoDas">Tipo</th>
                    <th *ngIf="!aba.modoDas" nzWidth="120px">Vencimento</th>
                    <th nzWidth="120px">{{ aba.modoDas ? 'Data' : 'Cadastro' }}</th>
                    <th nzWidth="140px" nzAlign="center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of debitosTable.data">
                    <td>{{ item.codigo }}</td>
                    <td *ngIf="aba.modoDas">{{ item.periodo || '—' }}</td>
                    <td *ngIf="aba.modoDas"><nz-tag [nzColor]="statusColor(item.status)">{{ item.status || '—' }}</nz-tag></td>
                    <td *ngIf="aba.modoDas">{{ item.valorTributado || '—' }}</td>
                    <td *ngIf="aba.modoDas">{{ item.valorTributo || '—' }}</td>
                    <td *ngIf="!aba.modoDas && aba.comParcela">{{ item.parcela ?? '—' }}</td>
                    <td *ngIf="!aba.modoDas"><nz-tag>{{ item.tipo || '—' }}</nz-tag></td>
                    <td *ngIf="!aba.modoDas">{{ formatarData(item.dataVencimento) }}</td>
                    <td>{{ formatarData(aba.modoDas ? item.data : item.dataCriacao) }}</td>
                    <td nzAlign="center">
                      <button nz-button nzType="link" nzSize="small" (click)="abrirArquivo(item, aba.id)">
                        <i nz-icon nzType="eye"></i> Abrir
                      </button>
                      <button
                        nz-button
                        nzDanger
                        nzSize="small"
                        nz-popconfirm
                        nzPopconfirmTitle="Excluir este registro?"
                        (nzOnConfirm)="excluir(item, aba.id)"
                        [nzLoading]="excluindo.has(item.codigo)">
                        <i nz-icon nzType="delete"></i>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="!carregandoLista.has(aba.id) && listas[aba.id].length === 0">
                    <td [attr.colspan]="colspanAba(aba)" class="empty">Nenhum arquivo anexado.</td>
                  </tr>
                </tbody>
              </nz-table>
            </div>
          </nz-tab>
        </nz-tabset>
      </nz-card>
    </div>

    <nz-modal
      [(nzVisible)]="uploadVisible"
      [nzTitle]="'Novo PDF — ' + (uploadAbaConfig?.titulo || '')"
      [nzWidth]="480"
      [nzFooter]="ftUpload"
      (nzOnCancel)="fecharUpload()">
      <ng-container *nzModalContent>
        <nz-form-item *ngIf="uploadAbaConfig?.modoDas">
          <nz-form-label [nzSpan]="24" nzRequired>Período (mês/ano)</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-date-picker
              nzMode="month"
              style="width:100%"
              [(ngModel)]="uploadPeriodo"
              nzFormat="MM/yyyy"
              nzPlaceHolder="Selecione o mês">
            </nz-date-picker>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item *ngIf="uploadAbaConfig?.modoDas">
          <nz-form-label [nzSpan]="24" nzRequired>Status</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-select [(ngModel)]="uploadStatus" style="width:100%">
              <nz-option nzValue="Concluido" nzLabel="Concluído"></nz-option>
              <nz-option nzValue="Enviado" nzLabel="Enviado"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item *ngIf="uploadAbaConfig?.comParcela">
          <nz-form-label [nzSpan]="24" nzRequired>Parcela</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-input-number [(ngModel)]="uploadParcela" [nzMin]="1" [nzStep]="1" style="width:100%"></nz-input-number>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item *ngIf="uploadAbaConfig?.comTipoSelect">
          <nz-form-label [nzSpan]="24" nzRequired>Tipo</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-select [(ngModel)]="uploadTipo" style="width:100%">
              <nz-option nzValue="Prefeitura" nzLabel="Prefeitura"></nz-option>
              <nz-option nzValue="Receita" nzLabel="Receita"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item *ngIf="!uploadAbaConfig?.modoDas && !uploadAbaConfig?.comTipoSelect">
          <nz-form-label [nzSpan]="24" nzRequired>Tipo</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <input nz-input [(ngModel)]="uploadTipo" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item *ngIf="!uploadAbaConfig?.modoDas">
          <nz-form-label [nzSpan]="24">Data de Vencimento</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-date-picker style="width:100%" [(ngModel)]="uploadVencimento" nzFormat="dd/MM/yyyy"></nz-date-picker>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Arquivo PDF</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-upload
              nzAction=""
              [nzBeforeUpload]="beforeUpload"
              [nzFileList]="fileList"
              nzAccept=".pdf"
              [nzMultiple]="false">
              <button nz-button><i nz-icon nzType="upload"></i> Selecionar PDF</button>
            </nz-upload>
          </nz-form-control>
        </nz-form-item>
      </ng-container>
      <ng-template #ftUpload>
        <button nz-button (click)="fecharUpload()" [disabled]="fazendoUpload">Fechar</button>
        <button nz-button nzType="primary" [nzLoading]="fazendoUpload" (click)="fazerUpload()">Enviar</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .page { padding: 8px 4px; }
    .page-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .page-header app-page-title { flex: 1; min-width: 220px; }
    .form-section { padding: 8px 4px; }
    .toolbar { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
    .empty { text-align: center; padding: 24px; color: rgba(0,0,0,.45); }
  `]
})
export class EditarDebitosComponent implements OnInit {
  private readonly api = environment.apiUrl;

  codigoPessoa = 0;
  loading = true;
  abaIndex = 0;
  pessoa: PessoaResumo = { codigo: 0 };

  readonly abas: AbaConfig[] = [
    {
      id: 'parcelamento',
      titulo: 'Parcelamento Receita/Prefeitura',
      endpoint: 'PessoaPrefeituraDASDebitos',
      listPath: (id) => `PessoaPrefeituraDASDebitos/ObterPorCodigo/${id}`,
      tipoPadrao: 'Receita',
      comParcela: true,
      modoDas: false,
      comTipoSelect: true
    },
    {
      id: 'das',
      titulo: 'DAS',
      endpoint: 'DAS',
      listPath: (id) => `DAS/ObterPorCodigoPessoa/Codigo/${id}`,
      tipoPadrao: 'DAS',
      comParcela: false,
      modoDas: true
    },
    {
      id: 'tfe',
      titulo: 'TFE',
      endpoint: 'PessoaTFE',
      listPath: (id) => `PessoaTFE/ObterPorCodigo/${id}`,
      tipoPadrao: 'TFE',
      comParcela: false,
      modoDas: false
    },
    {
      id: 'inss',
      titulo: 'Prolabore/INSS',
      endpoint: 'PessoaINSS',
      listPath: (id) => `PessoaINSS/ObterPorCodigo/${id}`,
      tipoPadrao: 'Prolabore/INSS',
      comParcela: false,
      modoDas: false
    }
  ];

  listas: Record<AbaDebito, DebitoArquivo[]> = { parcelamento: [], das: [], tfe: [], inss: [] };
  pageIndex: Record<AbaDebito, number> = { parcelamento: 1, das: 1, tfe: 1, inss: 1 };
  readonly pageSize = 6;
  carregandoLista = new Set<AbaDebito>();
  excluindo = new Set<number>();

  uploadVisible = false;
  uploadAba: AbaDebito = 'parcelamento';
  uploadTipo = '';
  uploadParcela = 1;
  uploadPeriodo: Date | null = null;
  uploadStatus: 'Concluido' | 'Enviado' = 'Enviado';
  uploadVencimento: Date | null = null;
  fileList: NzUploadFile[] = [];
  selectedFile: File | null = null;
  fazendoUpload = false;

  get uploadAbaConfig(): AbaConfig | undefined {
    return this.abas.find(a => a.id === this.uploadAba);
  }

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.codigoPessoa = +(params.get('id') || 0);
      if (!this.codigoPessoa) {
        this.message.error('Cliente não informado.');
        this.router.navigate(['/administrativo/gestao-debitos']);
        return;
      }
      this.carregarPessoa();
    });
  }

  voltar(): void {
    if (history.length > 1) {
      history.back();
    } else {
      this.router.navigate(['/administrativo/gestao-debitos']);
    }
  }

  irClienteEditar(): void {
    this.router.navigate(['/administrativo/cliente', this.codigoPessoa, 'editar']);
  }

  onAbaChange(_index: number): void {
    const aba = this.abas[this.abaIndex];
    if (aba && this.listas[aba.id].length === 0 && !this.carregandoLista.has(aba.id)) {
      this.carregarLista(aba.id);
    }
  }

  carregarPessoa(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.http.get<unknown>(`${this.api}/Pessoa/${this.codigoPessoa}`, { headers: this.h })
      .pipe(timeout(10000), catchError(() => of(null)))
      .subscribe(raw => {
        if (!raw) {
          this.message.error('Cliente não encontrado.');
          this.router.navigate(['/administrativo/gestao-debitos']);
          return;
        }
        const r = raw as Record<string, unknown>;
        this.pessoa = {
          codigo: Number(r['codigo'] ?? r['Codigo']),
          nome: String(r['nome'] ?? r['Nome'] ?? ''),
          razao: String(r['razao'] ?? r['Razao'] ?? ''),
          documento: String(r['documento'] ?? r['Documento'] ?? ''),
          fisica: Boolean(r['fisica'] ?? r['Fisica'])
        };
        this.loading = false;
        this.carregarLista('parcelamento');
        this.cdr.markForCheck();
      });
  }

  carregarLista(abaId: AbaDebito): void {
    const aba = this.abas.find(a => a.id === abaId);
    if (!aba) return;

    this.carregandoLista.add(abaId);
    this.cdr.markForCheck();

    this.http.get<unknown[]>(`${this.api}/${aba.listPath(this.codigoPessoa)}`, { headers: this.h })
      .pipe(timeout(10000), catchError(() => of([])))
      .subscribe(raw => {
        const itens = (raw || []).map(item => aba.modoDas ? this.mapDasItem(item) : this.mapItem(item));
        this.listas[abaId] = this.ordenarLista(itens, aba.modoDas);
        this.pageIndex[abaId] = 1;
        this.carregandoLista.delete(abaId);
        this.cdr.markForCheck();
      });
  }

  abrirUpload(abaId: AbaDebito): void {
    const aba = this.abas.find(a => a.id === abaId);
    if (!aba) return;
    this.uploadAba = abaId;
    this.uploadTipo = aba.tipoPadrao;
    this.uploadParcela = 1;
    this.uploadPeriodo = aba.modoDas ? new Date() : null;
    this.uploadStatus = 'Enviado';
    this.uploadVencimento = null;
    this.fileList = [];
    this.selectedFile = null;
    this.uploadVisible = true;
    this.cdr.markForCheck();
  }

  fecharUpload(): void {
    this.uploadVisible = false;
    this.cdr.markForCheck();
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    const ext = (file.name || '').split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') {
      this.message.error('Apenas arquivos PDF são aceitos.');
      this.fileList = [];
      this.selectedFile = null;
      this.cdr.markForCheck();
      return false;
    }
    this.selectedFile = file as unknown as File;
    this.fileList = [file];
    this.cdr.markForCheck();
    return false;
  };

  fazerUpload(): void {
    const aba = this.uploadAbaConfig;
    if (!aba) return;

    if (aba.modoDas) {
      if (!this.uploadPeriodo) {
        this.message.warning('Informe o período (mês/ano).');
        return;
      }
    } else {
      if (!this.uploadTipo.trim()) {
        this.message.warning('Informe o tipo.');
        return;
      }
      if (aba.comParcela && (!this.uploadParcela || this.uploadParcela < 1)) {
        this.message.warning('Informe a parcela.');
        return;
      }
    }

    if (!this.selectedFile) {
      this.message.warning('Selecione um arquivo PDF.');
      return;
    }

    this.fazendoUpload = true;
    this.cdr.markForCheck();

    const arquivoGuid = crypto.randomUUID();
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.http.post(`${this.api}/ArmazenamentoDeObjeto`, {
        codigo: arquivoGuid,
        image: base64,
        pasta: String(this.codigoPessoa)
      }, { headers: this.h }).pipe(timeout(60000), catchError(() => of(null))).subscribe({
        next: (res) => {
          if (res === null) {
            this.message.error('Erro ao enviar arquivo para o armazenamento.');
            this.fazendoUpload = false;
            this.cdr.markForCheck();
            return;
          }

          const payload = aba.modoDas
            ? this.buildDasPayload(arquivoGuid)
            : this.buildDebitoPayload(arquivoGuid, aba);

          this.http.post(`${this.api}/${aba.endpoint}`, payload, { headers: this.h }).subscribe({
            next: () => {
              this.message.success('Arquivo enviado com sucesso!');
              this.fazendoUpload = false;
              this.uploadVisible = false;
              this.carregarLista(aba.id);
            },
            error: (err) => {
              this.message.error(`Erro ao registrar (${err.status}).`);
              this.fazendoUpload = false;
              this.cdr.markForCheck();
            }
          });
        }
      });
    };
    reader.onerror = () => {
      this.message.error('Erro ao ler o arquivo selecionado.');
      this.fazendoUpload = false;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(this.selectedFile);
  }

  abrirArquivo(item: DebitoArquivo, abaId: AbaDebito): void {
    if (!item.arquivo) {
      this.message.warning('Arquivo não encontrado.');
      return;
    }
    const aba = this.abas.find(a => a.id === abaId);
    if (aba?.modoDas) {
      window.open(
        `${ARQUIVO_BASE_URL}?diretorioCompleto=${item.codigoPessoa}&nomeArquivo=${item.arquivo}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }
    const params = new URLSearchParams({
      diretorioCompleto: String(item.codigoPessoa),
      nomeArquivo: item.arquivo,
      tipo: item.tipo || 'pdf'
    });
    window.open(`${ARQUIVO_BASE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer');
  }

  excluir(item: DebitoArquivo, abaId: AbaDebito): void {
    const aba = this.abas.find(a => a.id === abaId);
    if (!aba) return;

    this.excluindo.add(item.codigo);
    this.cdr.markForCheck();

    if (aba.modoDas) {
      const payload = {
        codigo: item.codigo,
        codigoPessoa: item.codigoPessoa,
        periodo: item.periodo || '',
        valorTributado: item.valorTributado || '0',
        valorTributo: item.valorTributo || '0',
        mensagem: '',
        data: item.data || new Date().toISOString(),
        excluido: true,
        status: item.status || 'Enviado',
        nomeArquivo: item.arquivo
      };
      this.http.put(`${this.api}/${aba.endpoint}`, payload, { headers: this.h }).subscribe({
        next: () => {
          this.message.success('Registro excluído.');
          this.excluindo.delete(item.codigo);
          this.carregarLista(abaId);
        },
        error: (err) => {
          this.message.error(`Erro ao excluir (${err.status}).`);
          this.excluindo.delete(item.codigo);
          this.cdr.markForCheck();
        }
      });
      return;
    }

    this.http.delete(`${this.api}/${aba.endpoint}/${item.codigo}`, { headers: this.h }).subscribe({
      next: () => {
        this.message.success('Registro excluído.');
        this.excluindo.delete(item.codigo);
        this.carregarLista(abaId);
      },
      error: (err) => {
        this.message.error(`Erro ao excluir (${err.status}).`);
        this.excluindo.delete(item.codigo);
        this.cdr.markForCheck();
      }
    });
  }

  colspanAba(aba: AbaConfig): number {
    if (aba.modoDas) return 7;
    return aba.comParcela ? 6 : 5;
  }

  statusColor(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'enviado': return 'green';
      case 'concluido': return 'blue';
      case 'pago': return 'green';
      case 'aguardando': return 'cyan';
      default: return 'default';
    }
  }

  exportColumnsFor(aba: AbaConfig): ExcelExportColumn[] {
    if (aba.modoDas) {
      return [
        { key: 'codigo', title: 'Código' },
        { key: 'periodo', title: 'Período' },
        { key: 'status', title: 'Status' },
        { key: 'valorTributado', title: 'Valor Trib.' },
        { key: 'valorTributo', title: 'Valor Tributo' },
        { key: 'data', title: 'Data', format: fmtDate }
      ];
    }
    const cols: ExcelExportColumn[] = [
      { key: 'codigo', title: 'Código' }
    ];
    if (aba.comParcela) cols.push({ key: 'parcela', title: 'Parcela' });
    cols.push(
      { key: 'tipo', title: 'Tipo' },
      { key: 'dataVencimento', title: 'Vencimento', format: fmtDate },
      { key: 'dataCriacao', title: 'Cadastro', format: fmtDate }
    );
    return cols;
  }

  exportFileNameFor(aba: AbaConfig): string {
    return `editar-debitos-${aba.id}`;
  }

  formatarData(data?: string): string {
    if (!data) return '—';
    const d = new Date(data);
    return isNaN(d.getTime()) ? data : d.toLocaleDateString('pt-BR');
  }

  private buildDebitoPayload(arquivoGuid: string, aba: AbaConfig): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      codigoPessoa: this.codigoPessoa,
      dataCriacao: new Date().toISOString(),
      arquivo: arquivoGuid,
      tipo: this.uploadTipo.trim(),
      excluido: false
    };
    if (this.uploadVencimento) {
      payload['dataVencimento'] = this.uploadVencimento.toISOString();
    }
    if (aba.comParcela) {
      payload['parcela'] = this.uploadParcela;
    }
    return payload;
  }

  private buildDasPayload(arquivoGuid: string): Record<string, unknown> {
    const periodo = this.formatPeriodo(this.uploadPeriodo!);
    const dataRef = this.uploadPeriodo || new Date();
    return {
      codigoPessoa: this.codigoPessoa,
      periodo,
      valorTributado: '0',
      valorTributo: '0',
      mensagem: '',
      data: dataRef.toISOString(),
      excluido: false,
      status: this.uploadStatus,
      nomeArquivo: arquivoGuid
    };
  }

  private formatPeriodo(data: Date): string {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${mes}/${ano}`;
  }

  private ordenarLista(itens: DebitoArquivo[], modoDas: boolean): DebitoArquivo[] {
    return [...itens].sort((a, b) => {
      const diff = this.dataOrdenacao(b, modoDas) - this.dataOrdenacao(a, modoDas);
      return diff !== 0 ? diff : b.codigo - a.codigo;
    });
  }

  private dataOrdenacao(item: DebitoArquivo, modoDas: boolean): number {
    const raw = modoDas ? item.data : item.dataCriacao;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return isNaN(t) ? 0 : t;
  }

  private mapDasItem(raw: unknown): DebitoArquivo {
    const r = raw as Record<string, unknown>;
    return {
      codigo: Number(r['codigo'] ?? r['Codigo'] ?? 0),
      codigoPessoa: Number(r['codigoPessoa'] ?? r['CodigoPessoa'] ?? 0),
      arquivo: String(r['nomeArquivo'] ?? r['NomeArquivo'] ?? ''),
      tipo: 'DAS',
      periodo: String(r['periodo'] ?? r['Periodo'] ?? ''),
      status: String(r['status'] ?? r['Status'] ?? ''),
      valorTributado: String(r['valorTributado'] ?? r['ValorTributado'] ?? ''),
      valorTributo: String(r['valorTributo'] ?? r['ValorTributo'] ?? ''),
      data: String(r['data'] ?? r['Data'] ?? ''),
      excluido: Boolean(r['excluido'] ?? r['Excluido'])
    };
  }

  private mapItem(raw: unknown): DebitoArquivo {
    const r = raw as Record<string, unknown>;
    return {
      codigo: Number(r['codigo'] ?? r['Codigo'] ?? 0),
      codigoPessoa: Number(r['codigoPessoa'] ?? r['CodigoPessoa'] ?? 0),
      parcela: r['parcela'] != null || r['Parcela'] != null ? Number(r['parcela'] ?? r['Parcela']) : undefined,
      dataCriacao: String(r['dataCriacao'] ?? r['DataCriacao'] ?? ''),
      arquivo: String(r['arquivo'] ?? r['Arquivo'] ?? ''),
      tipo: String(r['tipo'] ?? r['Tipo'] ?? ''),
      excluido: Boolean(r['excluido'] ?? r['Excluido']),
      dataVencimento: String(r['dataVencimento'] ?? r['DataVencimento'] ?? '')
    };
  }
}
