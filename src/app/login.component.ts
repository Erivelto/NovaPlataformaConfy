import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { LoginService } from './services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NzFormModule, NzInputModule, NzButtonModule, NzAlertModule, NzSpinModule, NzIconModule],
  template: `
    <div class="login-wrap">
      <div class="login-box">
        <div class="login-logo">
          <img src="/Logo.png" alt="Contfy" class="login-logo-img" />
        </div>
        <h2 class="login-title">Seja bem-vindo à Contfy!</h2>
        <p class="login-sub">Acesse sua conta para continuar</p>

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
      background: linear-gradient(135deg, #0a66c2 0%, #5fb1ff 100%);
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
      color: #0a66c2;
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
    }`,
    `.login-sub {
      margin: 6px 0 22px;
      color: rgba(0,0,0,0.5);
      font-size: 0.9rem;
      text-align: center;
    }`,
    `.alert-margin { margin-bottom: 16px; }`,
    `.actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 8px;
    }`,
    `.primary-btn {
      flex: 1;
      background: linear-gradient(90deg, #0a66c2, #5fb1ff);
      border: none;
      color: #fff;
      font-weight: 600;
    }`,
    `.eye-toggle { cursor: pointer; color: rgba(0,0,0,0.45); }`,
    `@media (max-width: 480px) {
      .login-box { padding: 24px 18px; border-radius: 12px; }
      .login-title { font-size: 1.2rem; }
    }`
  ]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(private router: Router, private loginService: LoginService) {}

  login(): void {
    this.errorMessage = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Preencha o e-mail/usuário e a senha.';
      return;
    }

    this.loading = true;
    this.loginService.autenticar({ username: this.username.trim(), password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.token) {
          this.loginService.salvarSessao(res);
        }
        this.router.navigate(['/dashboard']);
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
  }
}
