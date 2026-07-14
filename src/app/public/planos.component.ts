import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PLAN_CARDS } from './site.constants';

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzIconModule, NzTagModule],
  template: `
    <section class="pub-page-hero">
      <div class="pub-container">
        <h1>Planos e serviços</h1>
        <p>Escolha o serviço ideal para o momento da sua empresa. Todos incluem acompanhamento da equipe Contfy.</p>
      </div>
    </section>
    <section class="pub-section">
      <div class="pub-container pub-plans-page">
        <article
          *ngFor="let plan of plans"
          class="pub-plan-card"
          [class.pub-plan-featured]="plan.featured"
        >
          <nz-tag *ngIf="plan.badge" nzColor="blue">{{ plan.badge }}</nz-tag>
          <h3>{{ plan.title }}</h3>
          <div *ngIf="plan.price" class="pub-plan-price">
            {{ plan.price }}<small>{{ plan.priceSuffix }}</small>
          </div>
          <p class="pub-plan-desc">{{ plan.description }}</p>
          <ul class="pub-plan-benefits">
            <li *ngFor="let benefit of plan.benefits">
              <i nz-icon nzType="check-circle" nzTheme="fill"></i>
              <span>{{ benefit }}</span>
            </li>
          </ul>
          <button nz-button [nzType]="plan.ctaType" class="pub-plan-cta" [routerLink]="plan.ctaLink">
            {{ plan.ctaLabel }}
          </button>
        </article>
      </div>
      <div class="pub-container pub-plans-footer">
        <p>Ainda com dúvidas? <a routerLink="/" fragment="faq">Veja o FAQ</a> ou <a routerLink="/contato">fale com a equipe</a>.</p>
      </div>
    </section>
  `,
  styles: [`
    .pub-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .pub-page-hero { padding: 36px 0 20px; background: #eef4fb; }
    .pub-page-hero h1 { color: var(--primary-color); margin: 0 0 8px; }
    .pub-page-hero p { margin: 0; max-width: 640px; color: rgba(26,26,46,.72); line-height: 1.55; }
    .pub-section { padding: 40px 0 48px; }
    .pub-plans-page {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      align-items: stretch;
    }
    .pub-plan-card {
      background: #fff;
      border: 1px solid rgba(11,61,145,.1);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .pub-plan-featured {
      border: 2px solid var(--primary-color);
      box-shadow: 0 10px 32px rgba(11,61,145,.1);
    }
    .pub-plan-desc { color: rgba(26,26,46,.72); font-size: .92rem; line-height: 1.5; margin: 0; }
    .pub-plan-price { font-size: 1.85rem; font-weight: 800; color: var(--primary-color); }
    .pub-plan-price small { font-size: .9rem; font-weight: 500; }
    .pub-plan-benefits {
      list-style: none;
      margin: 4px 0 8px;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    .pub-plan-benefits li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: .88rem;
      line-height: 1.4;
      color: rgba(26,26,46,.82);
    }
    .pub-plan-benefits i { color: var(--primary-color); margin-top: 3px; flex-shrink: 0; }
    .pub-plan-cta { margin-top: auto; }
    .pub-plans-footer {
      margin-top: 28px;
      text-align: center;
      color: rgba(26,26,46,.68);
      font-size: .95rem;
    }
    .pub-plans-footer a { color: var(--primary-color); text-decoration: none; font-weight: 600; }
    .pub-plans-footer a:hover { text-decoration: underline; }
    @media (max-width: 900px) { .pub-plans-page { grid-template-columns: 1fr; } }
  `]
})
export class PlanosComponent {
  readonly plans = PLAN_CARDS;
}
