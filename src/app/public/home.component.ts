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
  MEDIA,
  PLATFORM_FEATURES,
  SITE,
  TRUST_ITEMS,
} from './site.constants';
import { appLoginUrl } from './external-links';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzCollapseModule, NzIconModule, NzTagModule],
  template: `
    <section class="pub-hero">
      <div class="pub-container pub-hero-grid">
        <div>
          <nz-tag [nzColor]="'blue'">{{ site.tagline }}</nz-tag>
          <h1>Simplifique a contabilidade da sua empresa</h1>
          <p class="pub-lead">
            Abra sua empresa, troque de contador e gerencie NF-e, impostos e documentos em uma plataforma digital —
            com suporte por WhatsApp, telefone e e-mail.
          </p>
          <div class="pub-hero-actions">
            <button nz-button nzType="primary" nzSize="large" routerLink="/abrir-empresa">Abrir minha empresa</button>
            <button nz-button nzSize="large" routerLink="/mudar-contador">Mudar de contador</button>
          </div>
          <div class="pub-hero-tags">
            <span>Sem burocracia</span><span>100% online</span><span>Suporte humano</span>
          </div>
        </div>
        <div class="pub-hero-visual" aria-hidden="true">
          <div class="pub-hero-frame">
            <img
              class="pub-hero-decor"
              [src]="media.heroDecor"
              alt=""
              width="1024"
              height="1024"
              fetchpriority="high"
            />
            <img
              class="pub-hero-person"
              [src]="media.heroPerson"
              alt="Contador especialista Contfy"
              width="1024"
              height="1024"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="pub-trust">
      <div class="pub-container pub-trust-grid">
        <div *ngFor="let item of trustItems" class="pub-trust-item">{{ item }}</div>
      </div>
    </section>

    <section id="como-funciona" class="pub-section">
      <div class="pub-container">
        <h2>Como funciona</h2>
        <div class="pub-steps">
          <div *ngFor="let step of funnelSteps; let i = index" class="pub-step">
            <div class="pub-step-num">{{ i + 1 }}</div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="plataforma" class="pub-section pub-section-alt">
      <div class="pub-container pub-platform-grid">
        <div>
          <div class="pub-section-head">
            <div>
              <h2>Sua contabilidade na palma da mão</h2>
              <p>Tudo que você precisa, sem sair da plataforma Contfy.</p>
            </div>
            <a nz-button nzType="primary" class="pub-link-btn" [href]="appLoginUrl">Conhecer a plataforma</a>
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
            <img
              [src]="media.startup"
              alt="Equipe usando a plataforma Contfy"
              width="1024"
              height="731"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="pub-section">
      <div class="pub-container">
        <h2>Planos e serviços</h2>
        <div class="pub-plans">
          <div class="pub-plan-card">
            <h3>Abertura de empresa</h3>
            <p>Sem burocracia, com suporte completo da equipe Contfy.</p>
            <button nz-button nzType="default" routerLink="/abrir-empresa">Solicitar abertura</button>
          </div>
          <div class="pub-plan-card pub-plan-featured">
            <nz-tag nzColor="blue">Mais popular</nz-tag>
            <h3>Plano Básico</h3>
            <div class="pub-plan-price">{{ site.planoBasicoValor }}<small>/mês</small></div>
            <p>Simples Nacional, até 2 sócios, sem funcionário.</p>
            <button nz-button nzType="primary" routerLink="/mudar-contador">Contratar agora</button>
          </div>
          <div class="pub-plan-card">
            <h3>Mudança de contador</h3>
            <p>Transição segura para a contabilidade digital Contfy.</p>
            <button nz-button nzType="default" routerLink="/mudar-contador">Mudar de contador</button>
          </div>
        </div>
      </div>
    </section>

    <section class="pub-cta-band">
      <div class="pub-container pub-cta-inner">
        <h2>Pronto para simplificar sua contabilidade?</h2>
        <div class="pub-hero-actions">
          <button nz-button nzType="primary" nzSize="large" routerLink="/abrir-empresa">Começar agora</button>
          <a nz-button nzSize="large" [href]="whatsappUrl" target="_blank" rel="noopener">Falar no WhatsApp</a>
        </div>
      </div>
    </section>

    <section class="pub-section">
      <div class="pub-container pub-faq">
        <h2>Perguntas frequentes</h2>
        <nz-collapse>
          <nz-collapse-panel *ngFor="let item of faq" [nzHeader]="item.q">
            <p>{{ item.a }}</p>
          </nz-collapse-panel>
        </nz-collapse>
      </div>
    </section>
  `,
  styles: [`
    .pub-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }
    .pub-hero {
      padding: 40px 0 24px;
      background: linear-gradient(180deg, #eef4fb 0%, #f4f8fc 100%);
      min-height: 560px;
      display: flex;
      align-items: center;
    }
    .pub-hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 605px);
      gap: 40px;
      align-items: center;
      width: 100%;
    }
    .pub-hero h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); line-height: 1.15; margin: 12px 0; color: var(--primary-color); }
    .pub-lead { color: rgba(26,26,46,.72); font-size: 1.05rem; line-height: 1.6; max-width: 560px; }
    .pub-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
    .pub-hero-tags { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 16px; color: rgba(26,26,46,.55); font-size: .88rem; }
    .pub-hero-visual {
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      width: 100%;
    }
    .pub-hero-frame {
      position: relative;
      width: 100%;
      max-width: 605px;
      aspect-ratio: 605 / 523;
      max-height: 523px;
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
      max-width: 520px;
      height: auto;
      max-height: 92%;
      object-fit: contain;
      object-position: center bottom;
    }
    .pub-trust { padding: 18px 0; background: #fff; border-bottom: 1px solid rgba(11,61,145,.06); }
    .pub-trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .pub-trust-item { text-align: center; padding: 12px; background: #f4f8fc; border-radius: 8px; font-size: .88rem; font-weight: 600; color: var(--primary-color); }
    .pub-section { padding: 48px 0; }
    .pub-section-alt { background: #fff; }
    .pub-section h2 { color: var(--primary-color); margin-bottom: 24px; }
    .pub-section-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .pub-link-btn { text-decoration: none; display: inline-flex; align-items: center; }
    .pub-platform-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(280px, 480px); gap: 40px; align-items: center; }
    .pub-platform-visual { display: flex; justify-content: center; align-items: center; }
    .pub-platform-frame {
      width: 100%;
      max-width: 480px;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      border-radius: 12px;
      box-shadow: 0 12px 36px rgba(11,61,145,.1);
    }
    .pub-platform-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 22%;
      display: block;
    }
    .pub-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .pub-step { background: #fff; border: 1px solid rgba(11,61,145,.1); border-radius: 10px; padding: 16px; }
    .pub-step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary-color); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 8px; }
    .pub-step p { margin: 6px 0 0; color: rgba(26,26,46,.65); font-size: .9rem; }
    .pub-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .pub-feature-card { background: #f4f8fc; border-radius: 10px; padding: 16px; border: 1px solid rgba(11,61,145,.08); }
    .pub-feature-card p { margin: 6px 0 0; color: rgba(26,26,46,.65); font-size: .9rem; }
    .pub-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .pub-plan-card { background: #fff; border: 1px solid rgba(11,61,145,.1); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 10px; }
    .pub-plan-featured { border: 2px solid var(--primary-color); box-shadow: 0 8px 24px rgba(11,61,145,.08); }
    .pub-plan-price { font-size: 1.8rem; font-weight: 800; color: var(--primary-color); }
    .pub-plan-price small { font-size: .9rem; font-weight: 500; }
    .pub-cta-band { background: linear-gradient(90deg, var(--primary-color), var(--primary-light)); color: #fff; padding: 48px 0; }
    .pub-cta-inner { text-align: center; }
    .pub-cta-inner h2 { color: #fff; margin-bottom: 16px; }
    .pub-faq { max-width: 760px; }
    @media (max-width: 900px) {
      .pub-hero { min-height: auto; padding: 32px 0 24px; }
      .pub-hero-grid, .pub-steps, .pub-features, .pub-plans, .pub-trust-grid, .pub-platform-grid { grid-template-columns: 1fr; }
      .pub-hero-visual { justify-content: center; }
      .pub-hero-frame { max-width: 420px; max-height: 360px; margin: 0 auto; }
      .pub-platform-visual { order: -1; }
      .pub-platform-frame { max-width: 100%; aspect-ratio: 16 / 11; }
    }
  `]
})
export class HomeComponent {
  readonly site = SITE;
  readonly media = MEDIA;
  readonly trustItems = TRUST_ITEMS;
  readonly funnelSteps = FUNNEL_STEPS;
  readonly features = PLATFORM_FEATURES;
  readonly faq = FAQ_ITEMS;
  readonly whatsappUrl = `https://wa.me/${SITE.whatsapp}`;
  readonly appLoginUrl = appLoginUrl;
}
