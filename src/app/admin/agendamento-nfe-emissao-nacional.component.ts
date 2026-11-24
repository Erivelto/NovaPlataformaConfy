import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, of, timeout } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { PageTitleComponent } from '../page-title.component';
import { environment } from '../../environments/environment';
import { LC116_SERVICOS, lc116RotuloCompleto } from './lc116-servicos';
import { NBS_SERVICOS, nbsRotuloCompleto, type NbsServico } from './nbs-servicos';
import { codigosNbsPermitidosParaLc116, codigoNbsPermitidoParaLc116 } from './lc116-nbs-opcoes';
import {
  CTRIBMUN_OMITIR,
  ctribMunDosUltimosTresDigitos,
  opcoesCTribMunPorLc116Nacional
} from './lc116-ctribmun-opcoes';
import { descricaoNbsReforma, nbsRotuloReformaCompleto } from './nbs-reforma-catalogo';

/** Padrão atual: emissão somente com cTribNac (LC116), sem cTribMun na DPS. */
const ENVIAR_CTRIBMUN_NA_DPS = false;
/** IM na DPS só quando o CNC do município exige (evita SEFIN E0120 em SP sem cadastro complementar). */
const ENVIAR_IM_PRESTADOR_NA_DPS = false;

interface NfseWizard {
  etapaAtual: number;
  preencherInfoIbsCbs: boolean;
  dataCompetencia: string;
  informarSerieNumeroDps: boolean;
  serieDps: string;
  numeroDps: string;
  tipoEmitente: number;
  tomadorLocalDomicilio: number;
  intermediarioLocalDomicilio: number;
  destinatarioEhAdquirente: boolean | null;
  ehCompraGovernamental: boolean | null;
  codigoServicoNbs: string;
  codigoLc116: string;
  /** cTribMun — 3 dígitos exigidos por vários municípios (ex. São Paulo). */
  codigoTributacaoMunicipal: string;
  /** Inscrição municipal do prestador (IM na DPS — CNC/SP). */
  inscricaoMunicipal: string;
  descricaoServico: string;
  valorServico: number;
  aliquotaIss: number;
}

interface FormularioEmissao {
  codigoCorpoEmissaoNota: number;
  statusAgendamento: string;
  wizard: NfseWizard;
  prestador?: { codigoPessoa: number; documento: string; razao: string; nomeFantasia: string; inscricaoMunicipal: string; codigoIbgeMunicipio: string };
  tomador?: {
    codigo: number;
    documento: string;
    razao: string;
    email: string;
    logradouro: string;
    numeroLogradouro: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  tpAmb: number;
  ambienteLabel: string;
}

@Component({
  selector: 'app-agendamento-nfe-emissao-nacional',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzCardModule, NzButtonModule, NzIconModule, NzStepsModule,
    NzFormModule, NzInputModule, NzRadioModule, NzCheckboxModule,
    NzDatePickerModule, NzSelectModule, NzAlertModule, NzSkeletonModule,
    NzDividerModule, NzGridModule, NzMessageModule, PageTitleComponent
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <app-page-title
          title="Emissão NFS-e nacional"
          [subtitle]="'Agendamento #' + codigo + (statusLista ? ' · ' + statusLista : '')">
        </app-page-title>
        <button nz-button (click)="voltarDetalhe()">
          <i nz-icon nzType="arrow-left"></i> Voltar
        </button>
      </div>

      <nz-skeleton *ngIf="loading" [nzActive]="true" [nzParagraph]="{ rows: 10 }"></nz-skeleton>

      <ng-container *ngIf="!loading && wizard">
        <nz-alert
          *ngIf="form?.tpAmb === 1"
          nzType="error"
          nzShowIcon
          nzMessage="Ambiente de PRODUÇÃO"
          nzDescription="A NFS-e emitida terá efeito fiscal. Cancele no portal municipal/nacional se for apenas teste."
          style="margin-bottom: 16px">
        </nz-alert>
        <nz-alert
          nzType="info"
          nzShowIcon
          nzMessage="Assistente de emissão"
          [nzDescription]="'Ambiente: ' + (form?.ambienteLabel || '—') + ' (tpAmb ' + (form?.tpAmb ?? '—') + '). Preencha os passos como no portal nacional.'"
          style="margin-bottom: 16px">
        </nz-alert>

        <nz-steps [nzCurrent]="step" nzSize="small" class="wizard-steps">
          <nz-step nzTitle="Pessoas"></nz-step>
          <nz-step nzTitle="Serviço"></nz-step>
          <nz-step nzTitle="Valores"></nz-step>
          <nz-step nzTitle="Emitir NFS-e"></nz-step>
        </nz-steps>

        <!-- Passo 0: Pessoas -->
        <nz-card *ngIf="step === 0" nzTitle="Informações gerais">
          <div nz-row [nzGutter]="[16, 12]">
            <div nz-col [nzSpan]="24">
              <label class="lbl">Preencher informações IBS/CBS?</label>
              <nz-radio-group [(ngModel)]="wizard.preencherInfoIbsCbs">
                <label nz-radio [nzValue]="true">Sim</label>
                <label nz-radio [nzValue]="false">Não</label>
              </nz-radio-group>
            </div>
            <div nz-col [nzSpan]="8" [nzXs]="24">
              <nz-form-item>
                <nz-form-label nzRequired>Data de competência</nz-form-label>
                <nz-form-control>
                  <input nz-input type="date" [(ngModel)]="wizard.dataCompetencia" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="24">
              <label nz-checkbox [(ngModel)]="wizard.informarSerieNumeroDps">Informar série e número da DPS</label>
            </div>
            <ng-container *ngIf="wizard.informarSerieNumeroDps">
              <div nz-col [nzSpan]="8" [nzXs]="24">
                <nz-form-item>
                  <nz-form-label nzRequired>Série DPS</nz-form-label>
                  <nz-form-control><input nz-input [(ngModel)]="wizard.serieDps" maxlength="5" /></nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="8" [nzXs]="24">
                <nz-form-item>
                  <nz-form-label nzRequired>Número DPS</nz-form-label>
                  <nz-form-control><input nz-input [(ngModel)]="wizard.numeroDps" maxlength="15" /></nz-form-control>
                </nz-form-item>
              </div>
            </ng-container>
          </div>
        </nz-card>

        <nz-card *ngIf="step === 0" nzTitle="Emitente da NFS-e" class="sec">
          <div nz-row [nzGutter]="[16, 8]">
            <div nz-col [nzSpan]="24">
              <label class="lbl">Você irá emitir esta NFS-e como?</label>
              <nz-radio-group [(ngModel)]="wizard.tipoEmitente">
                <label nz-radio [nzValue]="1">Prestador/Fornecedor</label>
                <label nz-radio [nzValue]="2" nzDisabled>Tomador/Adquirente</label>
                <label nz-radio [nzValue]="3" nzDisabled>Intermediário</label>
              </nz-radio-group>
            </div>
            <div nz-col [nzSpan]="8" [nzXs]="24"><label class="lbl">CNPJ</label><div class="ro">{{ form?.prestador?.documento || '—' }}</div></div>
            <div nz-col [nzSpan]="16" [nzXs]="24"><label class="lbl">Razão social</label><div class="ro">{{ form?.prestador?.razao || '—' }}</div></div>
            <div nz-col [nzSpan]="8" [nzXs]="24">
              <label class="lbl">IBGE município emissor (cLocEmi)</label>
              <div class="ro mono-tag">{{ ibgePrestadorResumo }}</div>
            </div>
            <div nz-col [nzSpan]="24" *ngIf="ibgePrestadorInvalido">
              <nz-alert nzType="error" nzShowIcon
                nzMessage="Município emissor (IBGE) inválido ou ausente"
                nzDescription="Informe o código IBGE de 7 dígitos do município do MEI/empresa conforme o cadastro nacional do CNPJ (evita SEFIN E0041).">
              </nz-alert>
              <a *ngIf="form?.prestador?.codigoPessoa" nz-button nzType="link" [routerLink]="linkEditarCliente" style="padding-left:0;margin-top:4px">
                Abrir cadastro do cliente e salvar IBGE
              </a>
            </div>
            <div nz-col [nzSpan]="24" *ngIf="enviarImPrestadorNaDps">
              <nz-form-item>
                <nz-form-label [nzRequired]="form?.tpAmb === 1">Inscrição municipal (IM)</nz-form-label>
                <nz-form-control>
                  <input
                    nz-input
                    [(ngModel)]="wizard.inscricaoMunicipal"
                    maxlength="15"
                    inputmode="numeric"
                    placeholder="Número da CCM / IM na Prefeitura de São Paulo"
                    style="max-width: 320px" />
                  <div class="hint-im">
                    Enviada na DPS quando habilitado. Cadastro do cliente: <strong>{{ imCadastroResumo }}</strong>.
                  </div>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="24" *ngIf="!enviarImPrestadorNaDps">
              <nz-alert nzType="info" nzShowIcon
                nzMessage="IM do prestador não será enviada na DPS"
                [nzDescription]="'IM no cadastro: ' + imCadastroResumo + ' (mantida só internamente; evita E0120 quando o CNC não tem complemento).'">
              </nz-alert>
            </div>
          </div>
        </nz-card>

        <nz-card *ngIf="step === 0" nzTitle="Tomador / Adquirente do serviço" class="sec">
          <div nz-row [nzGutter]="[16, 12]">
            <div nz-col [nzSpan]="24">
              <label class="lbl">Onde está localizado o estabelecimento/domicílio?</label>
              <nz-radio-group [(ngModel)]="wizard.tomadorLocalDomicilio">
                <label nz-radio [nzValue]="1">Brasil</label>
                <label nz-radio [nzValue]="2">Exterior</label>
                <label nz-radio [nzValue]="0">Tomador não informado</label>
              </nz-radio-group>
            </div>
            <div nz-col [nzSpan]="8" [nzXs]="24"><label class="lbl">CPF/CNPJ</label><div class="ro">{{ form?.tomador?.documento || '—' }}</div></div>
            <div nz-col [nzSpan]="16" [nzXs]="24"><label class="lbl">Nome / Razão social</label><div class="ro">{{ form?.tomador?.razao || '—' }}</div></div>
            <div nz-col [nzSpan]="24">
              <label class="lbl">Endereço (vai na DPS / DANFSe)</label>
              <div class="ro">{{ enderecoTomadorResumo }}</div>
              <div class="hint-im" *ngIf="tomadorEnderecoIncompleto">Para tomador CNPJ, complete logradouro e CEP no agendamento (obrigatório no sistema nacional).</div>
            </div>
            <div nz-col [nzSpan]="8" [nzXs]="24"><label class="lbl">E-mail</label><div class="ro">{{ form?.tomador?.email || '—' }}</div></div>
          </div>
        </nz-card>

        <nz-card *ngIf="step === 0" nzTitle="Destinatário / Intermediário" class="sec">
          <div nz-row [nzGutter]="[16, 12]">
            <div nz-col [nzSpan]="24">
              <label class="lbl">Destinatário é o próprio adquirente (IBS/CBS)?</label>
              <nz-radio-group [(ngModel)]="destinatarioSim">
                <label nz-radio [nzValue]="true">Sim</label>
                <label nz-radio [nzValue]="false">Não</label>
              </nz-radio-group>
            </div>
            <div nz-col [nzSpan]="24">
              <label class="lbl">Intermediário — localização</label>
              <nz-radio-group [(ngModel)]="wizard.intermediarioLocalDomicilio">
                <label nz-radio [nzValue]="1">Brasil</label>
                <label nz-radio [nzValue]="2">Exterior</label>
                <label nz-radio [nzValue]="0">Intermediário não informado</label>
              </nz-radio-group>
            </div>
            <div nz-col [nzSpan]="24">
              <label class="lbl">Compra governamental?</label>
              <nz-radio-group [(ngModel)]="compraGovSim">
                <label nz-radio [nzValue]="true">Sim</label>
                <label nz-radio [nzValue]="false">Não</label>
              </nz-radio-group>
            </div>
          </div>
        </nz-card>

        <!-- Passo 1: Serviço -->
        <nz-card *ngIf="step === 1" nzTitle="Serviço / NBS">
          <div nz-row [nzGutter]="[16, 12]">
            <div nz-col [nzSpan]="24" [nzXs]="24">
              <nz-form-item>
                <nz-form-label nzRequired>LC116 — tributação nacional</nz-form-label>
                <nz-form-control nzExtra="cTribNac: 6 dígitos (lista nacional LC 116 / desdobro).">
                  <nz-select
                    class="lc116-select"
                    [(ngModel)]="lc116CodigoSelecionado"
                    [nzOptions]="lc116NzOptions"
                    [compareWith]="compararCodigoLista"
                    nzShowSearch
                    nzAllowClear
                    nzPlaceHolder="Ex.: digite 010601 ou 'Assessoria'..."
                    (ngModelChange)="onLc116Select($event)">
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="24" [nzXs]="24" *ngIf="enviarCTribMunNaDps">
              <nz-form-item>
                <nz-form-label nzRequired>Código tributação municipal (cTribMun)</nz-form-label>
                <nz-form-control [nzExtra]="cTribMunExtraCompleto">
                  <nz-select
                    class="ctribmun-select"
                    [(ngModel)]="cTribMunSelecionado"
                    [nzOptions]="cTribMunNzOptions"
                    [compareWith]="compararCodigoOuOmitir"
                    nzShowSearch
                    nzAllowClear
                    [nzDisabled]="!lc116CodigoSelecionado"
                    [nzPlaceHolder]="cTribMunPlaceholder"
                    (ngModelChange)="onCTribMunSelect($event)">
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="24" *ngIf="!enviarCTribMunNaDps">
              <nz-alert nzType="info" nzShowIcon
                nzMessage="Complemento municipal (cTribMun) não será enviado"
                nzDescription="Configuração atual: a DPS leva apenas o LC116 (cTribNac, 6 dígitos), como na emissão manual.">
              </nz-alert>
            </div>
            <div nz-col [nzSpan]="24" [nzXs]="24">
              <nz-form-item>
                <nz-form-label>Código NBS / serviço nacional (opcional)</nz-form-label>
                <nz-form-control [nzExtra]="nbsAjudaExtra">
                  <nz-select
                    class="nbs-select"
                    [(ngModel)]="nbsCodigoSelecionado"
                    [nzOptions]="nbsNzOptions"
                    [compareWith]="compararCodigoLista"
                    nzShowSearch
                    nzAllowClear
                    [nzPlaceHolder]="nbsPlaceholder"
                    (ngModelChange)="onNbsSelect($event)">
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="24">
              <nz-form-item>
                <nz-form-label nzRequired>Descrição do serviço</nz-form-label>
                <nz-form-control>
                  <textarea nz-input rows="4" [(ngModel)]="wizard.descricaoServico"></textarea>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
        </nz-card>

        <!-- Passo 2: Valores -->
        <nz-card *ngIf="step === 2" nzTitle="Valores">
          <div nz-row [nzGutter]="[16, 12]">
            <div nz-col [nzSpan]="8" [nzXs]="24">
              <nz-form-item>
                <nz-form-label nzRequired>Valor do serviço (R$)</nz-form-label>
                <nz-form-control>
                  <input nz-input type="number" step="0.01" min="0" [(ngModel)]="wizard.valorServico" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="8" [nzXs]="24">
              <nz-form-item>
                <nz-form-label>Alíquota ISS (%)</nz-form-label>
                <nz-form-control>
                  <input nz-input type="number" step="0.01" min="0" [(ngModel)]="wizard.aliquotaIss" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="8" [nzXs]="24">
              <label class="lbl">ISS calculado</label>
              <div class="ro">R$ {{ issCalculado | number:'1.2-2' }}</div>
            </div>
          </div>
        </nz-card>

        <!-- Passo 3: Emitir -->
        <nz-card *ngIf="step === 3" nzTitle="Revisão e emissão">
          <dl class="resumo">
            <dt>Competência</dt><dd>{{ wizard.dataCompetencia || '—' }}</dd>
            <dt>Prestador</dt><dd>{{ form?.prestador?.razao }} ({{ form?.prestador?.documento }})</dd>
            <dt>IBGE emissor</dt><dd>{{ ibgePrestadorResumo }}</dd>
            <dt>IM</dt><dd>{{ imWizardResumo }}</dd>
            <dt>Tomador</dt><dd>{{ form?.tomador?.razao }} ({{ form?.tomador?.documento }})</dd>
            <dt>Endereço tomador</dt><dd>{{ enderecoTomadorResumo }}</dd>
            <dt>LC116 (cTribNac)</dt><dd>{{ rotuloLc116Resumo }}<span *ngIf="wizard.codigoLc116" class="mono-tag"> · {{ wizard.codigoLc116 }}</span></dd>
            <dt>cTribMun (3 díg.)</dt><dd>{{ enviarCTribMunNaDps ? codigoTribMunResumo : 'Não enviar (padrão)' }}</dd>
            <dt>NBS</dt><dd>{{ rotuloNbsResumo }}</dd>
            <dt>Valor</dt><dd>R$ {{ wizard.valorServico | number:'1.2-2' }} · ISS {{ wizard.aliquotaIss }}% = R$ {{ issCalculado | number:'1.2-2' }}</dd>
            <dt>Descrição</dt><dd class="desc">{{ wizard.descricaoServico || '—' }}</dd>
          </dl>
          <nz-alert nzType="warning" nzShowIcon nzMessage="Ao confirmar, a DPS será assinada e enviada à SEFIN." style="margin-top: 12px"></nz-alert>
        </nz-card>

        <div class="comandos">
          <button nz-button (click)="voltarPasso()" [disabled]="step === 0 || salvando || emitindo">
            Voltar
          </button>
          <button
            *ngIf="step < 3"
            nz-button
            nzType="primary"
            (click)="avancarPasso()"
            [nzLoading]="salvando">
            Avançar
          </button>
          <button
            *ngIf="step === 3"
            nz-button
            nzType="primary"
            class="btn-emitir"
            (click)="confirmarEmissao()"
            [nzLoading]="emitindo">
            <i nz-icon nzType="thunderbolt"></i> Emitir NFS-e
          </button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding: 8px 0; max-width: 960px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    .wizard-steps { margin: 16px 0 20px; }
    .sec { margin-top: 12px; }
    .lbl { display: block; color: rgba(0,0,0,.55); font-size: .85rem; margin-bottom: 4px; }
    .ro { font-weight: 500; margin-bottom: 8px; }
    .comandos { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
    .btn-emitir { background: #722ed1; border-color: #722ed1; }
    .resumo { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; margin: 0; }
    .resumo dt { color: rgba(0,0,0,.55); margin: 0; }
    .resumo dd { margin: 0; font-weight: 500; }
    .resumo .desc { font-weight: 400; white-space: pre-wrap; }
    .resumo .hint-resumo { font-weight: 400; font-size: 12px; color: rgba(0,0,0,.45); }
    .resumo .mono-tag { font-weight: 400; font-family: ui-monospace, monospace; font-size: 12px; color: rgba(0,0,0,.65); }
    .hint-im { font-size: 12px; color: rgba(0,0,0,.55); margin-top: 6px; line-height: 1.45; max-width: 640px; }
    :host ::ng-deep .lc116-select.ant-select, :host ::ng-deep .nbs-select.ant-select, :host ::ng-deep .ctribmun-select.ant-select { width: 100%; max-width: 100%; }
    :host ::ng-deep .lc116-select .ant-select-selector, :host ::ng-deep .nbs-select .ant-select-selector, :host ::ng-deep .ctribmun-select .ant-select-selector { min-height: 40px; }
  `]
})
export class AgendamentoNfeEmissaoNacionalComponent implements OnInit {
  readonly enviarCTribMunNaDps = ENVIAR_CTRIBMUN_NA_DPS;
  readonly enviarImPrestadorNaDps = ENVIAR_IM_PRESTADOR_NA_DPS;
  private readonly api = environment.apiUrl;

  loading = true;
  salvando = false;
  emitindo = false;
  codigo = 0;
  statusLista = '';
  step = 0;
  form: FormularioEmissao | null = null;
  wizard: NfseWizard | null = null;
  /** Valor do nz-select LC116 (código 6 dígitos). */
  lc116CodigoSelecionado: string | null = null;
  /** cTribMun (3 dígitos) ou {@link CTRIBMUN_OMITIR}. */
  cTribMunSelecionado: string | null = null;
  readonly lc116Lista = LC116_SERVICOS;
  readonly lc116NzOptions = LC116_SERVICOS.map(o => ({
    value: o.codigo,
    label: `${o.codigo} — ${o.descricao}`
  }));

  compararCodigoLista = (a: string | null | undefined, b: string | null | undefined): boolean =>
    String(a ?? '') === String(b ?? '');

  compararCodigoOuOmitir = (a: string | null | undefined, b: string | null | undefined): boolean =>
    String(a ?? '') === String(b ?? '');

  get cTribMunNzOptions(): { value: string; label: string }[] {
    const lc = this.lc116CodigoSelecionado;
    if (!lc) return [];
    const base = opcoesCTribMunPorLc116Nacional(lc).map(o => ({ value: o.value, label: o.label }));
    return [
      ...base,
      { value: CTRIBMUN_OMITIR, label: 'Sem complemento municipal (não enviar cTribMun no XML)' }
    ];
  }

  get cTribMunPlaceholder(): string {
    if (!this.lc116CodigoSelecionado) return 'Selecione primeiro o LC116 nacional';
    if (this.cTribMunNzOptions.length <= 1) return 'Nenhum desdobro listado para este LC116';
    return 'Selecione o código complementar municipal (3 dígitos)';
  }

  get cTribMunExtraCompleto(): string {
    return 'Na DPS: LC116 vira cTribNac (6 dígitos, ex. 170201); esta lista envia só cTribMun (3 dígitos, ex. 201). ' + this.cTribMunAjudaExtra;
  }

  get cTribMunAjudaExtra(): string {
    const lc = this.lc116CodigoSelecionado;
    if (!lc) {
      return 'O complemento depende do LC116 nacional (cTribNac, 6 dígitos). Cada prefeitura pode ou não exigir os 3 dígitos — use “Sem complemento” quando o emissor nacional não habilitar o campo.';
    }
    const sugestao = ctribMunDosUltimosTresDigitos(lc);
    return `Desdobros sugeridos a partir do item LC116 ${lc.slice(0, 2)}.${lc.slice(2, 4)} (últimos 3 dígitos do cTribNac). Para o código ${lc}, sugestão: ${sugestao || '—'}. Confira no emissor nacional da sua cidade se o complemento é obrigatório.`;
  }

  /** Valor do nz-select NBS (código da lista). */
  nbsCodigoSelecionado: string | null = null;
  readonly nbsLista = NBS_SERVICOS;

  /** Itens NBS exibidos conforme LC116 (lista completa se não houver mapa na planilha). */
  get nbsNzOptions(): { value: string; label: string }[] {
    return this.nbsOpcoesVisiveis.map(o => ({
      value: o.codigo,
      label: `${o.codigo} — ${o.descricao}`
    }));
  }

  get nbsOpcoesVisiveis(): NbsServico[] {
    const lc = this.apenasDigitos(this.wizard?.codigoLc116 ?? this.lc116CodigoSelecionado ?? '').slice(0, 6);
    const permitidos = lc.length === 6 ? codigosNbsPermitidosParaLc116(lc) : null;
    if (permitidos == null) return this.nbsLista;
    if (permitidos.length === 0) return [];
    return permitidos.map((codigo) => ({
      codigo,
      descricao: descricaoNbsReforma(codigo) || '—'
    }));
  }

  get nbsAjudaExtra(): string {
    const lc = this.apenasDigitos(this.wizard?.codigoLc116 ?? '').slice(0, 6);
    const permitidos = lc.length === 6 ? codigosNbsPermitidosParaLc116(lc) : null;
    if (permitidos?.length) {
      return `Somente NBS da tabela da reforma compatíveis com LC116 ${lc} (${permitidos.length} opção(ões)).`;
    }
    return 'Pesquise pelo código ou pela descrição. Com mapa LC116×NBS (CSV), escolha o LC116 para filtrar os NBS.';
  }

  get nbsPlaceholder(): string {
    const lc = this.apenasDigitos(this.wizard?.codigoLc116 ?? '').slice(0, 6);
    const permitidos = lc.length === 6 ? codigosNbsPermitidosParaLc116(lc) : null;
    if (lc.length !== 6) return 'Primeiro selecione o LC116…';
    if (permitidos && !permitidos.length) return 'Nenhum NBS mapeado para este LC116.';
    return 'Ex.: digite o código ou parte da descrição…';
  }

  get imCadastroResumo(): string {
    const d = this.apenasDigitos(this.form?.prestador?.inscricaoMunicipal ?? '');
    if (!d || /^0+$/.test(d)) return 'não informada ou 00000';
    return d;
  }

  get imWizardResumo(): string {
    const d = this.apenasDigitos(this.wizard?.inscricaoMunicipal ?? '');
    return d || '—';
  }

  get ibgePrestadorResumo(): string {
    const d = this.apenasDigitos(this.form?.prestador?.codigoIbgeMunicipio ?? '');
    return d.length === 7 ? d : '— (não cadastrado)';
  }

  get ibgePrestadorInvalido(): boolean {
    return this.apenasDigitos(this.form?.prestador?.codigoIbgeMunicipio ?? '').length !== 7;
  }

  get linkEditarCliente(): (string | number)[] {
    const id = this.form?.prestador?.codigoPessoa;
    return id ? ['/administrativo/cliente', id, 'editar'] : ['/administrativo/clientes'];
  }

  get enderecoTomadorResumo(): string {
    const t = this.form?.tomador;
    if (!t) return '—';
    const partes: string[] = [];
    const log = [t.logradouro, t.numeroLogradouro].filter(v => !!(v || '').trim()).join(', ');
    if (log) partes.push(log);
    if (t.complemento?.trim()) partes.push(t.complemento.trim());
    if (t.bairro?.trim()) partes.push(t.bairro.trim());
    const mun = [t.cidade, t.uf].filter(v => !!(v || '').trim()).join('/');
    if (mun) partes.push(mun);
    if (t.cep?.trim()) partes.push(`CEP ${t.cep.trim()}`);
    return partes.length ? partes.join(' · ') : '—';
  }

  get tomadorEnderecoIncompleto(): boolean {
    const doc = this.apenasDigitos(this.form?.tomador?.documento ?? '');
    const cep = this.apenasDigitos(this.form?.tomador?.cep ?? '');
    const log = (this.form?.tomador?.logradouro ?? '').trim();
    return doc.length === 14 && (cep.length !== 8 || !log);
  }

  get destinatarioSim(): boolean {
    return this.wizard?.destinatarioEhAdquirente !== false;
  }
  set destinatarioSim(v: boolean) {
    if (this.wizard) this.wizard.destinatarioEhAdquirente = v;
  }

  get compraGovSim(): boolean {
    return this.wizard?.ehCompraGovernamental === true;
  }
  set compraGovSim(v: boolean) {
    if (this.wizard) this.wizard.ehCompraGovernamental = v;
  }

  get rotuloLc116Resumo(): string {
    if (!this.wizard?.codigoLc116) return '—';
    return lc116RotuloCompleto(this.wizard.codigoLc116) || this.wizard.codigoLc116;
  }

  get codigoTribMunResumo(): string {
    if (this.cTribMunSelecionado === CTRIBMUN_OMITIR) return 'Não enviar (sem complemento)';
    const d = this.apenasDigitos(this.wizard?.codigoTributacaoMunicipal ?? '');
    return d.length === 3 ? d : '—';
  }

  get rotuloNbsResumo(): string {
    if (!this.wizard?.codigoServicoNbs) return '—';
    const d = this.apenasDigitos(this.wizard.codigoServicoNbs);
    if (descricaoNbsReforma(d)) return nbsRotuloReformaCompleto(d);
    return nbsRotuloCompleto(this.wizard.codigoServicoNbs) || d;
  }

  get issCalculado(): number {
    if (!this.wizard) return 0;
    const v = Number(this.wizard.valorServico) || 0;
    const a = Number(this.wizard.aliquotaIss) || 0;
    return Math.round(v * a) / 100;
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
    this.codigo = +this.route.snapshot.paramMap.get('codigo')!;
    this.statusLista = this.route.snapshot.queryParamMap.get('status') || '';
    if (!this.codigo) {
      this.message.error('Agendamento inválido.');
      this.voltarLista();
      return;
    }
    this.carregar();
  }

  voltarLista(): void {
    this.router.navigate(['/administrativo/agendamento-nfe']);
  }

  voltarDetalhe(): void {
    this.router.navigate(['/administrativo/agendamento-nfe/detalhe', this.codigo], {
      queryParams: { status: this.statusLista || undefined }
    });
  }

  carregar(): void {
    this.loading = true;
    this.http.get<unknown>(`${this.api}/NfseNacional/emissao/agendamento/${this.codigo}/formulario`, { headers: this.h })
      .pipe(timeout(30000), catchError(() => of(null)))
      .subscribe(raw => {
        if (!raw) {
          this.message.error('Não foi possível carregar o formulário de emissão.');
          this.loading = false;
          this.voltarDetalhe();
          return;
        }
        this.form = this.mapFormulario(raw);
        this.wizard = this.form.wizard;
        this.syncLc116SelectFromWizard();
        this.aplicarFiltroNbsAposLc116();
        this.syncCTribMunFromWizard();
        this.syncNbsSelectFromWizard();
        this.step = Math.min(Math.max(this.wizard.etapaAtual ?? 0, 0), 3);
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  onLc116Select(codigo: string | null): void {
    if (!this.wizard) return;
    const six = codigo ? this.apenasDigitos(codigo).slice(0, 6) : '';
    this.wizard.codigoLc116 = six;
    if (six !== codigo && (six.length === 6 || !codigo)) {
      this.lc116CodigoSelecionado = six.length === 6 ? six : null;
    }
    this.aplicarFiltroNbsAposLc116();
    this.aplicarPoliticaCTribMun();
    this.cdr.markForCheck();
  }

  onCTribMunSelect(valor: string | null): void {
    if (!this.wizard) return;
    if (!valor || valor === CTRIBMUN_OMITIR) {
      this.wizard.codigoTributacaoMunicipal = '';
      this.cTribMunSelecionado = valor === CTRIBMUN_OMITIR ? CTRIBMUN_OMITIR : null;
    } else {
      const d = this.apenasDigitos(valor).slice(-3).padStart(3, '0');
      this.wizard.codigoTributacaoMunicipal = d;
      this.cTribMunSelecionado = d;
      const lcAtual = this.lc116CodigoSelecionado || this.apenasDigitos(this.wizard.codigoLc116);
      if (lcAtual) {
        const hit = opcoesCTribMunPorLc116Nacional(lcAtual).find(o => o.value === d);
        const tribNac = this.apenasDigitos(hit?.codigoNacional ?? '').slice(0, 6);
        if (tribNac.length === 6 && tribNac !== this.apenasDigitos(this.wizard.codigoLc116).slice(0, 6)) {
          this.wizard.codigoLc116 = tribNac;
          this.lc116CodigoSelecionado = tribNac;
          this.aplicarFiltroNbsAposLc116();
        }
      }
    }
    this.cdr.markForCheck();
  }

  private aplicarPoliticaCTribMun(): void {
    if (!this.wizard) return;
    if (!this.enviarCTribMunNaDps) {
      this.wizard.codigoTributacaoMunicipal = '';
      this.cTribMunSelecionado = CTRIBMUN_OMITIR;
      return;
    }
    this.aplicarCTribMunSugerido();
  }

  private aplicarCTribMunSugerido(): void {
    if (!this.wizard || !this.lc116CodigoSelecionado) {
      this.cTribMunSelecionado = null;
      this.wizard && (this.wizard.codigoTributacaoMunicipal = '');
      return;
    }
    const atual = this.apenasDigitos(this.wizard.codigoTributacaoMunicipal);
    const opcoes = opcoesCTribMunPorLc116Nacional(this.lc116CodigoSelecionado);
    if (atual.length === 3 && opcoes.some(o => o.value === atual)) {
      this.cTribMunSelecionado = atual;
      return;
    }
    if (opcoes.length === 1) {
      this.cTribMunSelecionado = opcoes[0].value;
      this.wizard.codigoTributacaoMunicipal = opcoes[0].value;
      return;
    }
    this.cTribMunSelecionado = null;
    this.wizard.codigoTributacaoMunicipal = '';
  }

  private syncCTribMunFromWizard(): void {
    if (!this.wizard) return;
    if (!this.enviarCTribMunNaDps) {
      this.aplicarPoliticaCTribMun();
      return;
    }
    const d = this.apenasDigitos(this.wizard.codigoTributacaoMunicipal);
    const lc = this.apenasDigitos(this.wizard.codigoLc116).slice(0, 6);
    const opcoes = lc.length === 6 ? opcoesCTribMunPorLc116Nacional(lc) : [];
    if (d.length === 3) {
      const valido = opcoes.length === 0 || opcoes.some(o => o.value === d);
      if (valido) {
        this.cTribMunSelecionado = d;
        this.wizard.codigoTributacaoMunicipal = d;
        return;
      }
      this.wizard.codigoTributacaoMunicipal = '';
    }
    if (!this.apenasDigitos(this.wizard.codigoTributacaoMunicipal).length && this.lc116CodigoSelecionado) {
      this.aplicarPoliticaCTribMun();
      return;
    }
    this.aplicarPoliticaCTribMun();
  }

  onNbsSelect(codigo: string | null): void {
    if (!this.wizard) return;
    const d = codigo ? this.apenasDigitos(codigo) : '';
    this.wizard.codigoServicoNbs = d;
    this.cdr.markForCheck();
  }

  private syncLc116SelectFromWizard(): void {
    if (!this.wizard) return;
    const six = this.apenasDigitos(this.wizard.codigoLc116).slice(0, 6);
    this.lc116CodigoSelecionado = six.length === 6 ? six : null;
    if (six.length === 6) this.wizard.codigoLc116 = six;
  }

  private syncNbsSelectFromWizard(): void {
    if (!this.wizard) return;
    const d = this.apenasDigitos(this.wizard.codigoServicoNbs);
    if (!d) {
      this.nbsCodigoSelecionado = null;
      return;
    }
    const lc = this.apenasDigitos(this.wizard.codigoLc116).slice(0, 6);
    if (lc.length === 6 && !codigoNbsPermitidoParaLc116(lc, this.wizard.codigoServicoNbs)) {
      this.nbsCodigoSelecionado = null;
      return;
    }
    const permitidos = lc.length === 6 ? codigosNbsPermitidosParaLc116(lc) : null;
    if (permitidos?.length) {
      if (permitidos.includes(d)) {
        this.nbsCodigoSelecionado = d;
        return;
      }
      const matches = permitidos.filter((p) => d.startsWith(p) || p.startsWith(d));
      if (matches.length) {
        matches.sort((a, b) => b.length - a.length);
        this.nbsCodigoSelecionado = matches[0];
        return;
      }
      this.nbsCodigoSelecionado = null;
      return;
    }
    const hit = this.nbsLista.find((s) => d === s.codigo || d.startsWith(s.codigo));
    this.nbsCodigoSelecionado = hit ? hit.codigo : null;
  }

  /** Limpa NBS se deixou de ser compatível com o LC116 atual. */
  private aplicarFiltroNbsAposLc116(): void {
    if (!this.wizard) return;
    const lc = this.apenasDigitos(this.wizard.codigoLc116).slice(0, 6);
    if (lc.length !== 6) return;
    const nbs = this.wizard.codigoServicoNbs;
    if (nbs && !codigoNbsPermitidoParaLc116(lc, nbs)) {
      this.wizard.codigoServicoNbs = '';
      this.nbsCodigoSelecionado = null;
    }
  }

  voltarPasso(): void {
    if (this.step <= 0) return;
    this.step--;
    this.syncEtapa();
    this.salvarRascunho(false);
  }

  avancarPasso(): void {
    if (!this.validarPasso()) return;
    if (this.step >= 3) return;
    this.step++;
    this.syncEtapa();
    this.salvarRascunho(false);
  }

  validarPasso(): boolean {
    if (!this.wizard) return false;
    if (this.step === 0) {
      if (!this.wizard.dataCompetencia) {
        this.message.warning('Informe a data de competência.');
        return false;
      }
      if (this.wizard.informarSerieNumeroDps && (!this.wizard.serieDps?.trim() || !this.wizard.numeroDps?.trim())) {
        this.message.warning('Informe série e número da DPS.');
        return false;
      }
      if (this.enviarImPrestadorNaDps && this.form?.tpAmb === 1) {
        const im = this.apenasDigitos(this.wizard.inscricaoMunicipal);
        if (!im || /^0+$/.test(im)) {
          this.message.warning('Informe a Inscrição Municipal real do prestador (campo IM).');
          return false;
        }
      }
      if (this.ibgePrestadorInvalido) {
        this.message.warning('Cadastre o IBGE de 7 dígitos do município emissor no cadastro do cliente (evita SEFIN E0041).');
        return false;
      }
      if (this.tomadorEnderecoIncompleto) {
        this.message.warning('Complete logradouro e CEP do tomador no agendamento (obrigatório para CNPJ na NFS-e nacional).');
        return false;
      }
    }
    if (this.step === 1) {
      const lc = this.apenasDigitos(this.wizard.codigoLc116).slice(0, 6);
      if (lc.length !== 6) {
        this.message.warning('Selecione o item LC116 nacional (6 dígitos).');
        return false;
      }
      if (this.enviarCTribMunNaDps) {
        if (!this.cTribMunSelecionado) {
          this.message.warning('Selecione o código tributação municipal (cTribMun) ou opção sem complemento.');
          return false;
        }
        if (this.cTribMunSelecionado !== CTRIBMUN_OMITIR) {
          const ct = this.apenasDigitos(this.wizard.codigoTributacaoMunicipal);
          if (ct.length !== 3) {
            this.message.warning('O cTribMun deve ter 3 dígitos.');
            return false;
          }
        }
      } else {
        this.wizard.codigoTributacaoMunicipal = '';
      }
      const nbs = this.apenasDigitos(this.wizard.codigoServicoNbs);
      if (nbs && !codigoNbsPermitidoParaLc116(lc, this.wizard.codigoServicoNbs)) {
        this.message.warning('O código NBS informado não é compatível com o LC116 escolhido.');
        return false;
      }
      if (!this.wizard.descricaoServico?.trim()) {
        this.message.warning('Informe a descrição do serviço.');
        return false;
      }
    }
    if (this.step === 2) {
      if (!(Number(this.wizard.valorServico) > 0)) {
        this.message.warning('Informe o valor do serviço.');
        return false;
      }
    }
    return true;
  }

  confirmarEmissao(): void {
    if (!this.wizard) return;
    const prev = this.step;
    this.step = 1;
    if (!this.validarPasso()) { this.step = prev; return; }
    this.step = 2;
    if (!this.validarPasso()) { this.step = prev; return; }
    this.step = prev;
    const tribOk = !this.enviarCTribMunNaDps || !!this.cTribMunSelecionado;
    if (this.ibgePrestadorInvalido) {
      this.message.warning('Cadastre o IBGE do município emissor no cliente antes de emitir (SEFIN E0041).');
      return;
    }
    if (this.tomadorEnderecoIncompleto) {
      this.message.warning('Complete o endereço do tomador no agendamento antes de emitir.');
      return;
    }
    if (this.apenasDigitos(this.wizard.codigoLc116).length !== 6
      || !tribOk
      || !(Number(this.wizard.valorServico) > 0)) {
      this.message.warning('Revise LC116, valores e demais campos antes de emitir.');
      return;
    }
    this.aplicarPoliticaCTribMun();
    if (!this.enviarImPrestadorNaDps && this.wizard) {
      this.wizard.inscricaoMunicipal = '';
    }
    this.emitindo = true;
    this.syncEtapa();
    const body = { wizard: this.toApiWizard() };
    this.http.post<{ sucesso?: boolean; mensagem?: string; numeroNfe?: number; danfseAnexado?: boolean; danfseMensagem?: string }>(
      `${this.api}/NfseNacional/emissao/agendamento/${this.codigo}`,
      body,
      { headers: this.h }
    ).pipe(timeout(300000), catchError(err => {
      const e = err as { error?: { mensagem?: string } };
      this.message.error(e?.error?.mensagem || 'Falha na emissão.');
      this.emitindo = false;
      this.cdr.markForCheck();
      return of(null);
    })).subscribe(res => {
      if (!res) return;
      if (res.sucesso) {
        const pdfMsg = res.danfseMensagem || (res.danfseAnexado ? 'PDF anexado.' : '');
        const texto = (res.mensagem || `NFS-e emitida (NF ${res.numeroNfe ?? '—'}).`)
          + (pdfMsg ? ` ${pdfMsg}` : '');
        res.danfseAnexado === false && pdfMsg
          ? this.message.warning(texto)
          : this.message.success(texto);
        this.emitindo = false;
        this.voltarLista();
        return;
      }
      this.message.error(res.mensagem || 'Emissão não concluída.');
      this.emitindo = false;
      this.cdr.markForCheck();
    });
  }

  private salvarRascunho(mostrarOk: boolean): void {
    if (!this.wizard) return;
    this.salvando = true;
    this.syncEtapa();
    this.http.put(`${this.api}/NfseNacional/emissao/agendamento/${this.codigo}/rascunho`, this.toApiWizard(), { headers: this.h })
      .subscribe({
        next: () => {
          this.salvando = false;
          if (mostrarOk) this.message.success('Rascunho salvo.');
          this.cdr.markForCheck();
        },
        error: () => {
          this.salvando = false;
          this.message.error('Erro ao salvar rascunho.');
          this.cdr.markForCheck();
        }
      });
  }

  private syncEtapa(): void {
    if (this.wizard) this.wizard.etapaAtual = this.step;
  }

  private toApiWizard(): Record<string, unknown> {
    const w = this.wizard!;
    return {
      etapaAtual: this.step,
      preencherInfoIbsCbs: w.preencherInfoIbsCbs,
      dataCompetencia: w.dataCompetencia,
      informarSerieNumeroDps: w.informarSerieNumeroDps,
      serieDps: w.serieDps,
      numeroDps: w.numeroDps,
      tipoEmitente: w.tipoEmitente,
      tomadorLocalDomicilio: w.tomadorLocalDomicilio,
      intermediarioLocalDomicilio: w.intermediarioLocalDomicilio,
      destinatarioEhAdquirente: w.destinatarioEhAdquirente,
      ehCompraGovernamental: w.ehCompraGovernamental,
      codigoServicoNbs: w.codigoServicoNbs,
      codigoLc116: this.apenasDigitos(w.codigoLc116).slice(0, 6),
      codigoTributacaoMunicipal: this.enviarCTribMunNaDps
        ? (() => {
            const d = this.apenasDigitos(w.codigoTributacaoMunicipal);
            return d.length === 3 ? d : '';
          })()
        : '',
      inscricaoMunicipal: this.enviarImPrestadorNaDps ? this.apenasDigitos(w.inscricaoMunicipal) : '',
      descricaoServico: w.descricaoServico,
      valorServico: Number(w.valorServico) || 0,
      aliquotaIss: Number(w.aliquotaIss) || 0
    };
  }

  private apenasDigitos(v: string): string {
    return (v || '').replace(/\D/g, '');
  }

  private mapFormulario(raw: unknown): FormularioEmissao {
    const r = raw as Record<string, unknown>;
    const w = (r['wizard'] ?? r['Wizard']) as Record<string, unknown> | undefined;
    const prest = (r['prestador'] ?? r['Prestador']) as Record<string, unknown> | undefined;
    const tom = (r['tomador'] ?? r['Tomador']) as Record<string, unknown> | undefined;
    return {
      codigoCorpoEmissaoNota: Number(r['codigoCorpoEmissaoNota'] ?? r['CodigoCorpoEmissaoNota']),
      statusAgendamento: String(r['statusAgendamento'] ?? r['StatusAgendamento'] ?? ''),
      tpAmb: Number(r['tpAmb'] ?? r['TpAmb'] ?? 2),
      ambienteLabel: String(r['ambienteLabel'] ?? r['AmbienteLabel'] ?? ''),
      prestador: prest ? {
        codigoPessoa: Number(prest['codigoPessoa'] ?? prest['CodigoPessoa']),
        documento: String(prest['documento'] ?? prest['Documento'] ?? ''),
        razao: String(prest['razao'] ?? prest['Razao'] ?? ''),
        nomeFantasia: String(prest['nomeFantasia'] ?? prest['NomeFantasia'] ?? ''),
        inscricaoMunicipal: String(prest['inscricaoMunicipal'] ?? prest['InscricaoMunicipal'] ?? ''),
        codigoIbgeMunicipio: String(prest['codigoIbgeMunicipio'] ?? prest['CodigoIbgeMunicipio'] ?? '')
      } : undefined,
      tomador: tom ? {
        codigo: Number(tom['codigo'] ?? tom['Codigo']),
        documento: String(tom['documento'] ?? tom['Documento'] ?? ''),
        razao: String(tom['razao'] ?? tom['Razao'] ?? ''),
        email: String(tom['email'] ?? tom['Email'] ?? ''),
        logradouro: String(tom['logradouro'] ?? tom['Logradouro'] ?? ''),
        numeroLogradouro: String(tom['numeroLogradouro'] ?? tom['NumeroLogradouro'] ?? ''),
        complemento: String(tom['complemento'] ?? tom['Complemento'] ?? ''),
        bairro: String(tom['bairro'] ?? tom['Bairro'] ?? ''),
        cidade: String(tom['cidade'] ?? tom['Cidade'] ?? ''),
        uf: String(tom['uf'] ?? tom['UF'] ?? tom['Uf'] ?? ''),
        cep: String(tom['cep'] ?? tom['CEP'] ?? tom['Cep'] ?? '')
      } : undefined,
      wizard: this.mapWizard(w)
    };
  }

  private mapWizard(w: Record<string, unknown> | undefined): NfseWizard {
    const x = w || {};
    return {
      etapaAtual: Number(x['etapaAtual'] ?? x['EtapaAtual'] ?? 0),
      preencherInfoIbsCbs: Boolean(x['preencherInfoIbsCbs'] ?? x['PreencherInfoIbsCbs']),
      dataCompetencia: String(x['dataCompetencia'] ?? x['DataCompetencia'] ?? ''),
      informarSerieNumeroDps: Boolean(x['informarSerieNumeroDps'] ?? x['InformarSerieNumeroDps']),
      serieDps: String(x['serieDps'] ?? x['SerieDps'] ?? ''),
      numeroDps: String(x['numeroDps'] ?? x['NumeroDps'] ?? ''),
      tipoEmitente: Number(x['tipoEmitente'] ?? x['TipoEmitente'] ?? 1),
      tomadorLocalDomicilio: Number(x['tomadorLocalDomicilio'] ?? x['TomadorLocalDomicilio'] ?? 1),
      intermediarioLocalDomicilio: Number(x['intermediarioLocalDomicilio'] ?? x['IntermediarioLocalDomicilio'] ?? 0),
      destinatarioEhAdquirente: x['destinatarioEhAdquirente'] != null ? Boolean(x['destinatarioEhAdquirente']) : true,
      ehCompraGovernamental: x['ehCompraGovernamental'] != null ? Boolean(x['ehCompraGovernamental']) : false,
      codigoServicoNbs: String(x['codigoServicoNbs'] ?? x['CodigoServicoNbs'] ?? ''),
      codigoLc116: String(x['codigoLc116'] ?? x['CodigoLc116'] ?? ''),
      codigoTributacaoMunicipal: String(x['codigoTributacaoMunicipal'] ?? x['CodigoTributacaoMunicipal'] ?? ''),
      inscricaoMunicipal: String(x['inscricaoMunicipal'] ?? x['InscricaoMunicipal'] ?? ''),
      descricaoServico: String(x['descricaoServico'] ?? x['DescricaoServico'] ?? ''),
      valorServico: Number(x['valorServico'] ?? x['ValorServico'] ?? 0),
      aliquotaIss: Number(x['aliquotaIss'] ?? x['AliquotaIss'] ?? 0)
    };
  }
}
