import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { SITE } from './site.constants';

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzCardModule, NzTagModule],
  template: `
    <section class="pub-page-hero">
      <div class="pub-container">
        <h1>Planos e serviços</h1>
        <p>Escolha o serviço ideal para o momento da sua empresa.</p>
      </div>
    </section>
    <section class="pub-section">
      <div class="pub-container pub-plans-page">
        <nz-card>
          <h3>Abertura de empresa</h3>
          <p>Constituição com suporte completo, orientação documental e acompanhamento da equipe Contfy.</p>
          <button nz-button nzType="primary" routerLink="/abrir-empresa">Solicitar abertura</button>
        </nz-card>
        <nz-card class="featured">
          <nz-tag nzColor="blue">Mais popular</nz-tag>
          <h3>Plano Básico — {{ site.planoBasicoValor }}/mês</h3>
          <p>Empresa de serviço no Simples Nacional, até 2 sócios, sem funcionário.</p>
          <button nz-button nzType="primary" routerLink="/mudar-contador">Contratar agora</button>
        </nz-card>
        <nz-card>
          <h3>Mudança de contador</h3>
          <p>Troca segura para a Contfy com onboarding e acesso à plataforma digital.</p>
          <button nz-button nzType="default" routerLink="/mudar-contador">Mudar de contador</button>
        </nz-card>
      </div>
    </section>
  `,
  styles: [`
    .pub-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .pub-page-hero { padding: 40px 0 20px; background: #eef4fb; }
    .pub-page-hero h1 { color: var(--primary-color); margin: 0 0 8px; }
    .pub-section { padding: 32px 0 48px; }
    .pub-plans-page { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .featured { border: 2px solid var(--primary-color) !important; }
    @media (max-width: 900px) { .pub-plans-page { grid-template-columns: 1fr; } }
  `]
})
export class PlanosComponent {
  readonly site = SITE;
}
