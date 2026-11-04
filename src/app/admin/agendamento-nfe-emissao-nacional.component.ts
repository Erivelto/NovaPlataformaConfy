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
  descricaoServico: string;
  valorServico: number;
  aliquotaIss: number;
}

interface FormularioEmissao {
  codigoCorpoEmissaoNota: number;
  statusAgendamento: string;
  wizard: NfseWizard;
  prestador?: { codigoPessoa: number; documento: string; razao: string; nomeFantasia: string; inscricaoMunicipal: string };
  tomador?: { codigo: number; documento: string; razao: string; email: string; cidade: string; uf: string; cep: string };
  servicosCadastro: string[];
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
            <div nz-col [nzSpan]="8" [nzXs]="24"><label class="lbl">Cidade / UF</label><div class="ro">{{ form?.tomador?.cidade || '—' }} / {{ form?.tomador?.uf || '—' }}</div></div>
            <div nz-col [nzSpan]="8" [nzXs]="24"><label class="lbl">CEP</label><div class="ro">{{ form?.tomador?.cep || '—' }}</div></div>
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
            <div nz-col [nzSpan]="12" [nzXs]="24">
              <nz-form-item>
                <nz-form-label nzRequired>Código NBS / serviço nacional</nz-form-label>
                <nz-form-control nzExtra="Obrigatório na DPS (até 9 dígitos).">
                  <input nz-input [(ngModel)]="wizard.codigoServicoNbs" placeholder="Ex.: 010101001" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12" [nzXs]="24">
              <nz-form-item>
                <nz-form-label>LC116 / código prefeitura</nz-form-label>
                <nz-form-control>
                  <input nz-input [(ngModel)]="wizard.codigoLc116" placeholder="Ex.: 0101" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="24" *ngIf="servicosCadastro.length">
              <nz-form-item>
                <nz-form-label>Serviços no cadastro</nz-form-label>
                <nz-form-control>
                  <nz-select [(ngModel)]="servicoSelecionado" nzPlaceHolder="Selecione..." nzAllowClear (ngModelChange)="aplicarServicoCadastro($event)">
                    <nz-option *ngFor="let s of servicosCadastro" [nzValue]="s" [nzLabel]="s"></nz-option>
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
            <dt>Tomador</dt><dd>{{ form?.tomador?.razao }} ({{ form?.tomador?.documento }})</dd>
            <dt>NBS / LC116</dt><dd>{{ wizard.codigoServicoNbs || '—' }} / {{ wizard.codigoLc116 || wizard.codigoServicoNbs || '—' }}</dd>
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
  `]
})
export class AgendamentoNfeEmissaoNacionalComponent implements OnInit {
  private readonly api = environment.apiUrl;

  loading = true;
  salvando = false;
  emitindo = false;
  codigo = 0;
  statusLista = '';
  step = 0;
  form: FormularioEmissao | null = null;
  wizard: NfseWizard | null = null;
  servicosCadastro: string[] = [];
  servicoSelecionado: string | null = null;

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
        this.servicosCadastro = this.form.servicosCadastro || [];
        this.step = Math.min(Math.max(this.wizard.etapaAtual ?? 0, 0), 3);
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  aplicarServicoCadastro(codigo: string | null): void {
    if (!codigo || !this.wizard) return;
    this.wizard.codigoServicoNbs = this.apenasDigitos(codigo);
    this.cdr.markForCheck();
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
    }
    if (this.step === 1) {
      if (!this.apenasDigitos(this.wizard.codigoServicoNbs)) {
        this.message.warning('Informe o código NBS / serviço.');
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
    if (!this.apenasDigitos(this.wizard.codigoServicoNbs) || !(Number(this.wizard.valorServico) > 0)) {
      this.message.warning('Revise serviço/NBS e valores antes de emitir.');
      return;
    }
    this.emitindo = true;
    this.syncEtapa();
    const body = { wizard: this.toApiWizard() };
    this.http.post<{ sucesso?: boolean; mensagem?: string; numeroNfe?: number }>(
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
        this.message.success(res.mensagem || `NFS-e emitida (NF ${res.numeroNfe ?? '—'}).`);
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
      codigoLc116: w.codigoLc116,
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
    const servicos = (r['servicosCadastro'] ?? r['ServicosCadastro']) as string[] | undefined;

    return {
      codigoCorpoEmissaoNota: Number(r['codigoCorpoEmissaoNota'] ?? r['CodigoCorpoEmissaoNota']),
      statusAgendamento: String(r['statusAgendamento'] ?? r['StatusAgendamento'] ?? ''),
      tpAmb: Number(r['tpAmb'] ?? r['TpAmb'] ?? 2),
      ambienteLabel: String(r['ambienteLabel'] ?? r['AmbienteLabel'] ?? ''),
      servicosCadastro: servicos || [],
      prestador: prest ? {
        codigoPessoa: Number(prest['codigoPessoa'] ?? prest['CodigoPessoa']),
        documento: String(prest['documento'] ?? prest['Documento'] ?? ''),
        razao: String(prest['razao'] ?? prest['Razao'] ?? ''),
        nomeFantasia: String(prest['nomeFantasia'] ?? prest['NomeFantasia'] ?? ''),
        inscricaoMunicipal: String(prest['inscricaoMunicipal'] ?? prest['InscricaoMunicipal'] ?? '')
      } : undefined,
      tomador: tom ? {
        codigo: Number(tom['codigo'] ?? tom['Codigo']),
        documento: String(tom['documento'] ?? tom['Documento'] ?? ''),
        razao: String(tom['razao'] ?? tom['Razao'] ?? ''),
        email: String(tom['email'] ?? tom['Email'] ?? ''),
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
      descricaoServico: String(x['descricaoServico'] ?? x['DescricaoServico'] ?? ''),
      valorServico: Number(x['valorServico'] ?? x['ValorServico'] ?? 0),
      aliquotaIss: Number(x['aliquotaIss'] ?? x['AliquotaIss'] ?? 0)
    };
  }
}
