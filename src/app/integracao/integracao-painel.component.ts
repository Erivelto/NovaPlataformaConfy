import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { environment } from '../../environments/environment';

interface DocumentoDto {
  id: number;
  tipo: string;
  nomeArquivo: string;
  status: 'pendente' | 'aprovado' | 'recusado';
  motivoRecusa: string;
  dataUpload: string;
}

interface HistoricoDto {
  evento: string;
  descricao: string;
  autor: string;
  data: string;
}

interface EtapaDto {
  id: number;
  chave: string;
  ordem: number;
  status: 'pendente' | 'em_processo' | 'concluido';
  observacao: string;
  linkPagamento: string;
  dataAtualizacao: string;
  analistaResponsavel: string;
}

interface PainelDto {
  id: number;
  cnpj: string;
  razaoSocial: string;
  nomeResponsavel: string;
  email: string;
  telefone: string;
  status: string;
  observacaoAnalista: string;
  tipo: string;
  documentos: DocumentoDto[];
  historico: HistoricoDto[];
  etapas: EtapaDto[];
}

interface TipoDoc { key: string; label: string; descricao: string; opcional?: boolean; }

const TIPOS_DOCS_ABERTURA: TipoDoc[] = [
  { key: 'espelho_iptu',        label: 'Espelho do IPTU',             descricao: 'Documento do IPTU do endereço da empresa' },
  { key: 'representante_cnh',   label: 'Representante Legal (CNH)',   descricao: 'CNH do representante legal da empresa' },
  { key: 'certidao_casamento',  label: 'Certidão de Casamento',       descricao: 'Caso for casado', opcional: true },
  { key: 'comprovante_endereco',label: 'Comprovante de Endereço',     descricao: 'Endereço da empresa (até 90 dias)' },
];

const TIPOS_DOCS_MUDANCA: TipoDoc[] = [
  { key: 'cartao_simples',     label: 'Cartão do Simples Nacional',  descricao: 'Comprovante de opção pelo Simples' },
  { key: 'contrato_social',    label: 'Contrato Social',              descricao: 'Documento de constituição da empresa' },
  { key: 'cpf_socio',          label: 'CPF do Sócio',                 descricao: 'Cópia do CPF do sócio principal', opcional: true },
  { key: 'representante_cnh',  label: 'Representante Legal (CNH)',    descricao: 'CNH do representante legal da empresa' },
];

const ETAPAS_CONFIG: Record<string, { label: string; descricao: string; icone: string }> = {
  // Abertura de Empresa
  pagamentos_taxas:            { label: 'Pagamentos / Taxas',               icone: 'dollar',             descricao: 'Pagamento das taxas necessárias para abertura da empresa.' },
  envio_documentos:            { label: 'Envio de Documentos',              icone: 'file-done',          descricao: 'Envio e aprovação de todos os documentos obrigatórios.' },
  contrato_social:             { label: 'Criação de Contrato Social',       icone: 'file-protect',       descricao: 'Elaboração e registro do contrato social da empresa.' },
  receita_federal:             { label: 'Processo Receita Federal / Jucesp',icone: 'bank',               descricao: 'Registro junto à Receita Federal e Junta Comercial.' },
  certificado_digital:         { label: 'Criar Certificado Digital',        icone: 'safety-certificate', descricao: 'Emissão do certificado digital da empresa.' },
  prefeitura_ecac:             { label: 'Cadastro Prefeitura / ECAC',       icone: 'home',               descricao: 'Cadastro junto à Prefeitura e portal e-CAC.' },
  // Mudança de Contabilidade
  pagamento_mensalidade:       { label: 'Pagamento Mensalidade',            icone: 'dollar',             descricao: 'Pagamento da primeira mensalidade do serviço de contabilidade.' },
  certificado_digital_cliente: { label: 'Envio do Certificado Digital',     icone: 'safety-certificate', descricao: 'Envio do certificado digital da empresa ao analista por e-mail.' },
  validar_prefeitura_ecac:     { label: 'Validar acesso Prefeitura / ECAC', icone: 'home',               descricao: 'Validação e configuração dos acessos à Prefeitura e e-CAC.' },
};

@Component({
  selector: 'app-integracao-painel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, HttpClientModule, FormsModule,
    NzButtonModule, NzTagModule, NzUploadModule,
    NzSpinModule, NzCardModule, NzGridModule, NzDividerModule,
    NzIconModule, NzModalModule, NzResultModule, NzStepsModule,
    NzBadgeModule, NzToolTipModule, NzAlertModule,
  ],
  template: `
<div class="painel-page">

  <!-- Header -->
  <div class="painel-header">
    <div class="painel-header-inner">
      <img src="/Logo.png" alt="Contfy" class="logo">
      <div class="header-info" *ngIf="painel">
        <span class="empresa-nome">{{ painel.razaoSocial }}</span>
        <nz-tag [nzColor]="statusColor">{{ statusLabel }}</nz-tag>
      </div>
      <button nz-button nzType="text" (click)="sair()" class="btn-sair">Sair</button>
    </div>
  </div>

  <nz-spin [nzSpinning]="carregando">

    <!-- Erro -->
    <div *ngIf="erroCarregar" style="max-width:800px;margin:40px auto;padding:0 16px">
      <nz-result nzStatus="error" [nzTitle]="erroCarregar" nzSubTitle="Verifique sua conexão ou tente novamente.">
        <div nz-result-extra>
          <button nz-button nzType="primary" (click)="erroCarregar=''; carregar()">Tentar novamente</button>
          <button nz-button (click)="sair()" style="margin-left:8px">Sair</button>
        </div>
      </nz-result>
    </div>

    <div class="painel-content" *ngIf="painel && !erroCarregar">

      <!-- Aprovado -->
      <nz-result *ngIf="painel.status === 'aprovado'"
        nzStatus="success"
        nzTitle="Integração concluída!"
        nzSubTitle="Bem-vindo(a) à Contfy! Em breve você receberá instruções para acessar a plataforma.">
      </nz-result>

      <!-- Recusado -->
      <nz-result *ngIf="painel.status === 'recusado'"
        nzStatus="error"
        nzTitle="Cadastro recusado"
        [nzSubTitle]="painel.observacaoAnalista || 'Entre em contato com nossa equipe.'">
      </nz-result>

      <!-- Conteúdo principal -->
      <ng-container *ngIf="painel.status !== 'aprovado' && painel.status !== 'recusado'">

        <!-- ──── LINHA DO TEMPO ──── -->
        <nz-card class="card-section" [nzBodyStyle]="{padding:'24px 32px'}">
          <div class="section-header">
            <span class="section-title">Acompanhe seu processo</span>
            <button nz-button nzType="primary" (click)="abrirModalDocs()" class="btn-docs">
              <i nz-icon nzType="file-add"></i> Enviar Documentos
            </button>
          </div>
          <p class="section-desc">Veja abaixo o status de cada etapa da sua integração com a Contfy.</p>

          <div class="etapas-list">
            <div *ngFor="let etapa of etapasOrdenadas; let i = index" class="etapa-item"
              [class.etapa-concluida]="etapa.status === 'concluido'"
              [class.etapa-andamento]="etapa.status === 'em_processo'">

              <!-- Linha conectora -->
              <div class="etapa-connector" *ngIf="i < etapasOrdenadas.length - 1"
                [class.connector-concluido]="etapa.status === 'concluido'"></div>

              <!-- Ícone/Bolinha -->
              <div class="etapa-ball" [ngClass]="etapaBallClass(etapa.status)">
                <i nz-icon [nzType]="etapaIcone(etapa.chave)" *ngIf="etapa.status !== 'concluido'"></i>
                <i nz-icon nzType="check" *ngIf="etapa.status === 'concluido'"></i>
              </div>

              <!-- Conteúdo -->
              <div class="etapa-body">
                <div class="etapa-header-row">
                  <span class="etapa-label">{{ etapaLabel(etapa.chave) }}</span>
                  <nz-tag [nzColor]="etapaTagColor(etapa.status)" class="etapa-tag">
                    {{ etapaStatusLabel(etapa.status) }}
                  </nz-tag>
                </div>
                <p class="etapa-desc">{{ etapaDescricao(etapa.chave) }}</p>

                <!-- Link de pagamento (pag/taxas e mensalidade) -->
                <nz-alert *ngIf="(etapa.chave === 'pagamentos_taxas' || etapa.chave === 'pagamento_mensalidade') && etapa.linkPagamento"
                  nzType="info" nzShowIcon
                  [nzMessage]="'Link de pagamento disponível'"
                  [nzDescription]="linkPagDesc"
                  style="margin-top:8px">
                </nz-alert>
                <ng-template #linkPagDesc>
                  <a [href]="etapa.linkPagamento" target="_blank" rel="noopener">
                    <i nz-icon nzType="link"></i> {{ etapa.linkPagamento }}
                  </a>
                </ng-template>

                <!-- Observação do analista -->
                <div *ngIf="etapa.observacao" class="etapa-obs">
                  <i nz-icon nzType="info-circle" style="margin-right:6px;color:#1890ff"></i>
                  {{ etapa.observacao }}
                </div>

                <!-- Data de atualização -->
                <div *ngIf="etapa.dataAtualizacao" class="etapa-data">
                  Atualizado em {{ etapa.dataAtualizacao }}
                </div>
              </div>
            </div>
          </div>
        </nz-card>

        <!-- ──── HISTÓRICO ──── -->
        <nz-card class="card-section" nzTitle="Histórico de eventos" [nzBodyStyle]="{padding:'16px 24px'}">
          <div *ngFor="let h of painel.historico" class="hist-item">
            <div class="hist-dot" [ngClass]="histDotClass(h.evento)"></div>
            <div class="hist-body">
              <div class="hist-desc">{{ h.descricao }}</div>
              <div class="hist-meta">{{ h.data }} · {{ h.autor }}</div>
            </div>
          </div>
          <div *ngIf="!painel.historico?.length" style="color:#999;font-size:13px">Sem eventos registrados.</div>
        </nz-card>

      </ng-container>
    </div>
  </nz-spin>
</div>

<!-- ──── MODAL ENVIO DE DOCUMENTOS ──── -->
<nz-modal
  [(nzVisible)]="modalDocsVisivel"
  nzTitle="Enviar Documentos"
  [nzFooter]="null"
  nzWidth="680px"
  (nzOnCancel)="modalDocsVisivel = false">
  <ng-container *nzModalContent>
    <p style="color:#666;margin-bottom:20px">
      Envie seus documentos em formato <strong>PDF</strong> (máx. 10 MB cada).
      Documentos opcionais só precisam ser enviados se aplicável.
    </p>

    <div class="progress-docs" *ngIf="painel">
      <span>{{ docsEnviados }}/{{ totalObrigatorios }} obrigatórios enviados</span>
      <nz-tag nzColor="success" *ngIf="docsEnviados === totalObrigatorios">✓ Todos enviados!</nz-tag>
    </div>

    <div *ngFor="let tipo of tiposDocs" class="doc-modal-row"
      [class.doc-aprovado]="getDocStatus(tipo.key) === 'aprovado'"
      [class.doc-recusado]="getDocStatus(tipo.key) === 'recusado'">

      <div class="doc-modal-info">
        <div class="doc-modal-label">
          <i nz-icon [nzType]="getDocIcon(tipo.key)" style="margin-right:6px"></i>
          {{ tipo.label }}
          <nz-tag *ngIf="tipo.opcional" nzColor="default" style="font-size:10px;margin-left:4px">Opcional</nz-tag>
          <nz-tag [nzColor]="getDocColor(tipo.key)" style="font-size:11px;margin-left:4px">{{ getDocStatusLabel(tipo.key) }}</nz-tag>
        </div>
        <div class="doc-modal-desc">{{ tipo.descricao }}</div>
        <div *ngIf="getDocRecusa(tipo.key)" class="doc-recusa-msg">
          <i nz-icon nzType="exclamation-circle"></i> {{ getDocRecusa(tipo.key) }}
        </div>
        <div *ngIf="getDocNome(tipo.key)" class="doc-nome-atual">
          <i nz-icon nzType="file-pdf" style="color:#ff4d4f"></i> {{ getDocNome(tipo.key) }}
        </div>
      </div>

      <nz-upload
        *ngIf="getDocStatus(tipo.key) !== 'aprovado'"
        [nzBeforeUpload]="gerarBeforeUpload(tipo.key)"
        [nzShowUploadList]="false"
        nzAccept=".pdf">
        <button nz-button [nzLoading]="uploading[tipo.key]" nzType="default" nzSize="small">
          <i nz-icon nzType="upload"></i>
          {{ getDocNome(tipo.key) ? 'Reenviar' : 'Enviar PDF' }}
        </button>
      </nz-upload>
      <nz-tag *ngIf="getDocStatus(tipo.key) === 'aprovado'" nzColor="success" style="margin-left:auto">
        <i nz-icon nzType="check-circle"></i> Aprovado
      </nz-tag>
    </div>
  </ng-container>
</nz-modal>
  `,
  styles: [`
    /* Layout geral */
    .painel-page { min-height:100vh; background:#f0f2f5; }
    .painel-header { background:var(--primary-color,#0a66c2); color:#fff; padding:0 24px; box-shadow:0 2px 8px rgba(0,0,0,.2); }
    .painel-header-inner { max-width:800px; margin:auto; display:flex; align-items:center; gap:16px; height:64px; }
    .logo { height:40px; width:40px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,.4); }
    .header-info { flex:1; display:flex; align-items:center; gap:12px; }
    .empresa-nome { font-weight:600; font-size:16px; color:#fff; }
    .btn-sair { color:#fff !important; margin-left:auto; }
    .painel-content { max-width:800px; margin:24px auto; padding:0 16px 40px; display:flex; flex-direction:column; gap:16px; }

    /* Seções */
    .card-section { border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
    .section-title { font-size:18px; font-weight:700; color:var(--primary-color,#0a66c2); }
    .section-desc { color:#888; font-size:13px; margin-bottom:24px; }
    .btn-docs { border-radius:8px; }

    /* Etapas */
    .etapas-list { display:flex; flex-direction:column; position:relative; }
    .etapa-item { display:flex; gap:16px; position:relative; padding-bottom:28px; }
    .etapa-item:last-child { padding-bottom:0; }

    .etapa-connector {
      position:absolute; left:19px; top:40px; bottom:0;
      width:2px; background:#e0e0e0; z-index:0;
    }
    .etapa-connector.connector-concluido { background:#52c41a; }

    .etapa-ball {
      width:40px; height:40px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:18px; flex-shrink:0; z-index:1;
      border:2px solid #d9d9d9; background:#fff; color:#bbb;
      transition:all .3s;
    }
    .ball-pendente  { border-color:#d9d9d9; background:#fff;     color:#bbb; }
    .ball-processo  { border-color:#1890ff; background:#e6f4ff;  color:#1890ff; }
    .ball-concluido { border-color:#52c41a; background:#f6ffed;  color:#52c41a; }

    .etapa-body { flex:1; padding-top:8px; }
    .etapa-header-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap; }
    .etapa-label { font-weight:600; font-size:15px; color:#1a1a1a; }
    .etapa-tag  { font-size:12px; }
    .etapa-desc { color:#888; font-size:13px; margin:0 0 4px; }
    .etapa-obs  { font-size:13px; color:#555; background:#f5f5f5; padding:6px 10px; border-radius:6px; margin-top:6px; }
    .etapa-data { font-size:11px; color:#bbb; margin-top:4px; }

    /* Histórico */
    .hist-item { display:flex; gap:12px; padding:8px 0; border-bottom:1px solid #f5f5f5; }
    .hist-item:last-child { border-bottom:none; }
    .hist-dot { width:10px; height:10px; border-radius:50%; background:#1890ff; margin-top:5px; flex-shrink:0; }
    .hist-dot-green { background:#52c41a; }
    .hist-dot-red   { background:#ff4d4f; }
    .hist-dot-gray  { background:#bbb; }
    .hist-body { flex:1; }
    .hist-desc { font-size:14px; color:#333; font-weight:500; }
    .hist-meta { font-size:12px; color:#999; margin-top:2px; }

    /* Modal Docs */
    .progress-docs { display:flex; align-items:center; gap:12px; margin-bottom:16px; font-size:14px; color:#555; }
    .doc-modal-row {
      display:flex; align-items:center; gap:12px; justify-content:space-between;
      padding:12px; border:1px solid #f0f0f0; border-radius:8px; margin-bottom:8px;
      transition:background .2s;
    }
    .doc-modal-row:hover { background:#fafafa; }
    .doc-aprovado { border-color:#b7eb8f !important; background:#f6ffed !important; }
    .doc-recusado { border-color:#ffccc7 !important; background:#fff2f0 !important; }
    .doc-modal-info { flex:1; }
    .doc-modal-label { font-weight:600; font-size:13px; margin-bottom:2px; }
    .doc-modal-desc { font-size:12px; color:#999; }
    .doc-recusa-msg { font-size:12px; color:#cf1322; background:#fff2f0; padding:4px 8px; border-radius:4px; margin-top:4px; }
    .doc-nome-atual { font-size:12px; color:#555; margin-top:4px; }
  `]
})
export class IntegracaoPainelComponent implements OnInit {
  carregando = true;
  painel: PainelDto | null = null;
  erroCarregar = '';
  tiposDocs: TipoDoc[] = [];
  uploading: Record<string, boolean> = {};
  modalDocsVisivel = false;

  get statusLabel(): string {
    const map: Record<string, string> = {
      pendente_docs: 'Aguardando documentos', em_analise: 'Em análise',
      aprovado: 'Aprovado', recusado: 'Recusado',
    };
    return map[this.painel?.status ?? ''] ?? this.painel?.status ?? '';
  }
  get statusColor(): string {
    const map: Record<string, string> = {
      pendente_docs: 'orange', em_analise: 'processing', aprovado: 'success', recusado: 'error',
    };
    return map[this.painel?.status ?? ''] ?? 'default';
  }

  get etapasOrdenadas(): EtapaDto[] {
    return (this.painel?.etapas ?? []).slice().sort((a, b) => a.ordem - b.ordem);
  }
  get docsObrigatorios(): TipoDoc[] { return this.tiposDocs.filter(t => !t.opcional); }
  get docsEnviados(): number {
    if (!this.painel) return 0;
    const enviados = new Set(this.painel.documentos.map(d => d.tipo));
    return this.docsObrigatorios.filter(t => enviados.has(t.key)).length;
  }
  get totalObrigatorios(): number { return this.docsObrigatorios.length; }

  private readonly api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private msg: NzMessageService,
    private router: Router,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true; this.cdr.markForCheck();
    const token = localStorage.getItem('integracao_token') ?? '';
    this.http.get<PainelDto>(`${this.api}/Integracao/Painel`, { headers: this.headers() }).subscribe({
      next: (data) => {
        this.painel = data;
        this.tiposDocs = (data.tipo ?? 'mudanca').toLowerCase() === 'abertura'
          ? TIPOS_DOCS_ABERTURA : TIPOS_DOCS_MUDANCA;
        this.carregando = false; this.cdr.markForCheck();
      },
      error: (e) => {
        if (e.status === 401) {
          localStorage.removeItem('integracao_token');
          localStorage.removeItem('integracao_lead');
          this.router.navigate(['/integracao/entrar']);
        } else {
          const detalhe = e.error?.mensagem || e.error?.message || e.message || '';
          this.erroCarregar = `Erro ${e.status || ''}${detalhe ? ': ' + detalhe : ' ao carregar painel.'}`;
          this.carregando = false; this.cdr.markForCheck();
        }
      }
    });
  }

  abrirModalDocs(): void {
    this.modalDocsVisivel = true;
    this.cdr.markForCheck();
  }

  gerarBeforeUpload(tipo: string) {
    return (file: NzUploadFile): boolean => {
      if (file.type !== 'application/pdf') { this.msg.warning('Apenas arquivos PDF são aceitos.'); return false; }
      if ((file.size ?? 0) > 10 * 1024 * 1024) { this.msg.warning('O arquivo excede 10 MB.'); return false; }

      this.uploading[tipo] = true; this.cdr.markForCheck();
      const fd = new FormData();
      fd.append('arquivo', file as any);

      this.http.post(`${this.api}/Integracao/UploadDocumento?tipo=${tipo}`, fd, { headers: this.headers(true) }).subscribe({
        next: () => {
          this.msg.success('Documento enviado!');
          this.uploading[tipo] = false;
          this.carregar();
        },
        error: (e) => {
          this.msg.error(e.error?.mensagem || 'Erro ao enviar documento.');
          this.uploading[tipo] = false; this.cdr.markForCheck();
        }
      });
      return false;
    };
  }

  /* ── Helpers documentos ── */
  getDoc(tipo: string): DocumentoDto | undefined {
    return this.painel?.documentos.find(d => d.tipo === tipo);
  }
  getDocStatus(tipo: string): string { return this.getDoc(tipo)?.status ?? 'nenhum'; }
  getDocNome(tipo: string): string   { return this.getDoc(tipo)?.nomeArquivo ?? ''; }
  getDocData(tipo: string): string   { return this.getDoc(tipo)?.dataUpload ?? ''; }
  getDocRecusa(tipo: string): string | undefined { return this.getDoc(tipo)?.motivoRecusa ?? undefined; }
  getDocColor(tipo: string): string {
    const s = this.getDocStatus(tipo);
    return s === 'aprovado' ? 'success' : s === 'recusado' ? 'error' : s === 'pendente' ? 'processing' : 'default';
  }
  getDocStatusLabel(tipo: string): string {
    const s = this.getDocStatus(tipo);
    return s === 'aprovado' ? 'Aprovado' : s === 'recusado' ? 'Recusado' : s === 'pendente' ? 'Em análise' : 'Não enviado';
  }
  getDocIcon(tipo: string): string {
    const s = this.getDocStatus(tipo);
    return s === 'aprovado' ? 'check-circle' : s === 'recusado' ? 'close-circle' : s === 'pendente' ? 'clock-circle' : 'file-add';
  }

  /* ── Helpers etapas ── */
  etapaLabel(chave: string): string      { return ETAPAS_CONFIG[chave]?.label ?? chave; }
  etapaDescricao(chave: string): string  { return ETAPAS_CONFIG[chave]?.descricao ?? ''; }
  etapaIcone(chave: string): string      { return ETAPAS_CONFIG[chave]?.icone ?? 'ellipsis'; }

  etapaBallClass(status: string): string {
    return status === 'concluido' ? 'ball-concluido' : status === 'em_processo' ? 'ball-processo' : 'ball-pendente';
  }
  etapaTagColor(status: string): string {
    return status === 'concluido' ? 'success' : status === 'em_processo' ? 'processing' : 'default';
  }
  etapaStatusLabel(status: string): string {
    return status === 'concluido' ? 'Concluído' : status === 'em_processo' ? 'Em processo' : 'Pendente';
  }

  histDotClass(evento: string): string {
    if (evento.includes('aprovado') || evento.includes('concluido')) return 'hist-dot hist-dot-green';
    if (evento.includes('recusado')) return 'hist-dot hist-dot-red';
    if (evento === 'cadastro') return 'hist-dot';
    return 'hist-dot hist-dot-gray';
  }

  sair(): void {
    this.modal.confirm({
      nzTitle: 'Deseja sair?',
      nzOnOk: () => {
        localStorage.removeItem('integracao_token');
        localStorage.removeItem('integracao_lead');
        this.router.navigate(['/integracao/entrar']);
      }
    });
  }

  private headers(multipart = false): HttpHeaders {
    const token = localStorage.getItem('integracao_token') ?? '';
    return multipart
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  }
}
