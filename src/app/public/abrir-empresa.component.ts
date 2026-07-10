import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { ContratacaoFormComponent } from './contratacao-form.component';

@Component({
  selector: 'app-abrir-empresa',
  standalone: true,
  imports: [CommonModule, NzCardModule, ContratacaoFormComponent],
  template: `
    <section class="pub-page-hero"><div class="pub-container"><h1>Abrir minha empresa</h1><p>Preencha o formulário e nossa equipe entrará em contato.</p></div></section>
    <section class="pub-section"><div class="pub-container pub-form-wrap"><nz-card><app-contratacao-form plano="2" nomeLabel="Nome / Razão social" submitLabel="Solicitar abertura de empresa" /></nz-card></div></section>
  `,
  styles: [`
    .pub-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .pub-page-hero { padding: 40px 0 20px; background: #eef4fb; }
    .pub-page-hero h1 { color: var(--primary-color); margin: 0 0 8px; }
    .pub-section { padding: 32px 0 48px; }
    .pub-form-wrap { max-width: 520px; }
  `]
})
export class AbrirEmpresaComponent {}

@Component({
  selector: 'app-mudar-contador',
  standalone: true,
  imports: [CommonModule, NzCardModule, ContratacaoFormComponent],
  template: `
    <section class="pub-page-hero"><div class="pub-container"><h1>Mudar de contador</h1><p>Faça a transição para a Contfy com segurança e agilidade.</p></div></section>
    <section class="pub-section"><div class="pub-container pub-form-wrap"><nz-card><app-contratacao-form plano="1" submitLabel="Solicitar mudança de contador" /></nz-card></div></section>
  `,
  styles: [`
    .pub-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .pub-page-hero { padding: 40px 0 20px; background: #eef4fb; }
    .pub-page-hero h1 { color: var(--primary-color); margin: 0 0 8px; }
    .pub-section { padding: 32px 0 48px; }
    .pub-form-wrap { max-width: 520px; }
  `]
})
export class MudarContadorComponent {}
