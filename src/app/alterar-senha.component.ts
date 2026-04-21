import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { environment } from '../environments/environment';
import { LoginService } from './services/login.service';

@Component({
  selector: 'app-alterar-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, NzFormModule, NzInputModule, NzButtonModule, NzAlertModule, NzIconModule],
  template: `
    <div class="login-wrap">
      <div class="login-box">
        <div class="login-logo">
          <img src="/Logo.png" alt="Contfy" class="login-logo-img" />
        </div>
        <h2 class="login-title">Alterar Senha</h2>
        <p class="login-sub">Informe seus dados para redefinir a senha</p>

        <nz-alert
          *ngIf="errorMessage"
          nzType="error"
          [nzMessage]="errorMessage"
          nzShowIcon
          class="alert-margin">
        </nz-alert>

        <nz-alert
          *ngIf="successMessage"
          nzType="success"
          [nzMessage]="successMessage"
          nzShowIcon
          class="alert-margin">
        </nz-alert>

        <form nz-form nzLayout="vertical" (ngSubmit)="alterar()">
          <nz-form-item>
            <nz-form-label>E-mail / Usuário</nz-form-label>
            <nz-form-control>
              <nz-input-group [nzPrefix]="prefixUser">
                <input
                  nz-input
                  name="email"
                  [(ngModel)]="email"
                  placeholder="seu@email.com"
                  autocomplete="username"
                  [disabled]="loading" />
              </nz-input-group>
              <ng-template #prefixUser><span nz-icon nzType="user"></span></ng-template>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Nova Senha</nz-form-label>
            <nz-form-control>
              <nz-input-group [nzPrefix]="prefixLock1" [nzSuffix]="suffixEye1">
                <input
                  nz-input
                  [type]="showSenha ? 'text' : 'password'"
                  name="senha"
                  [(ngModel)]="senha"
                  placeholder="Mín. 6 caracteres"
                  autocomplete="new-password"
                  [disabled]="loading" />
              </nz-input-group>
              <ng-template #prefixLock1><span nz-icon nzType="lock"></span></ng-template>
              <ng-template #suffixEye1>
                <span nz-icon [nzType]="showSenha ? 'eye-invisible' : 'eye'" class="eye-toggle"
                  (click)="showSenha = !showSenha"></span>
              </ng-template>
            </nz-form-control>
            <div class="senha-hint" *ngIf="senha">
              <span [class.ok]="temMinChars">{{ temMinChars ? '✓' : '✗' }} Mín. 6 caracteres</span>
              <span [class.ok]="temMaiuscula">{{ temMaiuscula ? '✓' : '✗' }} 1 letra maiúscula</span>
              <span [class.ok]="temMinuscula">{{ temMinuscula ? '✓' : '✗' }} 1 letra minúscula</span>
              <span [class.ok]="temNumero">{{ temNumero ? '✓' : '✗' }} 1 número</span>
            </div>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Confirmar Nova Senha</nz-form-label>
            <nz-form-control>
              <nz-input-group [nzPrefix]="prefixLock2" [nzSuffix]="suffixEye2">
                <input
                  nz-input
                  [type]="showConfirma ? 'text' : 'password'"
                  name="confirma"
                  [(ngModel)]="confirma"
                  placeholder="Repita a nova senha"
                  autocomplete="new-password"
                  [disabled]="loading" />
              </nz-input-group>
              <ng-template #prefixLock2><span nz-icon nzType="lock"></span></ng-template>
              <ng-template #suffixEye2>
                <span nz-icon [nzType]="showConfirma ? 'eye-invisible' : 'eye'" class="eye-toggle"
                  (click)="showConfirma = !showConfirma"></span>
              </ng-template>
            </nz-form-control>
            <div class="senha-hint" *ngIf="confirma">
              <span [class.ok]="senhasIguais">{{ senhasIguais ? '✓' : '✗' }} Senhas coincidem</span>
            </div>
          </nz-form-item>

          <div class="actions">
            <button nz-button nzType="default" type="button" (click)="irParaLogin()" [disabled]="loading">Voltar ao Login</button>
            <button nz-button nzType="primary" type="submit" class="primary-btn" [nzLoading]="loading">Alterar Senha</button>
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
    `.login-logo { text-align: center; margin-bottom: 16px; }`,
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
    `.senha-hint {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
      font-size: 12px;
      color: #ff4d4f;
    }`,
    `.senha-hint span { transition: color .2s; }`,
    `.senha-hint span.ok { color: #52c41a; }`,
    `@media (max-width: 480px) {
      .login-box { padding: 24px 18px; border-radius: 12px; }
      .login-title { font-size: 1.2rem; }
    }`
  ]
})
export class AlterarSenhaComponent {
  email = '';
  senha = '';
  confirma = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  showSenha = false;
  showConfirma = false;

  get temMinChars(): boolean { return this.senha.length >= 6; }
  get temMaiuscula(): boolean { return /[A-Z]/.test(this.senha); }
  get temMinuscula(): boolean { return /[a-z]/.test(this.senha); }
  get temNumero(): boolean { return /[0-9]/.test(this.senha); }
  get senhaValida(): boolean { return this.temMinChars && this.temMaiuscula && this.temMinuscula && this.temNumero; }
  get senhasIguais(): boolean { return this.senha === this.confirma && this.confirma.length > 0; }

  constructor(private http: HttpClient, private router: Router, private loginService: LoginService) {}

  alterar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Informe o e-mail ou usuário.';
      return;
    }
    if (!this.senhaValida) {
      this.errorMessage = 'A senha não atende aos requisitos mínimos.';
      return;
    }
    if (!this.senhasIguais) {
      this.errorMessage = 'As senhas não coincidem.';
      return;
    }

    this.loading = true;
    const url = `${environment.apiUrl}/Autenticacao/AlterarSenha/${encodeURIComponent(this.email.trim())}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json-patch+json', accept: 'text/plain' });

    this.http.put(url, { novaSenha: this.senha }, { headers, responseType: 'text' }).subscribe({
      next: () => {
        this.successMessage = 'Senha alterada com sucesso! Entrando...';
        this.loginService.autenticar({ username: this.email.trim(), password: this.senha }).subscribe({
          next: (res) => {
            this.loading = false;
            if (res?.token) {
              this.loginService.salvarSessao(res);
            }
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.loading = false;
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        this.loading = false;
        const raw = err?.error;
        const msg: string = (typeof raw === 'string' ? raw : (raw?.message || raw?.title || ''));
        const normalized = msg.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (normalized.includes('igual') && normalized.includes('senha')) {
          this.errorMessage = 'A nova senha não pode ser igual à senha atual. Escolha uma senha diferente.';
        } else if (err?.status === 404) {
          this.errorMessage = 'Usuário não encontrado.';
        } else {
          this.errorMessage = msg || 'Erro ao alterar a senha. Tente novamente.';
        }
      }
    });
  }

  irParaLogin(): void {
    this.router.navigate(['/login']);
  }
}
