import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { PageTitleComponent } from '../page-title.component';
import { ExportExcelButtonComponent } from '../components/export-excel-button.component';
import { ExcelExportColumn } from '../services/excel-export.service';
import { PessoaService } from '../services/pessoa.service';
import { LoginService } from '../services/login.service';
import { environment } from '../../environments/environment';

const AREA_FIXA = 'Contabilidade';
const ATENDENTE_FIXO = 'Analista Contabil';
const PRIORIDADE_PADRAO = 2;
const TIPO_SOLICITACAO = 'Outros';

interface Chamado {
  id: number;
}

@Component({
  selector: 'app-meus-dados',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzDescriptionsModule, NzTableModule, NzButtonModule,
    NzModalModule, NzInputModule, NzSpinModule, NzAlertModule, NzIconModule, NzTagModule,
    NzFormModule, NzGridModule, NzUploadModule, NzMessageModule,
    PageTitleComponent, ExportExcelButtonComponent
  ],
  template: `
    <div class="meus-dados">
      <app-page-title title="Meus Dados" subtitle="Informacoes cadastrais da sua empresa"></app-page-title>

      <nz-alert *ngIf="erro" nzType="warning" [nzMessage]="erro" nzShowIcon class="alert-top"></nz-alert>

      <nz-spin [nzSpinning]="loading" nzTip="Carregando dados...">

        <nz-card [nzTitle]="tEmpresa" class="sc">
          <ng-template #tEmpresa>
            <i nz-icon nzType="bank" style="margin-right:6px"></i>Dados Empresarial
          </ng-template>
          <nz-descriptions nzBordered [nzColumn]="{ xxl:3, xl:3, lg:3, md:2, sm:1, xs:1 }">
            <nz-descriptions-item nzTitle="Nome Fantasia">{{ pessoa?.nome || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Razao Social" [nzSpan]="2">{{ pessoa?.razao || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="CNPJ">{{ cnpjMasked }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Atividade" [nzSpan]="2">{{ pessoa?.descricaoAtividade || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="CNAE">{{ pessoa?.cnae || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Inscricao Municipal">{{ pessoa?.incricaoMunicipal || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Tipo de Empresa">{{ tipoPessoa }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Logradouro" [nzSpan]="2">{{ fmtEnd(pessoa?.endereco) }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Bairro">{{ pessoa?.endereco?.bairro || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Cidade / UF">{{ cityUF(pessoa?.endereco) }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="CEP">{{ pessoa?.endereco?.cep || '-' }}</nz-descriptions-item>
          </nz-descriptions>
          <div class="card-foot">
            <button nz-button nzType="primary" (click)="abrirSolicitacao('Dados Empresarial')">
              <i nz-icon nzType="edit"></i> Solicitar Alteracao
            </button>
          </div>
        </nz-card>

        <nz-card [nzTitle]="tRep" class="sc" *ngIf="rep">
          <ng-template #tRep>
            <i nz-icon nzType="idcard" style="margin-right:6px"></i>Representante Legal
          </ng-template>
          <nz-descriptions nzBordered [nzColumn]="{ xxl:3, xl:3, lg:3, md:2, sm:1, xs:1 }">
            <nz-descriptions-item nzTitle="Nome" [nzSpan]="2">{{ rep?.nome || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="CPF">{{ cpfMasked }}</nz-descriptions-item>
            <ng-container *ngIf="enderecoRep">
              <nz-descriptions-item nzTitle="Logradouro" [nzSpan]="2">{{ fmtEnd(enderecoRep) }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="Bairro">{{ enderecoRep?.bairro || '-' }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="Cidade / UF">{{ cityUF(enderecoRep) }}</nz-descriptions-item>
              <nz-descriptions-item nzTitle="CEP">{{ enderecoRep?.cep || '-' }}</nz-descriptions-item>
            </ng-container>
          </nz-descriptions>
          <div class="card-foot">
            <button nz-button nzType="primary" (click)="abrirSolicitacao('Representante Legal')">
              <i nz-icon nzType="edit"></i> Solicitar Alteracao
            </button>
          </div>
        </nz-card>

        <nz-card [nzTitle]="tContatos" class="sc" *ngIf="contatos.length > 0" [nzExtra]="exportContatosTpl">
          <ng-template #tContatos>
            <i nz-icon nzType="phone" style="margin-right:6px"></i>Contatos
          </ng-template>
          <ng-template #exportContatosTpl>
            <app-export-excel-button [data]="$any(contatos)" [columns]="exportColumnsContatos" fileName="meus-dados-contatos" />
          </ng-template>
          <nz-table [nzData]="contatos" nzBordered nzSize="middle" [nzShowPagination]="false">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Celular</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of contatos">
                <td>{{ c.codigo }}</td>
                <td>{{ c.email || '-' }}</td>
                <td>{{ c.ddd ? (c.ddd + ' - ' + c.telefone) : (c.telefone || '-') }}</td>
                <td>{{ c.dddc ? (c.dddc + ' - ' + c.celular) : (c.celular || '-') }}</td>
              </tr>
            </tbody>
          </nz-table>
          <div class="card-foot">
            <button nz-button nzType="primary" (click)="abrirSolicitacao('Contatos')">
              <i nz-icon nzType="edit"></i> Solicitar Alteracao
            </button>
          </div>
        </nz-card>

      </nz-spin>
    </div>

    <nz-modal
      [(nzVisible)]="modalVisible"
      [nzTitle]="'Nova Solicitação — ' + modalSecao"
      [nzWidth]="720"
      [nzFooter]="ftSolicitacao"
      (nzOnCancel)="fecharModal()"
    >
      <ng-container *nzModalContent>
        <div class="modal-form">
          <nz-form-item>
            <nz-form-label [nzSpan]="24">Tipo de Solicitação</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <input nz-input [value]="tipoSolicitacao" disabled />
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
                nzAccept=".pdf"
                [nzMultiple]="true"
                [nzRemove]="onRemoveArquivo">
                <button nz-button type="button">
                  <span nz-icon nzType="upload"></span> Selecionar arquivo(s) (.pdf)
                </button>
              </nz-upload>
              <div *ngIf="fileList.length > 0" class="upload-hint">
                {{ fileList.length }} arquivo(s) selecionado(s)
              </div>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzSpan]="24" nzRequired>Descrição</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <textarea
                nz-input
                [(ngModel)]="mensagem"
                [nzAutosize]="{minRows:5,maxRows:10}"
                [placeholder]="descricaoPlaceholder">
              </textarea>
            </nz-form-control>
          </nz-form-item>
        </div>
      </ng-container>
      <ng-template #ftSolicitacao>
        <button nz-button (click)="fecharModal()" [disabled]="salvando">Cancelar</button>
        <button nz-button nzType="primary" (click)="enviarSolicitacao()" [nzLoading]="salvando">Cadastrar</button>
      </ng-template>
    </nz-modal>
  `,
  styles: [
    `.meus-dados { padding: 8px 4px; }`,
    `.sc { margin-bottom: 16px; }`,
    `.alert-top { margin-bottom: 16px; }`,
    `.card-foot { margin-top: 16px; display: flex; justify-content: flex-end; }`,
    `.modal-form { padding: 4px 0; }`,
    `.modal-form nz-form-item { margin-bottom: 16px; }`,
    `.modal-form ::ng-deep .ant-form-item { flex-direction: column; align-items: stretch; }`,
    `.modal-form ::ng-deep .ant-form-item-label { text-align: left; width: 100%; padding: 0 0 6px; }`,
    `.modal-form ::ng-deep .ant-form-item-label > label { height: auto; font-weight: 600; }`,
    `.modal-form ::ng-deep .ant-form-item-control { width: 100%; max-width: 100%; }`,
    `.campos-fixos { margin-bottom: 8px; }`,
    `.campo-readonly label {
      display: block;
      font-weight: 600;
      color: rgba(0,0,0,.65);
      font-size: .82rem;
      margin-bottom: 6px;
    }`,
    `.campo-readonly input { width: 100%; }`,
    `.upload-hint { margin-top: 6px; font-size: .82rem; color: rgba(0,0,0,.45); }`
  ]
})
export class MeusDadosComponent implements OnInit {
  private readonly api = environment.apiUrl;
  readonly tipoSolicitacao = TIPO_SOLICITACAO;
  readonly areaFixa = AREA_FIXA;
  readonly atendenteFixo = ATENDENTE_FIXO;

  loading = true;
  erro = '';
  pessoa: any = null;
  rep: any = null;
  enderecoRep: any = null;
  contatos: any[] = [];
  codigoPessoa = 0;
  solicitante = '';

  readonly exportColumnsContatos: ExcelExportColumn[] = [
    { key: 'codigo', title: 'Codigo' },
    { key: 'email', title: 'E-mail' },
    { key: 'telefone', title: 'Telefone', format: (_v, row) => {
      const r = row as Record<string, unknown>;
      return r['ddd'] ? `${r['ddd']} - ${r['telefone']}` : String(r['telefone'] ?? '-');
    }},
    { key: 'celular', title: 'Celular', format: (_v, row) => {
      const r = row as Record<string, unknown>;
      return r['dddc'] ? `${r['dddc']} - ${r['celular']}` : String(r['celular'] ?? '-');
    }}
  ];

  modalVisible = false;
  modalSecao = '';
  mensagem = '';
  salvando = false;
  fileList: NzUploadFile[] = [];
  private arquivosPendentes: File[] = [];

  constructor(
    private pessoaService: PessoaService,
    private loginService: LoginService,
    private router: Router,
    private http: HttpClient,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const usuario = this.loginService.obterUsuario();
    const pessoaSession = this.loginService.obterPessoa();
    if (!pessoaSession?.codigo) {
      this.loginService.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.pessoa = pessoaSession;
    this.codigoPessoa = usuario?.codigoPessoa ?? pessoaSession.codigo;
    this.solicitante = usuario?.email || usuario?.nome || '';
    this.rep = pessoaSession.listaRepresentante?.[0] || null;
    const codigoRep = this.rep?.codigo;
    if (codigoRep) {
      forkJoin({
        enderecoRep: this.pessoaService.getEnderecoRepresentante(codigoRep).pipe(catchError(() => of(null))),
        contatos: this.pessoaService.getContatos(codigoRep).pipe(catchError(() => of([])))
      }).subscribe({
        next: ({ enderecoRep, contatos }) => {
          this.enderecoRep = enderecoRep;
          this.contatos = contatos || [];
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    } else {
      this.loading = false;
    }
  }

  get descricaoPlaceholder(): string {
    return `Descreva as alterações desejadas em ${this.modalSecao}...`;
  }

  private get h(): HttpHeaders {
    const t = localStorage.getItem('auth_token');
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  get cnpjMasked(): string {
    const doc = (this.pessoa?.documento || '').replace(/\D/g, '');
    if (doc.length < 14) return doc || '-';
    return doc.slice(0, 2) + '.***.***/' + doc.slice(8, 12) + '-' + doc.slice(12, 14);
  }

  get cpfMasked(): string {
    const cpf = (this.rep?.cpf || '').replace(/\D/g, '');
    if (cpf.length < 11) return cpf || '-';
    return cpf.slice(0, 3) + '.***.***-' + cpf.slice(9, 11);
  }

  get tipoPessoa(): string {
    const t = this.pessoa?.tipoPessoa;
    if (t == null) return '-';
    return t === 1 ? 'Comercio' : 'Servico';
  }

  fmtEnd(e: any): string {
    if (!e?.logradouro) return '-';
    return [e.tipoEnd, e.logradouro, e.numrero ? 'n ' + e.numrero : null, e.complemento]
      .filter(Boolean).join(', ');
  }

  cityUF(e: any): string {
    if (!e?.cidade) return '-';
    return e.uf ? e.cidade + ' / ' + e.uf : e.cidade;
  }

  abrirSolicitacao(secao: string): void {
    this.modalSecao = secao;
    this.mensagem = '';
    this.fileList = [];
    this.arquivosPendentes = [];
    this.modalVisible = true;
  }

  fecharModal(): void {
    if (this.salvando) return;
    this.modalVisible = false;
    this.mensagem = '';
    this.fileList = [];
    this.arquivosPendentes = [];
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    const ext = (file.name || '').split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') {
      this.message.error('Apenas arquivos PDF são aceitos.');
      return false;
    }
    const rawFile = this.resolverArquivo(file);
    if (!rawFile) {
      this.message.error('Não foi possível ler o arquivo selecionado.');
      return false;
    }
    this.arquivosPendentes = [...this.arquivosPendentes, rawFile];
    this.fileList = [...this.fileList, file];
    return false;
  };

  onRemoveArquivo = (file: NzUploadFile): boolean => {
    const idx = this.fileList.findIndex(f => f.uid === file.uid);
    this.fileList = this.fileList.filter(f => f.uid !== file.uid);
    if (idx >= 0) {
      this.arquivosPendentes = this.arquivosPendentes.filter((_, i) => i !== idx);
    }
    return true;
  };

  enviarSolicitacao(): void {
    if (!this.mensagem?.trim()) {
      this.message.warning('Informe a descrição da alteração.');
      return;
    }

    const arquivos = [...this.arquivosPendentes];
    if (this.fileList.length > 0 && arquivos.length === 0) {
      this.message.error('Não foi possível ler os arquivos selecionados. Selecione novamente.');
      return;
    }

    this.salvando = true;
    const agora = new Date().toISOString();
    const mensagemFinal = `Alteração solicitada — ${this.modalSecao}:\n${this.mensagem.trim()}`;
    const payload = {
      codigoPessoa: this.codigoPessoa,
      atendente: ATENDENTE_FIXO,
      solicitante: this.solicitante,
      titulo: TIPO_SOLICITACAO,
      mensagem: mensagemFinal,
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

    this.http.post<Chamado>(`${this.api}/Chamado`, payload, { headers: this.h }).subscribe({
      next: (chamado) => {
        const chamadoId = this.extrairChamadoId(chamado);
        if (!chamadoId) {
          this.message.warning('Solicitação criada, mas não foi possível identificar o código para anexar arquivos.');
          this.finalizarCadastro();
          return;
        }
        if (arquivos.length === 0) {
          this.finalizarCadastro();
          return;
        }
        this.uploadAnexos(chamadoId, arquivos)
          .then(() => this.finalizarCadastro())
          .catch((err) => {
            const detalhe = err?.status ? ` (${err.status})` : '';
            this.message.warning(`Solicitação criada, mas houve erro ao enviar um ou mais anexos${detalhe}.`);
            this.finalizarCadastro();
          });
      },
      error: (e) => {
        this.message.error(e?.error?.message || e?.error || `Erro ao cadastrar (${e.status})`);
        this.salvando = false;
      }
    });
  }

  private finalizarCadastro(): void {
    this.message.success('Solicitação cadastrada com sucesso!');
    this.salvando = false;
    this.modalVisible = false;
    this.mensagem = '';
    this.fileList = [];
    this.arquivosPendentes = [];
  }

  private uploadAnexos(chamadoId: number, arquivos: File[]): Promise<void> {
    return Promise.all(arquivos.map(arquivo => this.uploadUmAnexo(chamadoId, arquivo))).then(() => undefined);
  }

  private uploadUmAnexo(chamadoId: number, arquivo: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const ext = (arquivo.name || '').split('.').pop()?.toLowerCase();
      if (ext !== 'pdf') {
        reject(new Error('Apenas arquivos PDF são aceitos.'));
        return;
      }

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
              reject(new Error('Erro ao enviar arquivo para o armazenamento.'));
              return;
            }

            this.http.post(`${this.api}/Chamado/ChamadoUpload`, {
              ChamadoId: chamadoId,
              DataCriacao: new Date().toISOString(),
              Arquivo: arquivoGuid,
              Tipo: TIPO_SOLICITACAO,
              Excluido: false
            }, { headers: this.h }).pipe(timeout(15000)).subscribe({
              next: () => resolve(),
              error: (e) => reject(e)
            });
          },
          error: (e) => reject(e)
        });
      };
      reader.onerror = () => reject(reader.error ?? new Error('Erro ao ler o arquivo selecionado.'));
      reader.readAsDataURL(arquivo);
    });
  }

  private resolverArquivo(file: NzUploadFile): File | null {
    if (file.originFileObj instanceof File) return file.originFileObj;
    if (file instanceof File) return file;
    const candidate = file as unknown as File;
    return candidate?.name && candidate?.size != null ? candidate : null;
  }

  private extrairChamadoId(chamado: unknown): number {
    const c = chamado as Record<string, unknown>;
    const id = c?.['id'] ?? c?.['ID'] ?? c?.['Id'];
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  private slaPorPrioridade(p: number): number {
    return ({ 1: 2, 2: 8, 3: 120 } as Record<number, number>)[p] ?? 8;
  }
}
