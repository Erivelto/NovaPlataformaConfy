import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../environments/environment';

interface Tomador {
  Codigo?: number;
  codigo?: number;
  Razao?: string;
  razao?: string;
  Excluido?: boolean;
  excluido?: boolean;
}

@Component({
  selector: 'app-nova-solicitacao-nfe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzModalModule,
    NzInputModule, NzDatePickerModule, NzCheckboxModule,
    NzDividerModule, NzAlertModule, NzSkeletonModule,
    NzStepsModule, NzRadioModule, NzTagModule
  ],
  template: `
    <button *ngIf="showButton" nz-button nzType="primary" (click)="openWizard()">
      <i nz-icon nzType="plus"></i> {{ buttonLabel }}
    </button>

    <nz-modal
      [(nzVisible)]="wizardVisible"
      nzTitle="Nova Solicitação de Emissão NFe"
      [nzWidth]="760"
      [nzFooter]="wizardFooter"
      (nzOnCancel)="closeWizard()">

      <ng-container *nzModalContent>
        <nz-steps [nzCurrent]="wizardStep" nzSize="small" style="margin-bottom:28px">
          <nz-step nzTitle="Tomador(Cliente)"></nz-step>
          <nz-step nzTitle="Descrição / Valor"></nz-step>
          <nz-step nzTitle="Data"></nz-step>
          <nz-step nzTitle="Resumo"></nz-step>
        </nz-steps>

        <div *ngIf="wizardStep === 0">
          <h3 class="step-title">Tomador(Cliente) NF-e</h3>
          <ng-container *ngIf="!adicionandoTomador">
            <ng-container *ngIf="loadingTomadores">
              <nz-skeleton [nzActive]="true" [nzTitle]="false" [nzParagraph]="{ rows: 3 }"></nz-skeleton>
            </ng-container>
            <nz-alert
              *ngIf="!loadingTomadores && tomadores.length === 0"
              nzType="info"
              nzMessage="Nenhum tomador cadastrado. Adicione um novo ou prossiga com 'SEM TOMADOR'."
              nzShowIcon
              style="margin-bottom:12px">
            </nz-alert>
            <ng-container *ngIf="!loadingTomadores">
              <nz-radio-group [(ngModel)]="wizardForm.codigoTomador" (ngModelChange)="onTomadorChange($event)" style="width:100%; display:block">
                <div *ngFor="let t of tomadores" class="tomador-item"
                     [class.tomador-selected]="wizardForm.codigoTomador === (t.Codigo ?? t.codigo)"
                     (click)="selecionarTomador(t.Codigo ?? t.codigo ?? 0, (t.Razao ?? t.razao) ?? '')">
                  <label nz-radio [nzValue]="t.Codigo ?? t.codigo" style="width:100%; margin:0; cursor:pointer">
                    {{ (t.Razao ?? t.razao) | slice:0:60 }}{{ ((t.Razao ?? t.razao) ?? '').length > 60 ? '...' : '' }}
                  </label>
                </div>
                <div class="tomador-item"
                     [class.tomador-selected]="wizardForm.codigoTomador === 0"
                     (click)="selecionarTomador(0, 'SEM TOMADOR')">
                  <label nz-radio [nzValue]="0" style="width:100%; margin:0; cursor:pointer">
                    <strong>SEM TOMADOR</strong>
                  </label>
                </div>
              </nz-radio-group>
              <nz-divider></nz-divider>
              <div style="text-align:center">
                <button nz-button nzType="dashed" (click)="iniciarNovoTomador()">
                  <i nz-icon nzType="plus"></i> Adicionar Novo Tomador(Cliente)
                </button>
              </div>
            </ng-container>
          </ng-container>

          <ng-container *ngIf="adicionandoTomador">
            <nz-alert
              nzType="info"
              nzMessage="Pesquise o CNPJ para preencher os dados automaticamente ou preencha manualmente."
              nzShowIcon
              style="margin-bottom:16px">
            </nz-alert>
            <div class="form-field">
              <label class="form-label">CNPJ do Tomador(Cliente) <span class="req">*</span></label>
              <div style="display:flex; gap:8px; align-items:flex-start">
                <input nz-input [(ngModel)]="novoTomador.documento" (ngModelChange)="formatarCnpj()"
                  placeholder="00.000.000/0000-00" maxlength="18" style="width:220px" [disabled]="cnpjPesquisado">
                <button nz-button nzType="primary" (click)="buscarCnpj()" [disabled]="!cnpjValido || cnpjPesquisado" [nzLoading]="buscandoCnpj">
                  <i nz-icon nzType="search"></i> Procurar
                </button>
                <button *ngIf="cnpjPesquisado" nz-button (click)="novaPesquisaCnpj()">
                  <i nz-icon nzType="reload"></i> Novo CNPJ
                </button>
              </div>
            </div>
            <ng-container *ngIf="cnpjPesquisado">
              <nz-divider nzText="Dados do Tomador(Cliente)" nzOrientation="left"></nz-divider>
              <div class="tomador-form-grid">
                <div class="tomador-form-row">
                  <div class="form-field" style="flex:1">
                    <label class="form-label">Nome Fantasia</label>
                    <input nz-input [(ngModel)]="novoTomador.fantasia" placeholder="Nome fantasia">
                  </div>
                  <div class="form-field" style="flex:2">
                    <label class="form-label">Razão Social <span class="req">*</span></label>
                    <input nz-input [(ngModel)]="novoTomador.razao" placeholder="Razão social">
                  </div>
                </div>
                <div class="tomador-form-row">
                  <div class="form-field" style="flex:3">
                    <label class="form-label">Logradouro</label>
                    <input nz-input [(ngModel)]="novoTomador.logradouro" placeholder="Rua, Av, etc.">
                  </div>
                  <div class="form-field" style="flex:1; min-width:100px">
                    <label class="form-label">Número</label>
                    <input nz-input [(ngModel)]="novoTomador.numeroLogradouro" placeholder="Nº">
                  </div>
                </div>
                <div class="tomador-form-row">
                  <div class="form-field" style="flex:1">
                    <label class="form-label">Complemento</label>
                    <input nz-input [(ngModel)]="novoTomador.complemento" placeholder="Sala, andar, etc.">
                  </div>
                  <div class="form-field" style="flex:1">
                    <label class="form-label">Bairro</label>
                    <input nz-input [(ngModel)]="novoTomador.bairro" placeholder="Bairro">
                  </div>
                  <div class="form-field" style="flex:1">
                    <label class="form-label">Cidade</label>
                    <input nz-input [(ngModel)]="novoTomador.cidade" placeholder="Cidade">
                  </div>
                </div>
                <div class="tomador-form-row">
                  <div class="form-field" style="flex:0 0 80px">
                    <label class="form-label">UF</label>
                    <input nz-input [(ngModel)]="novoTomador.uf" placeholder="UF" maxlength="2" style="text-transform:uppercase">
                  </div>
                  <div class="form-field" style="flex:0 0 140px">
                    <label class="form-label">CEP</label>
                    <input nz-input [(ngModel)]="novoTomador.cep" placeholder="00000000" maxlength="8">
                  </div>
                  <div class="form-field" style="flex:1">
                    <label class="form-label">E-mail</label>
                    <input nz-input [(ngModel)]="novoTomador.email" placeholder="email@exemplo.com" type="email">
                  </div>
                </div>
              </div>
              <nz-alert *ngIf="erroTomador" nzType="error" [nzMessage]="erroTomador" nzShowIcon style="margin-top:12px"></nz-alert>
              <nz-divider></nz-divider>
              <div style="display:flex; gap:8px; justify-content:flex-end">
                <button nz-button (click)="cancelarNovoTomador()"><i nz-icon nzType="arrow-left"></i> Voltar</button>
                <button nz-button nzType="primary" (click)="salvarNovoTomador()" [nzLoading]="salvandoTomador">
                  <i nz-icon nzType="save"></i> Salvar Tomador(Cliente)
                </button>
              </div>
            </ng-container>
          </ng-container>
        </div>

        <div *ngIf="wizardStep === 1">
          <h3 class="step-title">Descrição / Valor</h3>
          <div class="form-field">
            <label class="form-label">Descrição dos serviços <span class="req">*</span><span class="hint"> (mín. 20 caracteres)</span></label>
            <textarea nz-input [(ngModel)]="wizardForm.descricao" [nzAutosize]="{ minRows: 5, maxRows: 8 }"
              maxlength="1000" placeholder="Descreva os serviços ou produtos prestados..."></textarea>
            <div class="char-count">{{ wizardForm.descricao.length }}/1000</div>
          </div>
          <div style="display:flex; gap:16px; flex-wrap:wrap">
            <div class="form-field">
              <label class="form-label">Valor (R$) <span class="req">*</span></label>
              <input nz-input [value]="wizardForm.valorStr" (input)="onValorInput($event)" placeholder="R$ 0,00" style="width:220px" inputmode="numeric">
            </div>
            <div class="form-field">
              <label class="form-label">Código Serviço/Atividade</label>
              <input nz-input [(ngModel)]="wizardForm.codigoPrefeitura" placeholder="Código opcional" maxlength="50" style="width:220px">
            </div>
          </div>
        </div>

        <div *ngIf="wizardStep === 2">
          <h3 class="step-title">Data de Emissão</h3>
          <div class="form-field">
            <label class="form-label">Data de Emissão <span class="req">*</span></label>
            <nz-date-picker [(ngModel)]="wizardForm.data" nzFormat="dd/MM/yyyy" [nzDisabledDate]="disabledDate"
              style="width:220px" nzPlaceHolder="Selecione a data"></nz-date-picker>
          </div>
          <div class="form-field">
            <label nz-checkbox [(ngModel)]="wizardForm.exterior">Tomador(Cliente) no exterior</label>
          </div>
          <nz-alert nzType="info" nzMessage="Agendamentos para o mesmo dia só são permitidos até as 19h." nzShowIcon style="margin-top:12px"></nz-alert>
        </div>

        <div *ngIf="wizardStep === 3">
          <div class="resumo-header">
            <i nz-icon nzType="check-circle" nzTheme="fill" style="color:#52c41a; font-size:36px"></i>
            <h3>Processo concluído!</h3>
            <p>Confira os dados abaixo e clique em <strong>Salvar</strong> para confirmar.</p>
          </div>
          <nz-divider></nz-divider>
          <div class="resumo-grid">
            <div class="resumo-row">
              <div class="resumo-field">
                <label class="resumo-label"><i nz-icon nzType="user"></i> Tomador(Cliente)</label>
                <div class="resumo-value">{{ wizardForm.tomadorNome || 'SEM TOMADOR' }}</div>
              </div>
              <div class="resumo-field resumo-field-sm">
                <label class="resumo-label"><i nz-icon nzType="dollar"></i> Valor (R$)</label>
                <div class="resumo-value">{{ wizardForm.valor | currency:'BRL':'symbol':'1.2-2' }}</div>
              </div>
              <div class="resumo-field resumo-field-sm">
                <label class="resumo-label"><i nz-icon nzType="calendar"></i> Data de Emissão</label>
                <div class="resumo-value">{{ wizardForm.data | date:'dd/MM/yyyy' }}</div>
              </div>
            </div>
            <div class="resumo-row">
              <div class="resumo-field" style="flex:1">
                <label class="resumo-label"><i nz-icon nzType="file-text"></i> Descrição dos Serviços</label>
                <div class="resumo-value resumo-descricao">{{ wizardForm.descricao }}</div>
              </div>
              <div class="resumo-field resumo-field-sm">
                <label class="resumo-label"><i nz-icon nzType="tags"></i> Código Serviço/Atividade</label>
                <div class="resumo-value">{{ wizardForm.codigoPrefeitura || '-' }}</div>
              </div>
              <div class="resumo-field resumo-field-sm">
                <label class="resumo-label"><i nz-icon nzType="global"></i> Exterior</label>
                <div class="resumo-value">
                  <nz-tag [nzColor]="wizardForm.exterior ? 'purple' : 'default'">{{ wizardForm.exterior ? 'Sim' : 'Não' }}</nz-tag>
                </div>
              </div>
            </div>
          </div>
          <nz-alert nzType="warning" nzMessage="Aviso"
            nzDescription="Informamos que em decorrência da alta procura pelos serviços online nos sites das prefeituras nos primeiros dias úteis de cada mês, é possível que algumas solicitações tenham demora na finalização da execução."
            nzShowIcon style="margin-top:16px"></nz-alert>
        </div>

        <nz-alert *ngIf="erroWizard" nzType="error" [nzMessage]="erroWizard" nzShowIcon style="margin-top:16px"></nz-alert>
      </ng-container>
    </nz-modal>

    <ng-template #wizardFooter>
      <button nz-button (click)="closeWizard()">Cancelar</button>
      <button nz-button (click)="anterior()" [disabled]="wizardStep === 0"><i nz-icon nzType="left"></i> Anterior</button>
      <button *ngIf="wizardStep < 3" nz-button nzType="primary" (click)="proximo()">Próximo <i nz-icon nzType="right"></i></button>
      <button *ngIf="wizardStep === 3" nz-button nzType="primary" (click)="salvar()" [nzLoading]="enviando">
        <i nz-icon nzType="save"></i> Salvar
      </button>
    </ng-template>
  `,
  styles: [`
    .step-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: rgba(0,0,0,0.85); }
    .form-field { margin-bottom: 16px; }
    .form-label { display: block; font-weight: 500; margin-bottom: 6px; color: rgba(0,0,0,0.85); }
    .hint { font-weight: 400; color: rgba(0,0,0,0.45); font-size: 12px; }
    .req { color: #ff4d4f; margin-left: 2px; }
    .char-count { text-align: right; color: rgba(0,0,0,0.45); font-size: 12px; margin-top: 4px; }
    .tomador-item { padding: 10px 14px; border: 1px solid #f0f0f0; border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: all .2s; }
    .tomador-item:hover { border-color: #1890ff; background: #e6f7ff; }
    .tomador-selected { border-color: #1890ff !important; background: #e6f7ff !important; }
    .resumo-header { text-align: center; padding: 8px 0 4px; }
    .resumo-header h3 { margin: 10px 0 4px; font-size: 18px; }
    .resumo-header p { color: rgba(0,0,0,0.55); margin: 0; }
    .resumo-grid { display: flex; flex-direction: column; gap: 12px; }
    .resumo-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .resumo-field { flex: 2; }
    .resumo-field-sm { flex: 1; min-width: 140px; }
    .resumo-label { display: block; font-weight: 600; color: rgba(0,0,0,0.65); font-size: 13px; margin-bottom: 4px; }
    .resumo-value { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 4px; padding: 6px 10px; color: rgba(0,0,0,0.85); min-height: 34px; }
    .resumo-descricao { white-space: pre-wrap; min-height: 60px; }
    .tomador-form-grid { display: flex; flex-direction: column; gap: 12px; }
    .tomador-form-row { display: flex; gap: 12px; flex-wrap: wrap; }
  `]
})
export class NovaSolicitacaoNfeComponent {
  private readonly apiBase = environment.apiUrl;

  @Input({ required: true }) codigoPessoa = 0;
  @Input() buttonLabel = 'Nova Solicitação Nfe';
  @Input() showButton = true;
  @Output() criada = new EventEmitter<void>();

  wizardVisible = false;
  wizardStep = 0;
  enviando = false;
  erroWizard = '';

  tomadores: Tomador[] = [];
  loadingTomadores = false;

  adicionandoTomador = false;
  buscandoCnpj = false;
  salvandoTomador = false;
  cnpjPesquisado = false;
  erroTomador = '';
  novoTomador = {
    documento: '', fantasia: '', razao: '', logradouro: '',
    numeroLogradouro: '', complemento: '', bairro: '',
    cidade: '', uf: '', cep: '', email: ''
  };

  wizardForm = {
    codigoTomador: null as number | null,
    tomadorNome: '',
    descricao: '',
    valorStr: '',
    valor: null as number | null,
    data: null as Date | null,
    repetir: false,
    exterior: false,
    codigoPrefeitura: ''
  };

  disabledDate = (current: Date): boolean => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (now.getHours() >= 19) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return current < tomorrow;
    }
    return current < today;
  };

  constructor(
    private http: HttpClient,
    private msg: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  openWizard(): void {
    if (!this.codigoPessoa) {
      this.msg.warning('Cliente não identificado.');
      return;
    }
    this.wizardStep = 0;
    const agora = new Date();
    let dataInicial = new Date();
    if (agora.getHours() >= 19) dataInicial.setDate(dataInicial.getDate() + 1);
    this.wizardForm = { codigoTomador: null, tomadorNome: '', descricao: '', valorStr: '', valor: null, data: dataInicial, repetir: false, exterior: false, codigoPrefeitura: '' };
    this.erroWizard = '';
    this.adicionandoTomador = false;
    this.loadingTomadores = true;
    this.tomadores = [];
    this.wizardVisible = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.carregarTomadores();
      this.carregarUltimaDescricao();
    }, 0);
  }

  private carregarUltimaDescricao(): void {
    this.http.get(`${this.apiBase}/CorpoEmissaoNota/GetUltimaDescricao/${this.codigoPessoa}`, { headers: this.headers, responseType: 'text' }).subscribe({
      next: (desc) => {
        if (desc && !this.wizardForm.descricao) {
          this.wizardForm.descricao = desc.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\n+$/, '');
          this.cdr.markForCheck();
        }
      },
      error: () => {}
    });
  }

  carregarTomadores(): void {
    this.loadingTomadores = true;
    this.tomadores = [];
    this.http.get<Tomador[]>(`${this.apiBase}/TomadorEmissaoNota/${this.codigoPessoa}`, { headers: this.headers }).subscribe({
      next: (data) => {
        this.tomadores = Array.isArray(data) ? data.filter((t: any) => !t.Excluido && !t.excluido) : [];
        this.loadingTomadores = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.tomadores = [];
        this.loadingTomadores = false;
        this.erroWizard = 'Erro ao carregar tomadores. Verifique sua conexão.';
        this.cdr.markForCheck();
      }
    });
  }

  selecionarTomador(codigo: number, nome: string): void {
    this.wizardForm.codigoTomador = codigo;
    this.wizardForm.tomadorNome = nome;
  }

  onTomadorChange(codigo: number): void {
    if (codigo === 0) {
      this.wizardForm.tomadorNome = 'SEM TOMADOR';
    } else {
      const t = this.tomadores.find(tom => (tom.Codigo ?? tom.codigo) === codigo);
      this.wizardForm.tomadorNome = t ? (t.Razao ?? t.razao ?? '') : '';
    }
  }

  iniciarNovoTomador(): void {
    this.adicionandoTomador = true;
    this.cnpjPesquisado = false;
    this.buscandoCnpj = false;
    this.erroTomador = '';
    this.novoTomador = { documento: '', fantasia: '', razao: '', logradouro: '', numeroLogradouro: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', email: '' };
  }

  cancelarNovoTomador(): void {
    this.adicionandoTomador = false;
    this.erroTomador = '';
  }

  formatarCnpj(): void {
    let v = this.novoTomador.documento.replace(/\D/g, '');
    if (v.length > 14) v = v.substring(0, 14);
    if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
    else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
    else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{1,3})/, '$1.$2');
    this.novoTomador.documento = v;
  }

  get cnpjValido(): boolean {
    return this.novoTomador.documento.replace(/\D/g, '').length === 14;
  }

  novaPesquisaCnpj(): void {
    this.cnpjPesquisado = false;
    this.novoTomador = { documento: '', fantasia: '', razao: '', logradouro: '', numeroLogradouro: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', email: '' };
  }

  buscarCnpj(): void {
    if (!this.cnpjValido) return;
    const cnpj = this.novoTomador.documento.replace(/\D/g, '');
    this.buscandoCnpj = true;
    this.erroTomador = '';
    this.http.get<any>(`${this.apiBase}/TomadorEmissaoNota/BuscaTomador/${cnpj}`, { headers: this.headers }).subscribe({
      next: (data) => {
        if (data) {
          this.novoTomador.fantasia = data.Fantasia ?? data.fantasia ?? '';
          this.novoTomador.razao = data.Razao ?? data.razao ?? '';
          this.novoTomador.logradouro = data.Logradouro ?? data.logradouro ?? '';
          this.novoTomador.numeroLogradouro = data.NumeroLogradouro ?? data.numeroLogradouro ?? '';
          this.novoTomador.complemento = data.Complemento ?? data.complemento ?? '';
          this.novoTomador.bairro = data.Bairro ?? data.bairro ?? '';
          this.novoTomador.cidade = data.Cidade ?? data.cidade ?? '';
          this.novoTomador.uf = data.UF ?? data.uf ?? '';
          this.novoTomador.cep = data.CEP ?? data.cep ?? '';
          this.novoTomador.email = data.Email ?? data.email ?? '';
        }
        this.cnpjPesquisado = true;
        this.buscandoCnpj = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cnpjPesquisado = true;
        this.buscandoCnpj = false;
        this.cdr.markForCheck();
      }
    });
  }

  salvarNovoTomador(): void {
    if (!this.novoTomador.razao.trim()) {
      this.erroTomador = 'A Razão Social é obrigatória.';
      return;
    }
    this.salvandoTomador = true;
    this.erroTomador = '';
    const payload = {
      Codigo: 0,
      CodigoEmissaoNota: this.codigoPessoa,
      Documento: this.novoTomador.documento.replace(/\D/g, ''),
      Fantasia: this.novoTomador.fantasia,
      Razao: this.novoTomador.razao,
      Logradouro: this.novoTomador.logradouro,
      NumeroLogradouro: this.novoTomador.numeroLogradouro,
      Complemento: this.novoTomador.complemento,
      Bairro: this.novoTomador.bairro,
      Cidade: this.novoTomador.cidade,
      UF: this.novoTomador.uf.toUpperCase(),
      CEP: this.novoTomador.cep.replace(/\D/g, ''),
      Email: this.novoTomador.email,
      Excluido: false
    };
    this.http.post(`${this.apiBase}/TomadorEmissaoNota`, payload, { headers: this.headers }).subscribe({
      next: () => {
        this.salvandoTomador = false;
        this.adicionandoTomador = false;
        this.msg.success('Tomador cadastrado com sucesso!');
        this.carregarTomadores();
        this.cdr.markForCheck();
      },
      error: () => {
        this.salvandoTomador = false;
        this.erroTomador = 'Erro ao salvar tomador. Tente novamente.';
        this.cdr.markForCheck();
      }
    });
  }

  onValorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '');
    digits = digits.replace(/^0+/, '') || '0';
    while (digits.length < 3) digits = '0' + digits;
    const intPart = digits.slice(0, -2);
    const decPart = digits.slice(-2);
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    this.wizardForm.valorStr = `R$ ${intFormatted},${decPart}`;
    this.wizardForm.valor = parseInt(digits, 10) / 100;
    setTimeout(() => {
      input.value = this.wizardForm.valorStr;
      const len = input.value.length;
      input.setSelectionRange(len, len);
    });
  }

  get stepValido(): boolean {
    switch (this.wizardStep) {
      case 0: return !this.adicionandoTomador && this.wizardForm.codigoTomador !== null;
      case 1: return this.wizardForm.descricao.length >= 20 && !!this.wizardForm.valor && this.wizardForm.valor > 0;
      case 2: return !!this.wizardForm.data && this.validarData();
      case 3: return true;
      default: return false;
    }
  }

  validarData(): boolean {
    if (!this.wizardForm.data) return false;
    const d = this.wizardForm.data;
    const hoje = new Date();
    if (d.getFullYear() < hoje.getFullYear()) return false;
    if (d.getFullYear() === hoje.getFullYear() && d.getMonth() < hoje.getMonth()) return false;
    if (d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth() && d.getDate() < hoje.getDate()) return false;
    if (d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear() && hoje.getHours() >= 19) return false;
    return true;
  }

  proximo(): void {
    this.erroWizard = '';
    if (!this.stepValido) {
      this.erroWizard = this.getMensagemErro();
      return;
    }
    this.wizardStep++;
    this.cdr.markForCheck();
  }

  anterior(): void {
    if (this.wizardStep > 0) this.wizardStep--;
    this.erroWizard = '';
    this.cdr.markForCheck();
  }

  private getMensagemErro(): string {
    switch (this.wizardStep) {
      case 0: return this.adicionandoTomador ? 'Salve ou cancele o cadastro do tomador antes de continuar.' : 'Selecione um tomador para continuar.';
      case 1: {
        const erros: string[] = [];
        if (this.wizardForm.descricao.length < 20) erros.push('A descrição deve ter pelo menos 20 caracteres.');
        if (!this.wizardForm.valor || this.wizardForm.valor <= 0) erros.push('Informe um valor válido maior que zero.');
        return erros.join(' ');
      }
      case 2:
        if (!this.wizardForm.data) return 'Selecione a data de emissão.';
        const hoje = new Date();
        if (
          this.wizardForm.data.getDate() === hoje.getDate() &&
          this.wizardForm.data.getMonth() === hoje.getMonth() &&
          this.wizardForm.data.getFullYear() === hoje.getFullYear() &&
          hoje.getHours() >= 19
        ) return 'Após as 19h não é possível agendar para hoje. Selecione o dia seguinte.';
        return 'A data deve ser hoje ou posterior.';
      default: return '';
    }
  }

  closeWizard(): void {
    this.wizardVisible = false;
    this.erroWizard = '';
    this.cdr.markForCheck();
  }

  salvar(): void {
    this.enviando = true;
    this.erroWizard = '';
    const d = this.wizardForm.data!;
    d.setHours(0, 0, 0, 0);
    const payload = {
      CodigoPessoa: this.codigoPessoa,
      CodigoTomador: this.wizardForm.codigoTomador ?? 0,
      CodigoServico: '',
      Descricao: this.wizardForm.descricao,
      Valor: this.wizardForm.valor?.toFixed(2).replace('.', ',') ?? '0,00',
      DataPrimeiraEmissao: d.toISOString(),
      repetir: this.wizardForm.repetir,
      CodigoEmissaoNota: 0,
      Status: 'C',
      exterior: this.wizardForm.exterior,
      CodigoPrefeitura: this.wizardForm.codigoPrefeitura
    };
    this.http.post(`${this.apiBase}/CorpoEmissaoNota`, payload, { headers: this.headers }).subscribe({
      next: () => {
        this.enviando = false;
        this.closeWizard();
        this.msg.success('Solicitação enviada com sucesso!');
        this.criada.emit();
        this.cdr.markForCheck();
      },
      error: () => {
        this.enviando = false;
        this.erroWizard = 'Erro ao enviar solicitação. Tente novamente.';
        this.cdr.markForCheck();
      }
    });
  }
}
