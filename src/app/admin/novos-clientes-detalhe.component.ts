import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService, NzMessageModule } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { PageTitleComponent } from '../page-title.component';
import { LoginService } from '../services/login.service';
import { environment } from '../../environments/environment';

interface DocumentoDto {
  id: number;
  tipo: string;
  nomeArquivo: string;
  status: string;
  motivoRecusa: string;
  dataUpload: string;
}

interface HistoricoDto {
  evento: string;
  descricao: string;
  autor: string;
  data: string;
}

interface LeadDetalhe {
  id: number;
  tipo: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  nomeResponsavel: string;
  email: string;
  telefone: string;
  status: string;
  observacaoAnalista: string;
  documentos: DocumentoDto[];
  historico: HistoricoDto[];
  etapas: EtapaDto[];
}

interface EtapaDto {
  id: number;
  chave: string;
  ordem: number;
  status: string;
  observacao: string;
  linkPagamento: string;
  dataAtualizacao: string;
  analistaResponsavel: string;
}

const ETAPAS_CONFIG: Record<string, string> = {
  // Abertura de Empresa
  pagamentos_taxas:            'Pagamentos / Taxas',
  envio_documentos:            'Envio de Documentos',
  contrato_social:             'Criação de Contrato Social',
  receita_federal:             'Processo Receita Federal / Jucesp',
  certificado_digital:         'Criar Certificado Digital',
  prefeitura_ecac:             'Cadastro Prefeitura / ECAC',
  // Mudança de Contabilidade
  pagamento_mensalidade:       'Pagamento Mensalidade',
  certificado_digital_cliente: 'Envio do Certificado Digital',
  validar_prefeitura_ecac:     'Validar acesso Prefeitura / ECAC',
};

const LABEL_TIPO: Record<string, string> = {
  cartao_cnpj:           'Cartão CNPJ',
  contrato_social:       'Contrato Social',
  cpf_socio:             'CPF do Sócio',
  rg_socio:              'RG do Sócio',
  comprovante_endereco:  'Comprovante de Endereço',
  certidao_casamento:    'Certidão de Casamento',
  representante_cnh:     'Representante Legal (CNH)',
  cartao_simples:        'Cartão do Simples Nacional',
};

@Component({
  selector: 'app-novos-clientes-detalhe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTagModule, NzIconModule, NzButtonModule, NzSkeletonModule,
    NzModalModule, NzMessageModule, NzGridModule, NzDividerModule,
    NzTimelineModule, NzInputModule, NzDescriptionsModule, NzPopconfirmModule, NzToolTipModule, NzSelectModule,
    PageTitleComponent,
  ],
  template: `
    <app-page-title
      [title]="lead?.razaoSocial || 'Carregando...'"
      [subtitle]="lead ? (lead.tipo === 'abertura' ? 'Abertura de Empresa' : 'Mudança de Contabilidade') : ''">
    </app-page-title>

    <div style="margin:16px">
      <button nz-button nzType="default" (click)="voltar()" style="margin-bottom:16px">
        <i nz-icon nzType="arrow-left"></i> Voltar
      </button>

      <nz-skeleton [nzLoading]="loading" [nzActive]="true" [nzParagraph]="{rows:8}">
        <ng-container *ngIf="lead">

          <!-- Cabeçalho do lead -->
          <nz-card style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
              <div>
                <h2 style="margin:0">{{ lead.razaoSocial }}
                  <nz-tag [nzColor]="lead.tipo === 'abertura' ? 'blue' : 'purple'" style="margin-left:8px">
                    {{ lead.tipo === 'abertura' ? 'Abertura de Empresa' : 'Mudança de Contabilidade' }}
                  </nz-tag>
                </h2>
                <div *ngIf="lead.nomeFantasia" style="color:#888;margin-top:2px">{{ lead.nomeFantasia }}</div>
              </div>
              <nz-tag [nzColor]="statusColor(lead.status)" style="font-size:14px;padding:4px 12px">
                {{ statusLabel(lead.status) }}
              </nz-tag>
            </div>

            <nz-divider style="margin:12px 0"></nz-divider>

            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="8">
                <div class="info-label">Responsável</div>
                <div class="info-value">{{ lead.nomeResponsavel }}</div>
              </div>
              <div nz-col [nzSpan]="8">
                <div class="info-label">E-mail</div>
                <div class="info-value">{{ lead.email }}</div>
              </div>
              <div nz-col [nzSpan]="8">
                <div class="info-label">Telefone</div>
                <div class="info-value">{{ lead.telefone }}</div>
              </div>
              <div nz-col [nzSpan]="8" *ngIf="lead.cnpj" style="margin-top:12px">
                <div class="info-label">CNPJ</div>
                <div class="info-value">{{ lead.cnpj }}</div>
              </div>
              <div nz-col [nzSpan]="16" *ngIf="lead.observacaoAnalista" style="margin-top:12px">
                <div class="info-label">Observação do Analista</div>
                <div class="info-value" style="color:#d48806">{{ lead.observacaoAnalista }}</div>
              </div>
            </div>
          </nz-card>

          <!-- Etapas do processo (primeiro item em evidência) -->
          <nz-card class="etapas-card" style="margin-bottom:16px">
            <div class="etapas-card-header">
              <span class="etapas-card-title"><i nz-icon nzType="dollar" style="margin-right:8px"></i>Etapas do Processo</span>
              <nz-tag *ngIf="!pagamentoConcluido" nzColor="orange">Aguardando pagamento</nz-tag>
              <nz-tag *ngIf="pagamentoConcluido" nzColor="success">Pagamento concluído</nz-tag>
            </div>
            <div *ngIf="!pagamentoConcluido" class="etapas-aviso">
              Conclua a etapa de pagamento para liberar a alteração das demais etapas.
            </div>
            <div *ngFor="let etapa of etapasOrdenadas"
              class="etapa-admin-row"
              [class.etapa-destaque]="isEtapaPagamento(etapa.chave)"
              [class.etapa-bloqueada]="etapaBloqueada(etapa)">
              <div class="etapa-admin-info">
                <div class="etapa-admin-label">
                  <nz-tag *ngIf="isEtapaPagamento(etapa.chave)" nzColor="gold" style="margin-right:6px">1º</nz-tag>
                  {{ etapaLabel(etapa.chave) }}
                </div>
                <div *ngIf="etapa.observacao" style="font-size:12px;color:#888;margin-top:2px">{{ etapa.observacao }}</div>
                <div *ngIf="etapa.linkPagamento" style="font-size:12px;margin-top:2px">
                  <a [href]="etapa.linkPagamento" target="_blank">{{ etapa.linkPagamento }}</a>
                </div>
                <div *ngIf="etapa.dataAtualizacao" style="font-size:11px;color:#bbb;margin-top:2px">
                  Atualizado em {{ etapa.dataAtualizacao }} por {{ etapa.analistaResponsavel }}
                </div>
              </div>
              <div class="etapa-admin-acoes">
                <nz-tag [nzColor]="etapaTagColor(etapa.status)">{{ etapaStatusLabel(etapa.status) }}</nz-tag>
                <button *ngIf="!etapaBloqueada(etapa)" nz-button nzType="link" nzSize="small" (click)="abrirEtapaModal(etapa)">
                  <i nz-icon nzType="edit"></i> {{ isEtapaPagamento(etapa.chave) ? 'Validar pagamento' : 'Alterar' }}
                </button>
                <span *ngIf="etapaBloqueada(etapa)" nz-tooltip nzTooltipTitle="Conclua o pagamento para liberar esta etapa" style="color:#bbb;font-size:12px">
                  <i nz-icon nzType="lock"></i> Bloqueada
                </span>
              </div>
            </div>
            <div *ngIf="!etapasOrdenadas.length" style="color:#999;font-size:13px">Nenhuma etapa encontrada.</div>
          </nz-card>

          <!-- Documentos -->
          <nz-card [nzTitle]="'Documentos (' + lead.documentos.length + ')'" style="margin-bottom:16px">
            <div *ngIf="lead.documentos.length === 0" style="color:#888;padding:16px 0">
              Nenhum documento enviado ainda.
            </div>
            <div *ngFor="let doc of lead.documentos" class="doc-row">
              <div class="doc-info">
                <i nz-icon [nzType]="isImagemNome(doc.nomeArquivo) ? 'file' : 'file-text'"
                  [style.color]="isImagemNome(doc.nomeArquivo) ? '#1890ff' : '#ff4d4f'"
                  style="font-size:20px;margin-right:10px"></i>
                <div>
                  <div class="doc-nome">{{ labelTipo(doc.tipo) }}</div>
                  <div class="doc-arquivo">{{ doc.nomeArquivo }} &middot; {{ doc.dataUpload }}</div>
                  <div *ngIf="doc.motivoRecusa" class="doc-recusa">Motivo: {{ doc.motivoRecusa }}</div>
                </div>
              </div>
              <div class="doc-acoes">
                <nz-tag [nzColor]="docStatusColor(doc.status)">{{ docStatusLabel(doc.status) }}</nz-tag>
                <button nz-button nzType="default" nzSize="small" (click)="visualizar(doc)" nz-tooltip nzTooltipTitle="Visualizar">
                  <i nz-icon nzType="eye"></i>
                </button>
                <button nz-button nzType="default" nzSize="small" (click)="baixar(doc.id)" nz-tooltip nzTooltipTitle="Abrir em nova aba">
                  <i nz-icon nzType="download"></i>
                </button>
                <button nz-button nzType="primary" nzSize="small" *ngIf="doc.status !== 'aprovado'"
                  nz-popconfirm nzPopconfirmTitle="Aprovar este documento?" (nzOnConfirm)="aprovarDoc(doc.id)">
                  <i nz-icon nzType="check"></i> Aprovar
                </button>
                <button nz-button nzDanger nzSize="small" *ngIf="doc.status !== 'recusado'"
                  (click)="abrirRecusaDoc(doc.id)">
                  <i nz-icon nzType="close"></i> Recusar
                </button>
              </div>
            </div>
          </nz-card>

          <!-- Ações do lead -->
          <nz-card [nzTitle]="'Ação sobre o Lead'" style="margin-bottom:16px"
            *ngIf="lead.status !== 'aprovado' && lead.status !== 'recusado'">
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <button nz-button nzType="primary" (click)="abrirAprovarLead()">
                <i nz-icon nzType="check-circle"></i> Aprovar Lead
              </button>
              <button nz-button nzDanger (click)="abrirRecusarLead()">
                <i nz-icon nzType="close-circle"></i> Recusar Lead
              </button>
            </div>
          </nz-card>

          <!-- Histórico -->
          <nz-card nzTitle="Histórico">
            <nz-timeline>
              <nz-timeline-item *ngFor="let h of lead.historico" [nzColor]="h.evento.includes('recus') ? 'red' : h.evento.includes('aprov') ? 'green' : 'blue'">
                <div style="font-weight:600">{{ h.descricao }}</div>
                <div style="font-size:12px;color:#888">{{ h.data | date:'dd/MM/yyyy HH:mm' }} &middot; {{ h.autor }}</div>
              </nz-timeline-item>
            </nz-timeline>
            <div *ngIf="!lead.historico?.length" style="color:#888">Sem histórico.</div>
          </nz-card>

        </ng-container>
      </nz-skeleton>
    </div>

    <!-- Modal: Visualizar documento -->
    <nz-modal
      [(nzVisible)]="modalPreview"
      [nzTitle]="previewTitulo"
      [nzFooter]="null"
      nzWidth="860px"
      (nzOnCancel)="fecharPreview()">
      <ng-container *nzModalContent>
        <div *ngIf="previewCarregando" style="text-align:center;padding:40px;color:#888">Carregando...</div>
        <img *ngIf="!previewCarregando && previewUrl"
          [src]="previewUrl"
          [alt]="previewTitulo"
          style="max-width:100%;max-height:70vh;display:block;margin:0 auto;border-radius:8px" />
      </ng-container>
    </nz-modal>

    <!-- Modal: Recusar Documento -->
    <nz-modal
      [(nzVisible)]="modalRecusaDoc"
      nzTitle="Recusar Documento"
      (nzOnOk)="confirmarRecusaDoc()"
      (nzOnCancel)="modalRecusaDoc=false"
      [nzOkLoading]="salvando"
      nzOkText="Recusar"
      nzOkDanger>
      <ng-container *nzModalContent>
        <p>Informe o motivo da recusa:</p>
        <textarea nz-input [(ngModel)]="motivoRecusa" rows="3" placeholder="Ex: Documento ilegível, fora do prazo..."></textarea>
      </ng-container>
    </nz-modal>

    <!-- Modal: Aprovar Lead -->
    <nz-modal
      [(nzVisible)]="modalAprovarLead"
      nzTitle="Aprovar Lead"
      (nzOnOk)="confirmarAprovarLead()"
      (nzOnCancel)="modalAprovarLead=false"
      [nzOkLoading]="salvando"
      nzOkText="Aprovar">
      <ng-container *nzModalContent>
        <p>Confirma a aprovação deste lead? O acesso à plataforma será liberado.</p>
        <textarea nz-input [(ngModel)]="obsAprovacao" rows="2" placeholder="Observação (opcional)"></textarea>
      </ng-container>
    </nz-modal>

    <!-- Modal: Alterar Etapa -->
    <nz-modal
      [(nzVisible)]="modalEtapa"
      nzTitle="Atualizar Etapa"
      (nzOnOk)="confirmarEtapa()"
      (nzOnCancel)="modalEtapa=false"
      [nzOkLoading]="salvando"
      nzOkText="Salvar">
      <ng-container *nzModalContent>
        <div *ngIf="etapaSelecionada" style="display:flex;flex-direction:column;gap:12px">
          <div><strong>{{ etapaLabel(etapaSelecionada.chave) }}</strong></div>
          <div>
            <div style="margin-bottom:4px;font-size:13px;color:#555">Status</div>
            <nz-select [(ngModel)]="etapaNovoStatus" style="width:100%">
              <nz-option nzValue="pendente"    nzLabel="Pendente"></nz-option>
              <nz-option nzValue="em_processo" nzLabel="Em Processo"></nz-option>
              <nz-option nzValue="concluido"   nzLabel="Concluído"></nz-option>
            </nz-select>
          </div>
          <div>
            <div style="margin-bottom:4px;font-size:13px;color:#555">Observação (opcional)</div>
            <textarea nz-input [(ngModel)]="etapaNovaObs" rows="2" placeholder="Ex: Aguardando assinatura..."></textarea>
          </div>
          <div *ngIf="etapaSelecionada.chave === 'pagamentos_taxas' || etapaSelecionada.chave === 'pagamento_mensalidade'">
            <div style="margin-bottom:4px;font-size:13px;color:#555">Link de Pagamento (opcional)</div>
            <input nz-input [(ngModel)]="etapaNovoLink" placeholder="https://..." />
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Modal: Recusar Lead -->
    <nz-modal
      [(nzVisible)]="modalRecusarLead"
      nzTitle="Recusar Lead"
      (nzOnOk)="confirmarRecusarLead()"
      (nzOnCancel)="modalRecusarLead=false"
      [nzOkLoading]="salvando"
      nzOkText="Recusar"
      nzOkDanger>
      <ng-container *nzModalContent>
        <p>Informe o motivo da recusa do lead:</p>
        <textarea nz-input [(ngModel)]="motivoRecusaLead" rows="3" placeholder="Ex: Documentação incompleta..."></textarea>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .info-label { font-size:12px; color:#888; margin-bottom:2px }
    .info-value  { font-weight:500 }
    .doc-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; padding:12px 0; border-bottom:1px solid #f0f0f0 }
    .doc-row:last-child { border-bottom:none }
    .doc-info { display:flex; align-items:center }
    .doc-nome { font-weight:600 }
    .doc-arquivo { font-size:12px; color:#888 }
    .doc-recusa { font-size:12px; color:#ff4d4f }
    .doc-acoes { display:flex; align-items:center; gap:6px; flex-wrap:wrap }
    .etapa-admin-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; padding:10px 0; border-bottom:1px solid #f5f5f5 }
    .etapa-admin-row:last-child { border-bottom:none }
    .etapa-admin-info { flex:1 }
    .etapa-admin-label { font-weight:600; font-size:14px }
    .etapa-admin-acoes { display:flex; align-items:center; gap:6px }
    .etapas-card { border:1px solid #ffe58f !important; box-shadow:0 4px 14px rgba(250,173,20,.18) }
    .etapas-card-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; flex-wrap:wrap }
    .etapas-card-title { font-size:16px; font-weight:700; color:#d48806 }
    .etapas-aviso { background:#fffbe6; border:1px solid #ffe58f; color:#ad6800; padding:8px 12px; border-radius:8px; font-size:13px; margin-bottom:12px }
    .etapa-destaque { background:#fffbe6; border-radius:8px; padding:12px 10px !important; border:1px solid #ffe58f !important; margin-bottom:8px }
    .etapa-bloqueada { opacity:.55 }
  `],
})
export class NovosClientesDetalheComponent implements OnInit {
  lead: LeadDetalhe | null = null;
  loading = false;
  salvando = false;

  modalRecusaDoc = false;
  motivoRecusa = '';
  docIdSelecionado = 0;

  modalAprovarLead = false;
  obsAprovacao = '';

  modalRecusarLead = false;
  motivoRecusaLead = '';

  modalPreview = false;
  previewUrl = '';
  previewTitulo = '';
  previewCarregando = false;

  modalEtapa = false;
  etapaSelecionada: EtapaDto | null = null;
  etapaNovoStatus = 'pendente';
  etapaNovaObs = '';
  etapaNovoLink = '';

  get etapasOrdenadas(): EtapaDto[] {
    return (this.lead?.etapas ?? []).slice().sort((a, b) => a.ordem - b.ordem);
  }

  get pagamentoConcluido(): boolean {
    const pag = this.etapasOrdenadas.find(e => this.isEtapaPagamento(e.chave));
    return pag?.status === 'concluido';
  }

  isEtapaPagamento(chave: string): boolean {
    return chave === 'pagamentos_taxas' || chave === 'pagamento_mensalidade';
  }

  etapaBloqueada(etapa: EtapaDto): boolean {
    return !this.isEtapaPagamento(etapa.chave) && !this.pagamentoConcluido;
  }

  etapaLabel(chave: string): string  { return ETAPAS_CONFIG[chave] ?? chave; }
  etapaTagColor(status: string): string {
    return status === 'concluido' ? 'success' : status === 'em_processo' ? 'processing' : 'default';
  }
  etapaStatusLabel(status: string): string {
    return status === 'concluido' ? 'Concluído' : status === 'em_processo' ? 'Em Processo' : 'Pendente';
  }

  abrirEtapaModal(etapa: EtapaDto): void {
    if (this.etapaBloqueada(etapa)) {
      this.msg.warning('Conclua a etapa de pagamento antes de alterar as demais.');
      return;
    }
    this.etapaSelecionada = etapa;
    this.etapaNovoStatus = etapa.status;
    this.etapaNovaObs = etapa.observacao ?? '';
    this.etapaNovoLink = etapa.linkPagamento ?? '';
    this.modalEtapa = true;
    this.cd.markForCheck();
  }

  confirmarEtapa(): void {
    if (!this.etapaSelecionada) return;
    if (this.etapaBloqueada(this.etapaSelecionada)) {
      this.msg.warning('Conclua a etapa de pagamento antes de alterar as demais.');
      return;
    }
    this.salvando = true;
    const body = { status: this.etapaNovoStatus, observacao: this.etapaNovaObs, linkPagamento: this.etapaNovoLink };
    this.http.put(`${this.api}/Integracao/Admin/Lead/${this.lead!.id}/Etapa/${this.etapaSelecionada.chave}`, body, { headers: this.headers() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.salvando = false;
        this.modalEtapa = false;
        this.msg.success('Etapa atualizada.');
        this.recarregar();
      });
  }

  private readonly api = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private loginService: LoginService,
    private msg: NzMessageService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar(id);
  }

  carregar(id: number): void {
    this.loading = true;
    this.http.get<LeadDetalhe>(`${this.api}/Integracao/Admin/Lead/${id}`, { headers: this.headers() })
      .pipe(catchError(() => of(null)))
      .subscribe(data => {
        this.lead = data;
        this.loading = false;
        this.cd.markForCheck();
      });
  }

  voltar(): void { this.router.navigate(['/administrativo/novos-clientes']); }

  isImagemNome(nome: string | undefined): boolean {
    return /\.(jpe?g|png|gif|webp)$/i.test(nome ?? '');
  }

  visualizar(doc: DocumentoDto): void {
    this.previewCarregando = true;
    this.previewUrl = '';
    this.previewTitulo = this.labelTipo(doc.tipo) + ' — ' + (doc.nomeArquivo ?? '');
    this.http.get<{ url: string; nomeArquivo: string; isImagem?: boolean }>(
      `${this.api}/Integracao/Admin/Documento/${doc.id}/Download`,
      { headers: this.headers() }
    ).pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (!res?.url) {
          this.previewCarregando = false;
          this.msg.error('Não foi possível abrir o documento.');
          this.cd.markForCheck();
          return;
        }
        const imagem = res.isImagem || this.isImagemNome(res.nomeArquivo || doc.nomeArquivo);
        if (imagem) {
          this.previewUrl = res.url;
          this.previewCarregando = false;
          this.modalPreview = true;
        } else {
          this.previewCarregando = false;
          window.open(res.url, '_blank');
        }
        this.cd.markForCheck();
      });
  }

  fecharPreview(): void {
    this.modalPreview = false;
    this.previewUrl = '';
  }

  baixar(docId: number): void {
    this.http.get<{ url: string; nomeArquivo: string }>(`${this.api}/Integracao/Admin/Documento/${docId}/Download`, { headers: this.headers() })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (res?.url) { window.open(res.url, '_blank'); }
        else { this.msg.error('Não foi possível gerar o link de download.'); }
      });
  }

  aprovarDoc(docId: number): void {
    this.http.post(`${this.api}/Integracao/Admin/Documento/${docId}/Aprovar`, {}, { headers: this.headers() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.msg.success('Documento aprovado.');
        this.recarregar();
      });
  }

  abrirRecusaDoc(docId: number): void {
    this.docIdSelecionado = docId;
    this.motivoRecusa = '';
    this.modalRecusaDoc = true;
    this.cd.markForCheck();
  }

  confirmarRecusaDoc(): void {
    if (!this.motivoRecusa.trim()) { this.msg.warning('Informe o motivo.'); return; }
    this.salvando = true;
    this.http.post(`${this.api}/Integracao/Admin/Documento/${this.docIdSelecionado}/Recusar`, { motivo: this.motivoRecusa }, { headers: this.headers() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.salvando = false;
        this.modalRecusaDoc = false;
        this.msg.success('Documento recusado.');
        this.recarregar();
      });
  }

  abrirAprovarLead(): void {
    this.obsAprovacao = '';
    this.modalAprovarLead = true;
    this.cd.markForCheck();
  }

  confirmarAprovarLead(): void {
    this.salvando = true;
    this.http.post(`${this.api}/Integracao/Admin/Lead/${this.lead!.id}/Aprovar`, { observacao: this.obsAprovacao }, { headers: this.headers() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.salvando = false;
        this.modalAprovarLead = false;
        this.msg.success('Lead aprovado! Acesso liberado.');
        this.recarregar();
      });
  }

  abrirRecusarLead(): void {
    this.motivoRecusaLead = '';
    this.modalRecusarLead = true;
    this.cd.markForCheck();
  }

  confirmarRecusarLead(): void {
    if (!this.motivoRecusaLead.trim()) { this.msg.warning('Informe o motivo.'); return; }
    this.salvando = true;
    this.http.post(`${this.api}/Integracao/Admin/Lead/${this.lead!.id}/Recusar`, { motivo: this.motivoRecusaLead }, { headers: this.headers() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.salvando = false;
        this.modalRecusarLead = false;
        this.msg.success('Lead recusado.');
        this.recarregar();
      });
  }

  labelTipo(tipo: string): string { return LABEL_TIPO[tipo] ?? tipo; }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      aguardando_documentos: 'Aguardando Documentos',
      em_analise: 'Em Análise',
      aprovado: 'Aprovado',
      recusado: 'Recusado',
    };
    return map[s] ?? s;
  }

  statusColor(s: string): string {
    const map: Record<string, string> = {
      aguardando_documentos: 'orange',
      em_analise: 'processing',
      aprovado: 'success',
      recusado: 'error',
    };
    return map[s] ?? 'default';
  }

  docStatusLabel(s: string): string {
    const map: Record<string, string> = { aguardando: 'Aguardando', aprovado: 'Aprovado', recusado: 'Recusado' };
    return map[s] ?? s;
  }

  docStatusColor(s: string): string {
    const map: Record<string, string> = { aguardando: 'orange', aprovado: 'success', recusado: 'error' };
    return map[s] ?? 'default';
  }

  private recarregar(): void { this.carregar(this.lead!.id); }

  private headers(): HttpHeaders {
    const token = this.loginService.obterToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
