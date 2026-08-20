import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-integracao-cadastro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, HttpClientModule,
    NzButtonModule, NzFormModule, NzInputModule,
    NzStepsModule, NzSpinModule, NzIconModule, NzAlertModule, RouterLink],
  template: `
<div class="login-wrap">
  <div class="login-box">

    <div class="login-logo">
      <img src="/Logo.png" alt="Contfy" class="login-logo-img">
    </div>
    <h2 class="login-title">Portal de Integração</h2>
    <p class="login-sub">Cadastre sua empresa e envie os documentos</p>

    <nz-steps [nzCurrent]="step" nzSize="small" class="steps">
      <nz-step nzTitle="Tipo"></nz-step>
      <nz-step nzTitle="E-mail"></nz-step>
      <nz-step nzTitle="Código"></nz-step>
      <nz-step nzTitle="Dados"></nz-step>
    </nz-steps>

    <nz-alert *ngIf="erro" nzType="error" [nzMessage]="erro" nzShowIcon class="alert-margin"></nz-alert>

    <!-- STEP 0: tipo -->
    <div *ngIf="step === 0">
      <p class="step-desc">O que você precisa?</p>
      <div class="tipo-cards">
        <button class="tipo-card" [class.ativo]="tipo === 'abertura'" (click)="tipo = 'abertura'">
          <span nz-icon nzType="file-add" nzTheme="outline" class="tipo-icon"></span>
          <strong>Abrir empresa</strong>
          <small>Ainda não tenho CNPJ</small>
        </button>
        <button class="tipo-card" [class.ativo]="tipo === 'mudanca'" (click)="tipo = 'mudanca'">
          <span nz-icon nzType="swap" nzTheme="outline" class="tipo-icon"></span>
          <strong>Mudar de contabilidade</strong>
          <small>Já tenho empresa</small>
        </button>
      </div>
      <div class="actions">
        <button nz-button nzType="primary" nzBlock [disabled]="!tipo" (click)="step = 1" class="primary-btn">Continuar</button>
      </div>
      <p class="link-bottom">Já tem cadastro? <a routerLink="/integracao/entrar">Entrar</a></p>
    </div>

    <!-- STEP 1: e-mail -->
    <div *ngIf="step === 1">
      <p class="step-desc">Informe seu e-mail para receber o código de verificação.</p>
      <nz-form-item>
        <nz-form-label>E-mail</nz-form-label>
        <nz-form-control>
          <nz-input-group [nzPrefix]="prefixMail">
            <input nz-input type="email" [(ngModel)]="email" placeholder="seu@email.com" (keyup.enter)="enviarCodigo()">
          </nz-input-group>
          <ng-template #prefixMail><span nz-icon nzType="mail"></span></ng-template>
        </nz-form-control>
      </nz-form-item>
      <div class="actions">
        <button nz-button nzType="default" (click)="step = 0">← Voltar</button>
        <button nz-button nzType="primary" class="primary-btn" [nzLoading]="carregando" (click)="enviarCodigo()">Enviar código</button>
      </div>
    </div>

    <!-- STEP 2: código -->
    <div *ngIf="step === 2">
      <p class="step-desc">Digite o código enviado para <strong>{{email}}</strong>.</p>
      <nz-form-item>
        <nz-form-label>Código de verificação</nz-form-label>
        <nz-form-control>
          <input nz-input type="text" maxlength="6" [(ngModel)]="codigo" placeholder="000000"
            (keyup.enter)="validarCodigo()" class="codigo-input">
        </nz-form-control>
      </nz-form-item>
      <div class="actions">
        <button nz-button nzType="default" (click)="step = 1">← Voltar</button>
        <button nz-button nzType="primary" class="primary-btn" [nzLoading]="carregando" (click)="validarCodigo()">Verificar</button>
      </div>
      <p class="link-bottom"><a (click)="reenviarCodigo()" style="cursor:pointer">Reenviar código</a></p>
    </div>

    <!-- STEP 3A: mudança -->
    <div *ngIf="step === 3 && tipo === 'mudanca'">
      <p class="step-desc">Dados da sua empresa atual.</p>
      <nz-form-item>
        <nz-form-label>CNPJ</nz-form-label>
        <nz-form-control>
          <input nz-input [(ngModel)]="form.cnpj" placeholder="00.000.000/0001-00" maxlength="18">
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Razão Social</nz-form-label>
        <nz-form-control>
          <input nz-input [(ngModel)]="form.razaoSocial" placeholder="Nome jurídico da empresa">
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Nome do Responsável</nz-form-label>
        <nz-form-control>
          <input nz-input [(ngModel)]="form.nomeResponsavel" placeholder="Seu nome completo">
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Telefone / WhatsApp</nz-form-label>
        <nz-form-control>
          <input nz-input [(ngModel)]="form.telefone" placeholder="(11) 99999-9999">
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Senha</nz-form-label>
        <nz-form-control>
          <nz-input-group [nzSuffix]="suffixEye">
            <input nz-input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="form.senha" placeholder="Mínimo 6 caracteres">
          </nz-input-group>
          <ng-template #suffixEye>
            <span nz-icon [nzType]="showPassword ? 'eye-invisible' : 'eye'" class="eye-toggle" (click)="showPassword = !showPassword"></span>
          </ng-template>
        </nz-form-control>
      </nz-form-item>
      <div class="actions">
        <button nz-button nzType="default" (click)="step = 2">← Voltar</button>
        <button nz-button nzType="primary" class="primary-btn" [nzLoading]="carregando" (click)="cadastrar()">Cadastrar</button>
      </div>
    </div>

    <!-- STEP 3B: abertura -->
    <div *ngIf="step === 3 && tipo === 'abertura'">
      <p class="step-desc">Dados para abertura da sua empresa.</p>
      <nz-form-item>
        <nz-form-label>Razão Social Desejada <small style="color:#999;font-weight:normal">(pode ser alterada se já existir)</small></nz-form-label>
        <nz-form-control>
          <input nz-input [(ngModel)]="form.razaoSocial" placeholder="Ex: Empresa Exemplo Ltda">
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Nome Fantasia <small style="color:#999;font-weight:normal">(nome comercial)</small></nz-form-label>
        <nz-form-control>
          <input nz-input [(ngModel)]="form.nomeFantasia" placeholder="Ex: Exemplo Store">
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Nome do Responsável</nz-form-label>
        <nz-form-control>
          <input nz-input [(ngModel)]="form.nomeResponsavel" placeholder="Seu nome completo">
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Telefone / WhatsApp</nz-form-label>
        <nz-form-control>
          <input nz-input [(ngModel)]="form.telefone" placeholder="(11) 99999-9999">
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Senha</nz-form-label>
        <nz-form-control>
          <nz-input-group [nzSuffix]="suffixEye2">
            <input nz-input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="form.senha" placeholder="Mínimo 6 caracteres">
          </nz-input-group>
          <ng-template #suffixEye2>
            <span nz-icon [nzType]="showPassword ? 'eye-invisible' : 'eye'" class="eye-toggle" (click)="showPassword = !showPassword"></span>
          </ng-template>
        </nz-form-control>
      </nz-form-item>
      <div class="actions">
        <button nz-button nzType="default" (click)="step = 2">← Voltar</button>
        <button nz-button nzType="primary" class="primary-btn" [nzLoading]="carregando" (click)="cadastrar()">Cadastrar</button>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .login-wrap { height:100%; display:flex; align-items:center; justify-content:center; padding:24px; background:linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%); }
    .login-box { width:100%; max-width:460px; background:#fff; border-radius:16px; padding:36px 32px 28px; box-shadow:0 8px 32px rgba(10,102,194,.18); }
    .login-logo { text-align:center; margin-bottom:16px; }
    .login-logo-img { width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid rgba(10,102,194,.15); box-shadow:0 4px 16px rgba(10,102,194,.2); }
    .login-title { margin:0; color:var(--primary-color); font-size:1.4rem; font-weight:700; text-align:center; }
    .login-sub { margin:6px 0 12px; color:rgba(0,0,0,.5); font-size:.9rem; text-align:center; }
    .steps { margin-bottom:20px; }
    .alert-margin { margin-bottom:14px; }
    .step-desc { color:rgba(0,0,0,.6); font-size:13px; margin-bottom:12px; }
    .actions { display:flex; gap:10px; justify-content:flex-end; margin-top:6px; }
    .primary-btn { flex:1; background:linear-gradient(90deg, var(--primary-color), var(--primary-light)); border:none; color:#fff; font-weight:600; }
    .link-bottom { text-align:center; margin-top:14px; font-size:13px; color:rgba(0,0,0,.5); }
    .link-bottom a { color:var(--primary-color); cursor:pointer; }
    .codigo-input { font-size:26px; letter-spacing:10px; text-align:center; }
    .tipo-cards { display:flex; gap:12px; margin-bottom:16px; }
    .tipo-card { flex:1; border:2px solid #e8e8e8; border-radius:12px; background:#fafafa; padding:18px 10px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; transition:all .2s; text-align:center; }
    .tipo-card:hover, .tipo-card.ativo { border-color:var(--primary-color); background:#f0f3ff; }
    .tipo-card.ativo { box-shadow:0 0 0 3px rgba(10,102,194,.15); }
    .tipo-card strong { font-size:13px; color:var(--primary-color); }
    .tipo-card small { font-size:11px; color:#888; }
    .tipo-icon { font-size:26px; color:var(--primary-color); }
    .eye-toggle { cursor:pointer; color:rgba(0,0,0,.45); }
    @media (max-width:480px) { .login-box { padding:24px 18px; border-radius:12px; } .tipo-cards { flex-direction:column; } }
  `]
})
export class IntegracaoCadastroComponent {
  step = 0;
  tipo = '';
  carregando = false;
  showPassword = false;
  email = '';
  codigo = '';
  erro = '';
  form = { cnpj: '', razaoSocial: '', nomeFantasia: '', nomeResponsavel: '', telefone: '', senha: '' };

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient, private msg: NzMessageService, private router: Router, private cdr: ChangeDetectorRef) {}

  enviarCodigo(): void {
    this.erro = '';
    if (!this.email.trim()) { this.erro = 'Informe seu e-mail.'; return; }
    this.carregando = true; this.cdr.markForCheck();
    this.http.post(`${this.api}/Integracao/EnviarCodigo`, { email: this.email.trim() }).subscribe({
      next: () => { this.step = 2; this.carregando = false; this.cdr.markForCheck(); },
      error: (e) => { this.erro = e.error?.mensagem || 'Erro ao enviar código.'; this.carregando = false; this.cdr.markForCheck(); }
    });
  }

  reenviarCodigo(): void { this.enviarCodigo(); }

  validarCodigo(): void {
    this.erro = '';
    if (this.codigo.length !== 6) { this.erro = 'O código deve ter 6 dígitos.'; return; }
    this.carregando = true; this.cdr.markForCheck();
    this.http.post(`${this.api}/Integracao/ValidarCodigo`, { email: this.email.trim(), codigo: this.codigo }).subscribe({
      next: () => { this.step = 3; this.carregando = false; this.cdr.markForCheck(); },
      error: (e) => { this.erro = e.error?.mensagem || 'Código inválido.'; this.carregando = false; this.cdr.markForCheck(); }
    });
  }

  cadastrar(): void {
    this.erro = '';
    const { razaoSocial, nomeResponsavel, senha } = this.form;
    if (!nomeResponsavel.trim()) { this.erro = 'Nome do responsável é obrigatório.'; return; }
    if (senha.length < 6) { this.erro = 'Senha deve ter pelo menos 6 caracteres.'; return; }
    if (this.tipo === 'mudanca') {
      if (this.form.cnpj.replace(/\D/g, '').length !== 14) { this.erro = 'CNPJ deve ter 14 dígitos.'; return; }
      if (!razaoSocial.trim()) { this.erro = 'Razão social é obrigatória.'; return; }
    } else {
      if (!razaoSocial.trim()) { this.erro = 'Informe a razão social desejada.'; return; }
    }

    this.carregando = true; this.cdr.markForCheck();
    const body: any = {
      tipo: this.tipo, email: this.email.trim(),
      cnpj: this.tipo === 'mudanca' ? this.form.cnpj.replace(/\D/g, '') : null,
      razaoSocial: this.form.razaoSocial.trim(),
      nomeFantasia: this.form.nomeFantasia?.trim() || null,
      nomeResponsavel: nomeResponsavel.trim(),
      telefone: this.form.telefone.trim(),
      senha, codigoVerificacao: this.codigo
    };
    this.http.post<{ sucesso: boolean; mensagem: string }>(`${this.api}/Integracao/Cadastrar`, body).subscribe({
      next: (res) => {
        this.msg.success(res.mensagem || 'Cadastro realizado!');
        this.carregando = false;
        this.router.navigate(['/integracao/entrar']);
        this.cdr.markForCheck();
      },
      error: (e) => { this.erro = e.error?.mensagem || 'Erro ao cadastrar.'; this.carregando = false; this.cdr.markForCheck(); }
    });
  }
}
