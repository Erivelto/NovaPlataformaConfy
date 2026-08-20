import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { environment } from '../../environments/environment';

interface LoginLeadResponse {
  sucesso: boolean;
  mensagem: string;
  dados: { token: string; nomeResponsavel: string; razaoSocial: string; status: string; leadId: number; };
}

@Component({
  selector: 'app-integracao-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, HttpClientModule,
    NzButtonModule, NzFormModule, NzInputModule,
    NzSpinModule, NzIconModule, NzAlertModule, RouterLink],
  template: `
<div class="login-wrap">
  <div class="login-box">
    <div class="login-logo">
      <img src="/Logo.png" alt="Contfy" class="login-logo-img">
    </div>
    <h2 class="login-title">Portal de Integração</h2>
    <p class="login-sub">Acompanhe o andamento do seu cadastro</p>

    <nz-alert *ngIf="erro" nzType="error" [nzMessage]="erro" nzShowIcon class="alert-margin"></nz-alert>

    <form nz-form nzLayout="vertical" (ngSubmit)="entrar()">
      <nz-form-item>
        <nz-form-label>E-mail</nz-form-label>
        <nz-form-control>
          <nz-input-group [nzPrefix]="prefixMail">
            <input nz-input type="email" [(ngModel)]="email" name="email" placeholder="seu@email.com" autocomplete="email">
          </nz-input-group>
          <ng-template #prefixMail><span nz-icon nzType="mail"></span></ng-template>
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Senha</nz-form-label>
        <nz-form-control>
          <nz-input-group [nzPrefix]="prefixLock" [nzSuffix]="suffixEye">
            <input nz-input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="senha" name="senha" placeholder="••••••••" autocomplete="current-password">
          </nz-input-group>
          <ng-template #prefixLock><span nz-icon nzType="lock"></span></ng-template>
          <ng-template #suffixEye>
            <span nz-icon [nzType]="showPassword ? 'eye-invisible' : 'eye'" class="eye-toggle" (click)="showPassword = !showPassword"></span>
          </ng-template>
        </nz-form-control>
      </nz-form-item>
      <div class="actions">
        <button nz-button nzType="primary" nzBlock type="submit" class="primary-btn" [nzLoading]="carregando">Entrar</button>
      </div>
    </form>

    <p class="link-bottom">Ainda não tem cadastro? <a routerLink="/integracao/cadastro">Cadastre-se</a></p>
  </div>
</div>
  `,
  styles: [`
    :host { display:block; height:100vh; }
    .login-wrap { height:100%; display:flex; align-items:center; justify-content:center; padding:24px; background:linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%); }
    .login-box { width:100%; max-width:440px; background:#fff; border-radius:16px; padding:36px 32px 28px; box-shadow:0 8px 32px rgba(10,102,194,.18); }
    .login-logo { text-align:center; margin-bottom:16px; }
    .login-logo-img { width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid rgba(10,102,194,.15); box-shadow:0 4px 16px rgba(10,102,194,.2); }
    .login-title { margin:0; color:var(--primary-color); font-size:1.5rem; font-weight:700; text-align:center; }
    .login-sub { margin:6px 0 16px; color:rgba(0,0,0,.5); font-size:.9rem; text-align:center; }
    .alert-margin { margin-bottom:14px; }
    .actions { margin-top:8px; }
    .primary-btn { background:linear-gradient(90deg, var(--primary-color), var(--primary-light)); border:none; color:#fff; font-weight:600; }
    .link-bottom { text-align:center; margin-top:16px; font-size:13px; color:rgba(0,0,0,.5); }
    .link-bottom a { color:var(--primary-color); }
    .eye-toggle { cursor:pointer; color:rgba(0,0,0,.45); }
    @media (max-width:480px) { .login-box { padding:24px 18px; border-radius:12px; } }
  `]
})
export class IntegracaoLoginComponent {
  email = '';
  senha = '';
  carregando = false;
  showPassword = false;
  erro = '';

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient, private msg: NzMessageService, private router: Router, private cdr: ChangeDetectorRef) {}

  entrar(): void {
    this.erro = '';
    if (!this.email.trim() || !this.senha) { this.erro = 'Informe e-mail e senha.'; return; }
    this.carregando = true; this.cdr.markForCheck();

    this.http.post<LoginLeadResponse>(`${this.api}/Integracao/Login`, { email: this.email.trim(), senha: this.senha }).subscribe({
      next: (res) => {
        if (res.sucesso && res.dados?.token) {
          localStorage.setItem('integracao_token', res.dados.token);
          localStorage.setItem('integracao_lead', JSON.stringify(res.dados));
          console.log('[Integração] Login OK, token salvo:', res.dados.token?.substring(0, 30) + '...');
          this.router.navigate(['/integracao/painel']);
        } else {
          this.erro = res.mensagem || 'Erro ao entrar.';
        }
        this.carregando = false; this.cdr.markForCheck();
      },
      error: (e) => {
        this.erro = e.error?.mensagem || 'E-mail ou senha inválidos.';
        this.carregando = false; this.cdr.markForCheck();
      }
    });
  }
}
