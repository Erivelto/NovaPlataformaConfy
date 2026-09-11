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
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzAlertModule } from 'ng-zorro-antd/alert';
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
  descricaoAtividade: string;
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
  receita_federal:             'Processo Receita Federal',
  jucesp:                      'Jucesp',
  certificado_digital:         'Criar Certificado Digital',
  prefeitura_ecac:             'Cadastro Prefeitura/Simples Nacional',
  // Mudança de Contabilidade
  pagamento_mensalidade:       'Pagamento Mensalidade',
  certificado_digital_cliente: 'Envio do Certificado Digital',
  validar_prefeitura_ecac:     'Validar acesso Prefeitura/Simples Nacional',
};

const ORDEM_ETAPAS_MUDANCA: Record<string, number> = {
  envio_documentos: 1,
  certificado_digital_cliente: 2,
  validar_prefeitura_ecac: 3,
  pagamento_mensalidade: 4,
};

function ordenarEtapas(etapas: EtapaDto[], tipo?: string): EtapaDto[] {
  const isMudanca = (tipo ?? 'mudanca').toLowerCase() !== 'abertura';
  if (!isMudanca) {
    return etapas.slice().sort((a, b) => a.ordem - b.ordem);
  }
  return etapas.slice().sort((a, b) =>
    (ORDEM_ETAPAS_MUDANCA[a.chave] ?? a.ordem) - (ORDEM_ETAPAS_MUDANCA[b.chave] ?? b.ordem));
}

const LABEL_TIPO: Record<string, string> = {
  cartao_cnpj:              'Cartão CNPJ',
  contrato_social:          'Contrato Social',
  contrato_social_minuta:   'Minuta do Contrato Social',
  contrato_social_assinado: 'Contrato Social Assinado',
  jucesp_minuta:            'Minuta Jucesp',
  jucesp_assinado:          'Jucesp Assinado',
  cpf_socio:                'CPF do Sócio',
  rg_socio:                 'RG do Sócio',
  comprovante_endereco:     'Comprovante de Endereço',
  certidao_casamento:       'Certidão de Casamento',
  representante_cnh:        'Representante Legal (CNH)',
  cartao_simples:           'Cartão do Simples Nacional',
  espelho_iptu:             'Espelho do IPTU',
};

@Component({
  selector: 'app-novos-clientes-detalhe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzTagModule, NzIconModule, NzButtonModule, NzSkeletonModule,
    NzModalModule, NzMessageModule, NzGridModule, NzDividerModule,
    NzTimelineModule, NzInputModule, NzDescriptionsModule, NzPopconfirmModule, NzToolTipModule, NzSelectModule, NzRadioModule, NzAlertModule,
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

          <!-- Dados do cadastro -->
          <nz-card class="lead-dados-card" style="margin-bottom:16px">
            <div class="lead-dados-topo">
              <div>
                <div class="lead-dados-kicker">Dados informados no cadastro</div>
                <h2 class="lead-dados-titulo">{{ lead.razaoSocial || '—' }}</h2>
                <div class="lead-dados-tags">
                  <nz-tag [nzColor]="lead.tipo === 'abertura' ? 'blue' : 'purple'">
                    {{ lead.tipo === 'abertura' ? 'Abertura de Empresa' : 'Mudança de Contabilidade' }}
                  </nz-tag>
                  <nz-tag [nzColor]="statusColor(lead.status)">{{ statusLabel(lead.status) }}</nz-tag>
                  <span class="lead-id">Lead #{{ lead.id }}</span>
                </div>
              </div>
            </div>

            <nz-descriptions nzBordered [nzColumn]="descricoesColunas" nzSize="middle" class="lead-descriptions">
              <nz-descriptions-item nzTitle="Razão Social" [nzSpan]="lead.tipo === 'abertura' ? 2 : 1">
                {{ exibir(lead.razaoSocial) }}
              </nz-descriptions-item>
              <nz-descriptions-item *ngIf="lead.tipo === 'abertura'" nzTitle="Nome Fantasia">
                {{ exibir(lead.nomeFantasia) }}
              </nz-descriptions-item>
              <nz-descriptions-item *ngIf="lead.tipo === 'mudanca'" nzTitle="CNPJ">
                {{ formatCnpj(lead.cnpj) }}
              </nz-descriptions-item>
              <nz-descriptions-item *ngIf="lead.tipo === 'abertura'" nzTitle="Descrição da Atividade" [nzSpan]="3">
                <span class="desc-atividade">{{ exibir(lead.descricaoAtividade) }}</span>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="Responsável">
                {{ exibir(lead.nomeResponsavel) }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="E-mail">
                <a [href]="'mailto:' + lead.email">{{ exibir(lead.email) }}</a>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="Telefone / WhatsApp">
                {{ exibir(lead.telefone) }}
              </nz-descriptions-item>
              <nz-descriptions-item *ngIf="lead.observacaoAnalista" nzTitle="Observação do Analista" [nzSpan]="3">
                <span class="obs-analista">{{ lead.observacaoAnalista }}</span>
              </nz-descriptions-item>
            </nz-descriptions>
          </nz-card>

          <!-- Etapas do processo -->
          <nz-card class="etapas-card" [class.etapas-card-abertura]="isAbertura" style="margin-bottom:16px">
            <div class="etapas-card-header">
              <span class="etapas-card-title"><i nz-icon nzType="dollar" style="margin-right:8px"></i>Etapas do Processo</span>
              <nz-tag *ngIf="isAbertura && !pagamentoConcluido" nzColor="orange">Aguardando pagamento</nz-tag>
              <nz-tag *ngIf="isAbertura && pagamentoConcluido" nzColor="success">Pagamento concluído</nz-tag>
              <nz-tag *ngIf="isMudanca && !pagamentoConcluido" nzColor="default">Mensalidade pendente</nz-tag>
              <nz-tag *ngIf="isMudanca && pagamentoConcluido" nzColor="success">Mensalidade concluída</nz-tag>
            </div>
            <div *ngIf="isAbertura && !pagamentoConcluido" class="etapas-aviso">
              Conclua a etapa de pagamento para liberar a alteração das demais etapas.
            </div>
            <div *ngFor="let etapa of etapasOrdenadas"
              class="etapa-admin-row"
              [class.etapa-destaque]="isEtapaPagamento(etapa.chave) && isAbertura"
              [class.etapa-bloqueada]="etapaBloqueada(etapa)">
              <div class="etapa-admin-info">
                <div class="etapa-admin-label">
                  <nz-tag *ngIf="isEtapaPagamento(etapa.chave) && isAbertura" nzColor="gold" style="margin-right:6px">1º</nz-tag>
                  <nz-tag *ngIf="isEtapaPagamento(etapa.chave) && isMudanca" nzColor="blue" style="margin-right:6px">Último</nz-tag>
                  {{ etapaLabel(etapa.chave) }}
                </div>
                <div *ngIf="etapa.observacao" style="font-size:12px;color:#888;margin-top:2px">{{ etapa.observacao }}</div>
                <div *ngIf="etapa.linkPagamento" style="font-size:12px;margin-top:2px">
                  <a [href]="etapa.linkPagamento" target="_blank">{{ etapa.linkPagamento }}</a>
                </div>
                <div *ngIf="etapa.dataAtualizacao" style="font-size:11px;color:#bbb;margin-top:2px">
                  Atualizado em {{ etapa.dataAtualizacao }} por {{ etapa.analistaResponsavel }}
                </div>

                <!-- Upload minuta (abertura) -->
                <div *ngIf="etapa.chave === 'contrato_social' && isAbertura" class="contrato-admin-box">
                  <div *ngIf="minutaContrato" class="contrato-admin-info">
                    Minuta: <strong>{{ minutaContrato.nomeArquivo }}</strong>
                    <button nz-button nzType="link" nzSize="small" (click)="baixar(minutaContrato.id)">
                      <i nz-icon nzType="download"></i>
                    </button>
                  </div>
                  <div class="contrato-admin-upload">
                    <input #minutaInp type="file" hidden accept=".pdf,application/pdf"
                      (change)="onMinutaSelecionada($event)" />
                    <button nz-button nzType="default" nzSize="small" [nzLoading]="enviandoMinuta"
                      (click)="minutaInp.click()">
                      <i nz-icon nzType="upload"></i>
                      {{ minutaContrato ? 'Substituir minuta (PDF)' : 'Enviar minuta (PDF)' }}
                    </button>
                  </div>
                  <div *ngIf="contratoAssinado" class="contrato-admin-info">
                    Assinado: {{ contratoAssinado.nomeArquivo }}
                    <nz-tag [nzColor]="docStatusColor(contratoAssinado.status)">{{ docStatusLabel(contratoAssinado.status) }}</nz-tag>
                  </div>
                </div>

                <div *ngIf="etapa.chave === 'jucesp' && isAbertura" class="contrato-admin-box">
                  <div *ngIf="minutaJucesp" class="contrato-admin-info">
                    Minuta: <strong>{{ minutaJucesp.nomeArquivo }}</strong>
                    <button nz-button nzType="link" nzSize="small" (click)="baixar(minutaJucesp.id)">
                      <i nz-icon nzType="download"></i>
                    </button>
                  </div>
                  <div class="contrato-admin-upload">
                    <input #minutaJucespInp type="file" hidden accept=".pdf,application/pdf"
                      (change)="onMinutaJucespSelecionada($event)" />
                    <button nz-button nzType="default" nzSize="small" [nzLoading]="enviandoMinutaJucesp"
                      (click)="minutaJucespInp.click()">
                      <i nz-icon nzType="upload"></i>
                      {{ minutaJucesp ? 'Substituir minuta (PDF)' : 'Enviar minuta (PDF)' }}
                    </button>
                  </div>
                  <div *ngIf="jucespAssinado" class="contrato-admin-info">
                    Assinado: {{ jucespAssinado.nomeArquivo }}
                    <nz-tag [nzColor]="docStatusColor(jucespAssinado.status)">{{ docStatusLabel(jucespAssinado.status) }}</nz-tag>
                  </div>
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

          <nz-alert *ngIf="lead.status === 'processando_aprovacao'" nzType="info" nzShowIcon
            nzMessage="Cadastro em processamento"
            nzDescription="A consulta à Receita e o cadastro do cliente estão em andamento. Você receberá uma notificação ao concluir."
            style="margin-bottom:16px">
          </nz-alert>

          <!-- Ações do lead -->
          <nz-card [nzTitle]="'Ação sobre o Lead'" style="margin-bottom:16px"
            *ngIf="lead.status !== 'aprovado' && lead.status !== 'recusado' && lead.status !== 'processando_aprovacao'">
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
      nzOkText="Aprovar e cadastrar">
      <ng-container *nzModalContent>
        <p>Confirma a aprovação deste lead? O cliente será cadastrado automaticamente na plataforma.</p>

        <div style="margin:16px 0">
          <div style="margin-bottom:8px;font-size:13px;color:#555;font-weight:600">Tipo de cliente</div>
          <nz-radio-group [(ngModel)]="tipoClienteFisica">
            <label nz-radio [nzValue]="0" style="display:block;margin-bottom:8px">Online</label>
            <label nz-radio [nzValue]="1">Física</label>
          </nz-radio-group>
        </div>

        <div *ngIf="isAbertura || !leadTemCnpjValido" style="margin-bottom:16px">
          <div style="margin-bottom:4px;font-size:13px;color:#555;font-weight:600">CNPJ da empresa</div>
          <input nz-input [(ngModel)]="cnpjAprovacao" placeholder="00.000.000/0000-00" maxlength="18" />
          <div style="font-size:12px;color:#888;margin-top:4px">
            Em abertura de empresa o CNPJ é informado pelo analista no momento da aprovação.
          </div>
        </div>
        <div *ngIf="!isAbertura && leadTemCnpjValido" style="margin-bottom:16px;font-size:13px;color:#555">
          CNPJ: <strong>{{ formatCnpj(lead!.cnpj) }}</strong>
        </div>

        <div style="margin-bottom:4px;font-size:13px;color:#555">Observação (opcional)</div>
        <textarea nz-input [(ngModel)]="obsAprovacao" rows="2" placeholder="Observação para o cliente..."></textarea>
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
    .lead-dados-card { border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,.06) }
    .lead-dados-topo { margin-bottom:16px }
    .lead-dados-kicker { font-size:12px; color:#888; text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px }
    .lead-dados-titulo { margin:0 0 8px; font-size:22px; font-weight:700; color:#1a1a1a }
    .lead-dados-tags { display:flex; align-items:center; gap:8px; flex-wrap:wrap }
    .lead-id { font-size:12px; color:#999 }
    .lead-descriptions { margin-top:4px }
    .desc-atividade { white-space:pre-wrap; line-height:1.5 }
    .obs-analista { color:#d48806; white-space:pre-wrap }
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
    .etapas-card { border:1px solid #f0f0f0 !important; box-shadow:none }
    .etapas-card.etapas-card-abertura { border:1px solid #ffe58f !important; box-shadow:0 4px 14px rgba(250,173,20,.18) }
    .etapas-card-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; flex-wrap:wrap }
    .etapas-card-title { font-size:16px; font-weight:700; color:#d48806 }
    .etapas-aviso { background:#fffbe6; border:1px solid #ffe58f; color:#ad6800; padding:8px 12px; border-radius:8px; font-size:13px; margin-bottom:12px }
    .etapa-destaque { background:#fffbe6; border-radius:8px; padding:12px 10px !important; border:1px solid #ffe58f !important; margin-bottom:8px }
    .etapa-bloqueada { opacity:.55 }
    .contrato-admin-box { margin-top:8px; padding:8px 10px; background:#f6ffed; border:1px solid #b7eb8f; border-radius:6px; font-size:12px; }
    .contrato-admin-info { margin-bottom:4px; display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
    .contrato-admin-upload { margin-top:4px; }
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
  tipoClienteFisica: 0 | 1 = 0;
  cnpjAprovacao = '';

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
  enviandoMinuta = false;
  enviandoMinutaJucesp = false;

  get minutaContrato(): DocumentoDto | undefined {
    return this.lead?.documentos.find(d => d.tipo === 'contrato_social_minuta');
  }

  get contratoAssinado(): DocumentoDto | undefined {
    return this.lead?.documentos.find(d => d.tipo === 'contrato_social_assinado');
  }

  get minutaJucesp(): DocumentoDto | undefined {
    return this.lead?.documentos.find(d => d.tipo === 'jucesp_minuta');
  }

  get jucespAssinado(): DocumentoDto | undefined {
    return this.lead?.documentos.find(d => d.tipo === 'jucesp_assinado');
  }

  get etapasOrdenadas(): EtapaDto[] {
    return ordenarEtapas(this.lead?.etapas ?? [], this.lead?.tipo);
  }

  get isMudanca(): boolean {
    return (this.lead?.tipo ?? 'mudanca').toLowerCase() !== 'abertura';
  }

  get isAbertura(): boolean {
    return !this.isMudanca;
  }

  readonly descricoesColunas = { xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 };

  exibir(valor: string | null | undefined): string {
    return valor?.trim() ? valor.trim() : '—';
  }

  formatCnpj(cnpj: string | null | undefined): string {
    const d = (cnpj ?? '').replace(/\D/g, '');
    if (d.length !== 14) return this.exibir(cnpj);
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  get pagamentoConcluido(): boolean {
    const pag = this.etapasOrdenadas.find(e => this.isEtapaPagamento(e.chave));
    return pag?.status === 'concluido';
  }

  isEtapaPagamento(chave: string): boolean {
    return chave === 'pagamentos_taxas' || chave === 'pagamento_mensalidade';
  }

  etapaBloqueada(etapa: EtapaDto): boolean {
    if (this.isMudanca) return false;
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

  onMinutaSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';
    if (!arquivo || !this.lead) return;

    if (!/\.pdf$/i.test(arquivo.name) && arquivo.type !== 'application/pdf') {
      this.msg.warning('A minuta deve ser um arquivo PDF.');
      return;
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      this.msg.warning('O arquivo excede 10 MB.');
      return;
    }

    this.enviandoMinuta = true;
    const fd = new FormData();
    fd.append('arquivo', arquivo, arquivo.name);

    this.http.post(`${this.api}/Integracao/Admin/Lead/${this.lead.id}/ContratoMinuta`, fd, { headers: this.headers(true) })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.enviandoMinuta = false;
        if (res) {
          this.msg.success('Minuta enviada. Etapa marcada como em processo.');
          this.recarregar();
        } else {
          this.msg.error('Erro ao enviar minuta.');
        }
        this.cd.markForCheck();
      });
  }

  onMinutaJucespSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';
    if (!arquivo || !this.lead) return;

    if (!/\.pdf$/i.test(arquivo.name) && arquivo.type !== 'application/pdf') {
      this.msg.warning('A minuta deve ser um arquivo PDF.');
      return;
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      this.msg.warning('O arquivo excede 10 MB.');
      return;
    }

    this.enviandoMinutaJucesp = true;
    const fd = new FormData();
    fd.append('arquivo', arquivo, arquivo.name);

    this.http.post(`${this.api}/Integracao/Admin/Lead/${this.lead.id}/JucespMinuta`, fd, { headers: this.headers(true) })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.enviandoMinutaJucesp = false;
        if (res) {
          this.msg.success('Minuta Jucesp enviada. Etapa marcada como em processo.');
          this.recarregar();
        } else {
          this.msg.error('Erro ao enviar minuta Jucesp.');
        }
        this.cd.markForCheck();
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

  get leadTemCnpjValido(): boolean {
    const d = (this.lead?.cnpj ?? '').replace(/\D/g, '');
    return d.length === 14;
  }

  abrirAprovarLead(): void {
    this.obsAprovacao = '';
    this.tipoClienteFisica = 0;
    this.cnpjAprovacao = this.lead?.cnpj?.trim() ? this.formatCnpj(this.lead.cnpj) : '';
    this.modalAprovarLead = true;
    this.cd.markForCheck();
  }

  confirmarAprovarLead(): void {
    const cnpjDigits = this.cnpjParaCadastro();
    if (cnpjDigits.length !== 14) {
      this.msg.warning(this.isAbertura
        ? 'Informe o CNPJ da empresa (14 dígitos) para aprovar.'
        : 'CNPJ inválido. Verifique os dados do lead.');
      return;
    }
    if (this.tipoClienteFisica !== 0 && this.tipoClienteFisica !== 1) {
      this.msg.warning('Selecione o tipo de cliente: Online ou Física.');
      return;
    }

    this.salvando = true;
    const body: { observacao: string; fisica: number; cnpj?: string } = {
      observacao: this.obsAprovacao,
      fisica: this.tipoClienteFisica,
    };
    if (this.isAbertura || !this.leadTemCnpjValido)
      body.cnpj = cnpjDigits;

    this.http.post<{ mensagem?: string; dados?: { processando?: boolean; usuarioAtualizado?: boolean } }>(
      `${this.api}/Integracao/Admin/Lead/${this.lead!.id}/Aprovar`,
      body,
      { headers: this.headers() }
    ).pipe(catchError(err => {
      this.msg.error(this.extrairErroApi(err));
      return of(null);
    })).subscribe(res => {
      this.salvando = false;
      if (res) {
        this.modalAprovarLead = false;
        if (res.dados?.processando) {
          this.msg.info('Aprovação iniciada. Aguarde a notificação de conclusão.');
        } else if (res.dados?.usuarioAtualizado === false) {
          this.msg.warning('Lead aprovado, mas o usuário de login não foi atualizado. Verifique AspNetUsers.');
        } else {
          this.msg.success('Lead aprovado, cliente cadastrado e usuário liberado!');
        }
        this.recarregar();
      }
      this.cd.markForCheck();
    });
  }

  private cnpjParaCadastro(): string {
    if (this.isAbertura || !this.leadTemCnpjValido)
      return this.cnpjAprovacao.replace(/\D/g, '');
    return (this.lead?.cnpj ?? '').replace(/\D/g, '');
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
      pendente_docs: 'Aguardando Documentos',
      em_analise: 'Em Análise',
      processando_aprovacao: 'Processando cadastro',
      aprovado: 'Aprovado',
      recusado: 'Recusado',
    };
    return map[s] ?? s;
  }

  statusColor(s: string): string {
    const map: Record<string, string> = {
      pendente_docs: 'orange',
      em_analise: 'processing',
      processando_aprovacao: 'processing',
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

  private extrairErroApi(err: unknown): string {
    const e = err as { error?: { mensagem?: string; Mensagem?: string }; message?: string };
    return e?.error?.mensagem || e?.error?.Mensagem || e?.message || 'Erro ao aprovar lead.';
  }

  private recarregar(): void { this.carregar(this.lead!.id); }

  private headers(multipart = false): HttpHeaders {
    const token = this.loginService.obterToken() ?? '';
    return multipart
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
