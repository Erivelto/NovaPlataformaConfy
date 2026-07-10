import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MEDIA, SITE } from './site.constants';
import { appLoginUrl } from './external-links';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, NzButtonModule, NzIconModule],
  template: `
    <div class="pub-shell">
      <header class="pub-header">
        <a routerLink="/" class="pub-brand">
          <img [src]="media.logo" alt="Contfy" class="pub-brand-logo" />
        </a>
        <nav class="pub-nav">
          <a routerLink="/planos" routerLinkActive="active">Planos</a>
          <a routerLink="/" fragment="como-funciona">Como funciona</a>
          <a routerLink="/" fragment="plataforma">Plataforma</a>
          <a routerLink="/contato">Contato</a>
        </nav>
        <div class="pub-header-actions">
          <a nz-button nzType="default" class="pub-btn-ghost pub-link-btn" [href]="appLoginUrl">Já sou cliente</a>
          <a nz-button nzType="primary" class="pub-link-btn" [href]="appLoginUrl">Entrar na plataforma</a>
        </div>
      </header>

      <main class="pub-main">
        <router-outlet />
      </main>

      <footer class="pub-footer">
        <div class="pub-footer-grid">
          <div>
            <img [src]="media.logoFooter" alt="Contfy" class="pub-footer-logo" />
            <p>{{ site.tagline }}</p>
          </div>
          <div>
            <strong>Serviços</strong>
            <a routerLink="/abrir-empresa">Abrir empresa</a>
            <a routerLink="/mudar-contador">Mudar contador</a>
            <a routerLink="/planos">Planos</a>
          </div>
          <div>
            <strong>Contato</strong>
            <a [href]="'tel:' + site.whatsapp">{{ site.whatsappDisplay }}</a>
            <a [href]="'mailto:' + site.email">{{ site.email }}</a>
          </div>
          <div>
            <strong>Plataforma</strong>
            <a [href]="appLoginUrl">Entrar</a>
            <span>© {{ site.copyrightYear }} Contfy</span>
          </div>
        </div>
      </footer>

      <a class="pub-whatsapp" [href]="whatsappUrl" target="_blank" rel="noopener" aria-label="WhatsApp">
        <i nz-icon nzType="message"></i>
      </a>
    </div>
  `,
  styles: [`
    .pub-shell { min-height: 100vh; background: var(--pub-bg, #f4f8fc); color: #1a1a2e; }
    .pub-header {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; gap: 20px;
      padding: 12px 24px; background: #fff;
      border-bottom: 1px solid rgba(11, 61, 145, 0.08);
    }
    .pub-brand { display: flex; align-items: center; text-decoration: none; color: inherit; }
    .pub-brand-logo { height: 52px; width: 52px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(11,61,145,.15); }
    .pub-nav { display: flex; gap: 18px; margin-left: auto; }
    .pub-nav a { color: rgba(26,26,46,.75); text-decoration: none; font-size: .92rem; }
    .pub-nav a.active, .pub-nav a:hover { color: var(--primary-color); }
    .pub-header-actions { display: flex; gap: 8px; }
    .pub-btn-ghost { border-color: var(--primary-color) !important; color: var(--primary-color) !important; }
    .pub-link-btn { text-decoration: none; display: inline-flex; align-items: center; }
    .pub-main { min-height: calc(100vh - 160px); }
    .pub-footer { background: #fff; border-top: 1px solid rgba(11,61,145,.08); padding: 32px 24px; }
    .pub-footer-grid {
      max-width: 1100px; margin: 0 auto;
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
    }
    .pub-footer-grid div { display: flex; flex-direction: column; gap: 6px; }
    .pub-footer-logo { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(11,61,145,.12); margin-bottom: 4px; }
    .pub-footer-grid a { color: rgba(26,26,46,.7); text-decoration: none; font-size: .9rem; }
    .pub-footer-grid a:hover { color: var(--primary-color); }
    .pub-whatsapp {
      position: fixed; right: 20px; bottom: 20px; z-index: 120;
      width: 52px; height: 52px; border-radius: 50%;
      background: var(--primary-color); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; text-decoration: none;
    }
    @media (max-width: 900px) {
      .pub-header { flex-wrap: wrap; }
      .pub-nav { order: 3; width: 100%; flex-wrap: wrap; margin-left: 0; }
      .pub-footer-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 560px) {
      .pub-header-actions .pub-btn-ghost { display: none; }
      .pub-footer-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PublicLayoutComponent {
  readonly site = SITE;
  readonly media = MEDIA;
  readonly whatsappUrl = `https://wa.me/${SITE.whatsapp}`;
  readonly appLoginUrl = appLoginUrl;
}
