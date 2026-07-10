import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { LoginService } from './services/login.service';
import { siteHomeUrl } from './public/external-links';

const REMEMBER_KEY = 'contfy_remembered_user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NzFormModule, NzInputModule, NzButtonModule, NzAlertModule, NzSpinModule, NzIconModule, NzCheckboxModule],
  template: `
    <div class="login-wrap">
      <div class="login-box">
        <div class="login-logo">
          <img src="/Logo.png" alt="Contfy" class="login-logo-img" />
        </div>
        <h2 class="login-title">Seja bem-vindo à Contfy!</h2>
        <p class="login-sub">Acesse sua conta para continuar</p>
        <p class="login-back"><a [href]="siteHomeUrl">← Voltar ao site institucional</a></p>

        <nz-alert
          *ngIf="errorMessage"
          nzType="error"
          [nzMessage]="errorMessage"
          nzShowIcon
          class="alert-margin"
        ></nz-alert>

        <form nz-form nzLayout="vertical" (ngSubmit)="login()">
          <nz-form-item>
            <nz-form-label>E-mail / Usuário</nz-form-label>
            <nz-form-control nzErrorTip="Informe seu e-mail ou usuário">
              <nz-input-group [nzPrefix]="prefixUser">
                <input
                  nz-input
                  name="username"
                  [(ngModel)]="username"
                  placeholder="seu@email.com"
                  autocomplete="username"
                  [disabled]="loading"
                />
              </nz-input-group>
              <ng-template #prefixUser><span nz-icon nzType="user"></span></ng-template>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Senha</nz-form-label>
            <nz-form-control nzErrorTip="Informe sua senha">
              <nz-input-group [nzPrefix]="prefixLock" [nzSuffix]="suffixEye">
                <input
                  nz-input
                  [type]="showPassword ? 'text' : 'password'"
                  name="password"
                  [(ngModel)]="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  [disabled]="loading"
                />
              </nz-input-group>
              <ng-template #prefixLock><span nz-icon nzType="lock"></span></ng-template>
              <ng-template #suffixEye>
                <span
                  nz-icon
                  [nzType]="showPassword ? 'eye-invisible' : 'eye'"
                  class="eye-toggle"
                  (click)="showPassword = !showPassword"
                ></span>
              </ng-template>
            </nz-form-control>
          </nz-form-item>

          <div class="remember-row">
            <label nz-checkbox [(ngModel)]="rememberMe" name="rememberMe">Lembrar meu login</label>
            <a (click)="irParaAlterarSenha()">Esqueci minha senha</a>
          </div>
          <div class="actions">
            <button nz-button nzType="default" type="button" (click)="cancel()" [disabled]="loading">Limpar</button>
            <button nz-button nzType="primary" type="submit" class="primary-btn" [nzLoading]="loading">Entrar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `:host { display: block; height: 100vh; }`,
    `.login-wrap {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
    }`,
    `.login-box {
      width: 100%;
      max-width: 440px;
      background: #fff;
      border-radius: 16px;
      padding: 36px 32px 28px;
      box-shadow: 0 8px 32px rgba(10, 102, 194, 0.18);
    }`,
    `.login-logo {
      text-align: center;
      margin-bottom: 16px;
    }`,
    `.logo-icon {
      font-size: 48px;
    }`,
    `.login-logo-img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(10,102,194,0.15);
      box-shadow: 0 4px 16px rgba(10,102,194,0.2);
    }`,
    `.login-title {
      margin: 0;
      color: var(--primary-color);
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
    }`,
    `.login-sub {
      margin: 6px 0 8px;
      color: rgba(0,0,0,0.5);
      font-size: 0.9rem;
      text-align: center;
    }`,
    `.login-back { margin: 0 0 18px; text-align: center; font-size: .85rem; }
    .login-back a { color: var(--primary-color); text-decoration: none; }
    .login-back a:hover { text-decoration: underline; }`,
    `.alert-margin { margin-bottom: 16px; }`,
    `.actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 8px;
    }`,
    `.primary-btn {
      flex: 1;
      background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
      border: none;
      color: #fff;
      font-weight: 600;
    }`,
    `.eye-toggle { cursor: pointer; color: rgba(0,0,0,0.45); }`,
    `.remember-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      font-size: 13px;
    }
    .remember-row a { color: var(--primary-color); cursor: pointer; }
    .remember-row a:hover { text-decoration: underline; }`,
    `@media (max-width: 480px) {
      .login-box { padding: 24px 18px; border-radius: 12px; }
      .login-title { font-size: 1.2rem; }
    }`
  ]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  loading = false;
  errorMessage = '';
  showPassword = false;
  rememberMe = false;
  readonly siteHomeUrl = siteHomeUrl;

  constructor(private router: Router, private loginService: LoginService) {}

  ngOnInit(): void {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      this.username = saved;
      this.rememberMe = true;
    }
  }

  login(): void {
    this.errorMessage = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Preencha o e-mail/usuário e a senha.';
      return;
    }

    if (this.rememberMe) {
      localStorage.setItem(REMEMBER_KEY, this.username.trim());
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    this.loading = true;
    this.loginService.autenticar({ username: this.username.trim(), password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.token) {
          this.loginService.salvarSessao(res);
        }
        const destino = this.loginService.isAdmin() ? '/administrativo' : '/dashboard';
        this.router.navigate([destino]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message ||
          err?.error?.title ||
          (err?.status === 401 ? 'Usuário ou senha inválidos.' : 'Erro ao conectar. Tente novamente.');
      }
    });
  }

  cancel(): void {
    this.username = '';
    this.password = '';
    this.errorMessage = '';
    this.rememberMe = false;
    localStorage.removeItem(REMEMBER_KEY);
  }

  irParaAlterarSenha(): void {
    this.router.navigate(['/alterar-senha']);
  }
}
