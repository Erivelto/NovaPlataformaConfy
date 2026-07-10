import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ContratacaoService } from './contratacao.service';

@Component({
  selector: 'app-contratacao-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NzFormModule, NzInputModule, NzButtonModule, NzAlertModule, NzSpinModule],
  template: `
    <nz-alert *ngIf="erro" nzType="error" [nzMessage]="erro" nzShowIcon style="margin-bottom:16px"></nz-alert>

    <form nz-form nzLayout="vertical" (ngSubmit)="enviar()">
      <nz-form-item>
        <nz-form-label>CNPJ</nz-form-label>
        <nz-form-control>
          <input nz-input name="cnpj" [(ngModel)]="cnpj" placeholder="00.000.000/0000-00" [disabled]="enviando" required />
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>{{ nomeLabel }}</nz-form-label>
        <nz-form-control>
          <input nz-input name="nome" [(ngModel)]="nome" [placeholder]="nomePlaceholder" [disabled]="enviando" required />
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>E-mail</nz-form-label>
        <nz-form-control>
          <input nz-input type="email" name="email" [(ngModel)]="email" placeholder="seu@email.com" [disabled]="enviando" required />
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Celular / WhatsApp</nz-form-label>
        <nz-form-control>
          <input nz-input name="celular" [(ngModel)]="celular" placeholder="(11) 99999-9999" [disabled]="enviando" required />
        </nz-form-control>
      </nz-form-item>

      <button nz-button nzType="primary" type="submit" [nzLoading]="enviando" style="width:100%;margin-top:8px">
        {{ submitLabel }}
      </button>
    </form>
  `,
})
export class ContratacaoFormComponent {
  @Input() titulo = '';
  @Input() plano = '1';
  @Input() nomeLabel = 'Razão social';
  @Input() nomePlaceholder = 'Nome da empresa';
  @Input() submitLabel = 'Enviar solicitação';

  cnpj = '';
  nome = '';
  email = '';
  celular = '';
  enviando = false;
  erro = '';

  constructor(private contratacao: ContratacaoService, private router: Router) {}

  enviar(): void {
    this.erro = '';
    if (!this.cnpj.trim() || !this.nome.trim() || !this.email.trim() || !this.celular.trim()) {
      this.erro = 'Preencha todos os campos.';
      return;
    }

    this.enviando = true;
    this.contratacao.cadastrar({
      cnpj: this.cnpj.trim(),
      nome: this.nome.trim(),
      email: this.email.trim(),
      celular: this.celular.trim(),
      plano: this.plano,
    }).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/contratar/sucesso'], { queryParams: { email: this.email.trim() } });
      },
      error: (err) => {
        this.enviando = false;
        this.erro = err?.error?.message || err?.error || 'Não foi possível enviar. Tente novamente ou fale conosco pelo WhatsApp.';
      },
    });
  }
}
