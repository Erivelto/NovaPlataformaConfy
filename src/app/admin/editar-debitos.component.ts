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
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';

const ARQUIVO_BASE_URL = 'https://armazenamento.contfy.com.br/Arquivos/Resultado';

type AbaDebito = 'das' | 'tfe' | 'inss';

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
}

interface AbaConfig {
  id: AbaDebito;
  titulo: string;
  endpoint: string;
  tipoPadrao: string;
  comParcela: boolean;
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
    NzPopconfirmModule, PageTitleComponent
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
              </div>

              <nz-table
                [nzData]="listas[aba.id]"
                nzBordered
                nzSize="middle"
                [nzShowPagination]="false"
                [nzLoading]="carregandoLista.has(aba.id)">
                <thead>
                  <tr>
                    <th nzWidth="70px">Código</th>
                    <th *ngIf="aba.comParcela" nzWidth="80px">Parcela</th>
                    <th>Tipo</th>
                    <th nzWidth="120px">Vencimento</th>
                    <th nzWidth="120px">Cadastro</th>
                    <th nzWidth="140px" nzAlign="center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of listas[aba.id]">
                    <td>{{ item.codigo }}</td>
                    <td *ngIf="aba.comParcela">{{ item.parcela ?? '—' }}</td>
                    <td><nz-tag>{{ item.tipo || '—' }}</nz-tag></td>
                    <td>{{ formatarData(item.dataVencimento) }}</td>
                    <td>{{ formatarData(item.dataCriacao) }}</td>
                    <td nzAlign="center">
                      <button nz-button nzType="link" nzSize="small" (click)="abrirArquivo(item)">
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
                    <td [attr.colspan]="aba.comParcela ? 6 : 5" class="empty">Nenhum arquivo anexado.</td>
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
        <nz-form-item *ngIf="uploadAbaConfig?.comParcela">
          <nz-form-label [nzSpan]="24" nzRequired>Parcela</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <nz-input-number [(ngModel)]="uploadParcela" [nzMin]="1" [nzStep]="1" style="width:100%"></nz-input-number>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label [nzSpan]="24" nzRequired>Tipo</nz-form-label>
          <nz-form-control [nzSpan]="24">
            <input nz-input [(ngModel)]="uploadTipo" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
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
    { id: 'das', titulo: 'Parcelamento DAS/Prefeitura', endpoint: 'PessoaPrefeituraDASDebitos', tipoPadrao: 'Parcelamento DAS/Prefeitura', comParcela: true },
    { id: 'tfe', titulo: 'TFE', endpoint: 'PessoaTFE', tipoPadrao: 'TFE', comParcela: false },
    { id: 'inss', titulo: 'Prolabore/INSS', endpoint: 'PessoaINSS', tipoPadrao: 'Prolabore/INSS', comParcela: false }
  ];

  listas: Record<AbaDebito, DebitoArquivo[]> = { das: [], tfe: [], inss: [] };
  carregandoLista = new Set<AbaDebito>();
  excluindo = new Set<number>();

  uploadVisible = false;
  uploadAba: AbaDebito = 'das';
  uploadTipo = '';
  uploadParcela = 1;
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
        this.carregarLista('das');
        this.cdr.markForCheck();
      });
  }

  carregarLista(abaId: AbaDebito): void {
    const aba = this.abas.find(a => a.id === abaId);
    if (!aba) return;

    this.carregandoLista.add(abaId);
    this.cdr.markForCheck();

    this.http.get<unknown[]>(`${this.api}/${aba.endpoint}/ObterPorCodigo/${this.codigoPessoa}`, { headers: this.h })
      .pipe(timeout(10000), catchError(() => of([])))
      .subscribe(raw => {
        this.listas[abaId] = (raw || []).map(item => this.mapItem(item));
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
    if (!this.uploadTipo.trim()) {
      this.message.warning('Informe o tipo.');
      return;
    }
    if (aba.comParcela && (!this.uploadParcela || this.uploadParcela < 1)) {
      this.message.warning('Informe a parcela.');
      return;
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

  abrirArquivo(item: DebitoArquivo): void {
    if (!item.arquivo) {
      this.message.warning('Arquivo não encontrado.');
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

  formatarData(data?: string): string {
    if (!data) return '—';
    const d = new Date(data);
    return isNaN(d.getTime()) ? data : d.toLocaleDateString('pt-BR');
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
