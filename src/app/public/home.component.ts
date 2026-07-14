import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import {
  FAQ_ITEMS,
  FUNNEL_STEPS,
  HERO_COPY,
  MEDIA,
  PLAN_CARDS,
  PLATFORM_FEATURES,
  SITE,
  TRUST_ITEMS,
  WHY_CONTFY,
} from './site.constants';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzCollapseModule, NzIconModule, NzTagModule],
  template: `
    <section class="pub-hero pub-reveal">
      <div class="pub-container pub-hero-grid">
        <div>
          <nz-tag [nzColor]="'blue'">{{ site.tagline }}</nz-tag>
          <h1>{{ hero.headline }}</h1>
          <p class="pub-lead">{{ hero.lead }}</p>
          <p class="pub-lead-sub">{{ hero.support }}</p>
          <div class="pub-hero-actions">
            <button nz-button nzType="primary" nzSize="large" routerLink="/abrir-empresa">Abrir minha empresa</button>
            <button nz-button nzSize="large" routerLink="/mudar-contador">Mudar de contador</button>
          </div>
          <div class="pub-hero-tags">
            <span><i nz-icon nzType="check"></i> Sem burocracia</span>
            <span><i nz-icon nzType="check"></i> 100% online</span>
            <span><i nz-icon nzType="check"></i> Suporte humano</span>
          </div>
        </div>
        <div class="pub-hero-visual" aria-hidden="true">
          <div class="pub-hero-frame">
            <img class="pub-hero-decor" [src]="media.heroDecor" alt="" width="1024" height="1024" fetchpriority="high" />
            <img class="pub-hero-person" [src]="media.heroPerson" alt="Contador especialista Contfy" width="1024" height="1024" />
          </div>
        </div>
      </div>
    </section>

    <section class="pub-trust pub-section-compact">
      <div class="pub-container pub-trust-grid">
        <div *ngFor="let item of trustItems" class="pub-trust-item">{{ item }}</div>
      </div>
    </section>

    <section id="como-funciona" class="pub-section pub-reveal">
      <div class="pub-container">
        <div class="pub-section-intro">
          <h2>Como funciona o atendimento</h2>
          <p class="pub-section-lead">
            Antes de escolher um plano, entenda o caminho: você solicita online, a Contfy analisa seu perfil
            e conduz abertura ou mudança de contador até o acesso à plataforma.
          </p>
        </div>
        <div class="pub-steps pub-steps-compact">
          <div *ngFor="let step of funnelSteps; let i = index" class="pub-step">
            <div class="pub-step-num">{{ i + 1 }}</div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.desc }}</p>
          </div>
        </div>
        <div class="pub-hero-actions pub-section-cta">
          <button nz-button nzType="primary" routerLink="/como-funciona" [queryParams]="{ tipo: 'abertura' }">Fluxo de abertura</button>
          <button nz-button routerLink="/como-funciona" [queryParams]="{ tipo: 'mudanca' }">Fluxo de mudança de contador</button>
        </div>
      </div>
    </section>

    <section id="por-que-contfy" class="pub-section pub-section-alt pub-reveal">
      <div class="pub-container">
        <div class="pub-section-intro">
          <h2>Por que escolher a Contfy</h2>
          <p class="pub-section-lead">
            Combinamos plataforma digital com acompanhamento de especialistas — para você ganhar clareza,
            agilidade e segurança na rotina contábil.
          </p>
        </div>
        <div class="pub-why-grid">
          <article *ngFor="let item of whyItems" class="pub-why-card">
            <div class="pub-why-icon"><i nz-icon [nzType]="item.icon"></i></div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="plataforma" class="pub-section pub-reveal">
      <div class="pub-container pub-platform-grid">
        <div>
          <div class="pub-section-head">
            <div>
              <h2>Sua contabilidade na palma da mão</h2>
              <p class="pub-section-lead pub-section-lead--tight">
                Tudo que você precisa para acompanhar notas, impostos, documentos e solicitações — sem sair da plataforma Contfy.
              </p>
            </div>
            <a nz-button nzType="primary" class="pub-link-btn" routerLink="/plataforma">Ver demonstração</a>
          </div>
          <div class="pub-features">
            <div *ngFor="let f of features" class="pub-feature-card">
              <strong>{{ f.title }}</strong>
              <p>{{ f.desc }}</p>
            </div>
          </div>
        </div>
        <div class="pub-platform-visual">
          <div class="pub-platform-frame">
            <img [src]="media.startup" alt="Equipe usando a plataforma Contfy" width="1024" height="731" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <section id="planos" class="pub-section pub-section-alt pub-reveal">
      <div class="pub-container">
        <div class="pub-section-intro pub-section-intro--center">
          <h2>Planos e serviços</h2>
          <p class="pub-section-lead">
            Depois de conhecer como trabalhamos, escolha o serviço ideal para o momento da sua empresa.
            Todos incluem acompanhamento da equipe Contfy.
          </p>
        </div>
        <div class="pub-plans">
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
            <button
              nz-button
              [nzType]="plan.ctaType"
              class="pub-plan-cta"
              [routerLink]="plan.ctaLink"
            >{{ plan.ctaLabel }}</button>
          </article>
        </div>
      </div>
    </section>

    <section id="faq" class="pub-section pub-reveal">
      <div class="pub-container pub-faq">
        <div class="pub-section-intro">
          <h2>Perguntas frequentes</h2>
          <p class="pub-section-lead">
            Respostas às principais dúvidas sobre abertura, mudança de contador, plataforma e atendimento.
          </p>
        </div>
        <nz-collapse>
          <nz-collapse-panel *ngFor="let item of faq" [nzHeader]="item.q">
            <p>{{ item.a }}</p>
          </nz-collapse-panel>
        </nz-collapse>
      </div>
    </section>

    <section class="pub-cta-band pub-reveal">
      <div class="pub-container pub-cta-inner">
        <h2>Pronto para simplificar sua contabilidade?</h2>
        <p>Fale com a equipe Contfy ou comece sua solicitação online agora mesmo.</p>
        <div class="pub-hero-actions pub-cta-actions">
          <button nz-button nzType="primary" nzSize="large" routerLink="/abrir-empresa">Começar agora</button>
          <a nz-button nzSize="large" [href]="whatsappUrl" target="_blank" rel="noopener">Falar no WhatsApp</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .pub-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }
    .pub-hero {
      padding: 36px 0 28px;
      background: linear-gradient(180deg, #eef4fb 0%, #f4f8fc 100%);
      display: flex;
      align-items: center;
    }
    .pub-hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 520px);
      gap: 36px;
      align-items: center;
      width: 100%;
    }
    .pub-hero h1 {
      font-size: clamp(1.85rem, 4vw, 2.55rem);
      line-height: 1.12;
      margin: 12px 0 10px;
      color: var(--primary-color);
    }
    .pub-lead {
      color: rgba(26, 26, 46, .78);
      font-size: 1.06rem;
      line-height: 1.65;
      max-width: 580px;
      margin: 0 0 10px;
    }
    .pub-lead-sub {
      color: rgba(26, 26, 46, .62);
      font-size: .94rem;
      line-height: 1.55;
      max-width: 580px;
      margin: 0;
    }
    .pub-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 22px; }
    .pub-hero-tags {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-top: 18px;
      color: rgba(26, 26, 46, .58);
      font-size: .86rem;
    }
    .pub-hero-tags span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .pub-hero-tags i { color: var(--primary-color); font-size: .78rem; }
    .pub-hero-visual { display: flex; justify-content: flex-end; align-items: flex-end; width: 100%; }
    .pub-hero-frame {
      position: relative;
      width: 100%;
      max-width: 520px;
      aspect-ratio: 605 / 523;
      max-height: 440px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      overflow: hidden;
    }
    .pub-hero-decor {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center bottom;
      opacity: 0.28;
      pointer-events: none;
    }
    .pub-hero-person {
      position: relative;
      z-index: 1;
      width: 88%;
      max-width: 460px;
      height: auto;
      max-height: 92%;
      object-fit: contain;
      object-position: center bottom;
    }
    .pub-trust {
      padding: 20px 0;
      background: #fff;
      border-bottom: 1px solid rgba(11, 61, 145, .06);
    }
    .pub-trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .pub-trust-item {
      text-align: center;
      padding: 12px 10px;
      background: #f4f8fc;
      border-radius: 8px;
      font-size: .86rem;
      font-weight: 600;
      color: var(--primary-color);
    }
    .pub-section { padding: var(--pub-section-py, 52px) 0; }
    .pub-section-compact { padding: var(--pub-section-py-compact, 24px) 0; }
    .pub-section-alt { background: #fff; }
    .pub-section h2 {
      color: var(--primary-color);
      margin: 0 0 10px;
      font-size: clamp(1.45rem, 3vw, 1.85rem);
    }
    .pub-section-intro { margin-bottom: 28px; max-width: 720px; }
    .pub-section-intro--center { margin-left: auto; margin-right: auto; text-align: center; }
    .pub-section-lead {
      margin: 0;
      color: rgba(26, 26, 46, .68);
      line-height: 1.58;
      font-size: 1rem;
    }
    .pub-section-lead--tight { margin-top: 6px; }
    .pub-section-cta { margin-top: 24px; }
    .pub-section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .pub-link-btn { text-decoration: none; display: inline-flex; align-items: center; }
    .pub-why-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .pub-why-card {
      background: #f4f8fc;
      border: 1px solid rgba(11, 61, 145, .08);
      border-radius: 12px;
      padding: 20px;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .pub-why-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(11, 61, 145, .08);
    }
    .pub-why-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      margin-bottom: 12px;
    }
    .pub-why-card strong { display: block; color: #1a1a2e; margin-bottom: 6px; }
    .pub-why-card p { margin: 0; color: rgba(26, 26, 46, .68); font-size: .9rem; line-height: 1.5; }
    .pub-platform-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(280px, 460px);
      gap: 36px;
      align-items: center;
    }
    .pub-platform-visual { display: flex; justify-content: center; align-items: center; }
    .pub-platform-frame {
      width: 100%;
      max-width: 460px;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      border-radius: 12px;
      box-shadow: 0 12px 36px rgba(11, 61, 145, .1);
    }
    .pub-platform-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 22%;
      display: block;
    }
    .pub-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .pub-step {
      background: #fff;
      border: 1px solid rgba(11, 61, 145, .1);
      border-radius: 12px;
      padding: 18px;
      transition: border-color .2s ease;
    }
    .pub-step:hover { border-color: rgba(11, 61, 145, .22); }
    .pub-step-num {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--primary-color);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      margin-bottom: 10px;
      font-size: .9rem;
    }
    .pub-step p { margin: 8px 0 0; color: rgba(26, 26, 46, .65); font-size: .88rem; line-height: 1.45; }
    .pub-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .pub-feature-card {
      background: #f4f8fc;
      border-radius: 10px;
      padding: 16px;
      border: 1px solid rgba(11, 61, 145, .08);
      transition: background .2s ease;
    }
    .pub-feature-card:hover { background: #eef4fb; }
    .pub-feature-card p { margin: 6px 0 0; color: rgba(26, 26, 46, .65); font-size: .9rem; line-height: 1.45; }
    .pub-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; align-items: stretch; }
    .pub-plan-card {
      background: #fff;
      border: 1px solid rgba(11, 61, 145, .1);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: box-shadow .2s ease, transform .2s ease;
    }
    .pub-plan-card:hover { box-shadow: 0 8px 28px rgba(11, 61, 145, .08); }
    .pub-plan-featured {
      border: 2px solid var(--primary-color);
      box-shadow: 0 10px 32px rgba(11, 61, 145, .1);
      transform: scale(1.02);
    }
    .pub-plan-desc { color: rgba(26, 26, 46, .72); font-size: .92rem; line-height: 1.5; margin: 0; }
    .pub-plan-price { font-size: 1.85rem; font-weight: 800; color: var(--primary-color); line-height: 1; }
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
      color: rgba(26, 26, 46, .82);
      font-size: .88rem;
      line-height: 1.4;
    }
    .pub-plan-benefits i { color: var(--primary-color); margin-top: 3px; flex-shrink: 0; font-size: .85rem; }
    .pub-plan-cta { margin-top: auto; }
    .pub-cta-band {
      background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
      color: #fff;
      padding: 44px 0;
    }
    .pub-cta-inner { text-align: center; }
    .pub-cta-inner h2 { color: #fff; margin-bottom: 10px; }
    .pub-cta-inner p { margin: 0 0 20px; opacity: .92; font-size: 1rem; }
    .pub-cta-actions { justify-content: center; }
    .pub-faq { max-width: 800px; }
    @media (max-width: 900px) {
      .pub-hero { padding: 28px 0 22px; }
      .pub-hero-grid, .pub-features, .pub-plans, .pub-platform-grid, .pub-why-grid { grid-template-columns: 1fr; }
      .pub-hero-visual { justify-content: center; }
      .pub-hero-frame { max-width: 400px; max-height: 320px; margin: 0 auto; }
      .pub-platform-visual { order: -1; }
      .pub-plan-featured { transform: none; }
    }
    @media (max-width: 768px) {
      .pub-container { padding: 0 16px; }
      .pub-steps-compact { grid-template-columns: repeat(2, 1fr); }
      .pub-trust-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .pub-steps-compact, .pub-trust-grid, .pub-why-grid { grid-template-columns: 1fr; }
      .pub-hero-frame { max-width: 100%; max-height: 280px; }
    }
  `]
})
export class HomeComponent {
  readonly site = SITE;
  readonly media = MEDIA;
  readonly hero = HERO_COPY;
  readonly trustItems = TRUST_ITEMS;
  readonly funnelSteps = FUNNEL_STEPS;
  readonly whyItems = WHY_CONTFY;
  readonly features = PLATFORM_FEATURES;
  readonly plans = PLAN_CARDS;
  readonly faq = FAQ_ITEMS;
  readonly whatsappUrl = `https://wa.me/${SITE.whatsapp}`;
}
