import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MEDIA, SITE } from './site.constants';
import { appLoginUrl } from './external-links';
import { SeoService } from './seo.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, NzButtonModule, NzIconModule],
  template: `
    <div class="pub-shell" [class.pub-menu-open]="menuOpen">
      <header class="pub-header">
        <a routerLink="/" class="pub-brand" aria-label="Contfy Contábil — início" (click)="closeMenu()">
          <span class="pub-brand-lockup">
            <img [src]="media.logoMark" alt="" class="pub-brand-mark" />
            <span class="pub-brand-text">
              <span class="pub-brand-name">{{ site.brandName }}</span>
              <span class="pub-brand-tag">CONTÁBIL</span>
            </span>
          </span>
        </a>

        <div class="pub-header-end">
          <div class="pub-nav-backdrop" *ngIf="menuOpen" (click)="closeMenu()" aria-hidden="true"></div>
          <nav id="pub-nav" class="pub-nav" [class.pub-nav-open]="menuOpen">
            <a routerLink="/como-funciona" routerLinkActive="active" (click)="closeMenu()">Como funciona</a>
            <a routerLink="/plataforma" routerLinkActive="active" (click)="closeMenu()">Plataforma</a>
            <a routerLink="/planos" routerLinkActive="active" (click)="closeMenu()">Serviços</a>
            <a routerLink="/contato" (click)="closeMenu()">Contato</a>
            <div class="pub-nav-actions">
              <a nz-button nzType="default" class="pub-btn-ghost pub-link-btn" [href]="appLoginUrl" (click)="closeMenu()">Já sou cliente</a>
              <a nz-button nzType="primary" class="pub-link-btn" routerLink="/plataforma" (click)="closeMenu()">Conhecer plataforma</a>
            </div>
          </nav>
          <div class="pub-header-actions pub-header-actions--desktop">
            <a nz-button nzType="default" class="pub-btn-ghost pub-link-btn" [href]="appLoginUrl">Já sou cliente</a>
            <a nz-button nzType="primary" class="pub-link-btn" routerLink="/plataforma">Conhecer plataforma</a>
          </div>
          <button
            type="button"
            class="pub-menu-btn"
            (click)="toggleMenu()"
            [attr.aria-expanded]="menuOpen"
            aria-controls="pub-nav"
            [attr.aria-label]="menuOpen ? 'Fechar menu' : 'Abrir menu'"
          >
            <i nz-icon [nzType]="menuOpen ? 'close' : 'menu'" nzTheme="outline"></i>
          </button>
        </div>
      </header>

      <main class="pub-main">
        <router-outlet />
      </main>

      <footer class="pub-footer">
        <div class="pub-footer-grid">
          <div class="pub-footer-brand">
            <img [src]="media.logoFooter" alt="Contfy" class="pub-footer-logo" />
            <p class="pub-footer-tagline">{{ site.tagline }}</p>
            <p class="pub-footer-desc">
              Contabilidade digital com plataforma online e suporte humano para abertura de empresa e mudança de contador.
            </p>
          </div>
          <div>
            <strong>Serviços</strong>
            <a routerLink="/abrir-empresa">Abrir empresa</a>
            <a routerLink="/mudar-contador">Mudar de contador</a>
            <a routerLink="/planos">Planos e serviços</a>
            <a routerLink="/plataforma">Demonstração</a>
          </div>
          <div>
            <strong>Ajuda</strong>
            <a routerLink="/como-funciona">Como funciona</a>
            <a routerLink="/" fragment="faq">Perguntas frequentes</a>
            <a routerLink="/contato">Fale conosco</a>
            <a [href]="whatsappUrl" target="_blank" rel="noopener">WhatsApp</a>
          </div>
          <div>
            <strong>Contato</strong>
            <a [href]="'tel:' + site.whatsapp">{{ site.whatsappDisplay }}</a>
            <a [href]="'mailto:' + site.email">{{ site.email }}</a>
            <a [href]="'mailto:' + site.emailSuporte">{{ site.emailSuporte }}</a>
            <span class="pub-footer-meta">{{ site.atendimentoHorario }}</span>
            <a [href]="appLoginUrl">Já sou cliente</a>
            <span class="pub-footer-copy">© {{ site.copyrightYear }} Contfy</span>
          </div>
        </div>
      </footer>

      <a class="pub-whatsapp" [href]="whatsappUrl" target="_blank" rel="noopener" aria-label="WhatsApp">
        <i nz-icon nzType="message"></i>
      </a>
    </div>
  `,
  styles: [`
    .pub-shell {
      min-height: 100vh;
      background: var(--pub-bg, #f4f8fc);
      color: #1a1a2e;
      overflow-x: clip;
    }
    .pub-shell.pub-menu-open { overflow: hidden; }
    .pub-header {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 24px;
      background: #fff;
      border-bottom: 1px solid rgba(11, 61, 145, 0.08);
    }
    .pub-brand {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: inherit;
      flex-shrink: 0;
      z-index: 102;
    }
    .pub-brand-lockup {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 52px;
      padding: 6px 14px 6px 8px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f7fbff 0%, #ffffff 100%);
      border: 1px solid rgba(11, 61, 145, 0.12);
      box-shadow: 0 4px 14px rgba(11, 61, 145, 0.06);
    }
    .pub-brand-mark {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: contain;
      flex-shrink: 0;
    }
    .pub-brand-text { display: flex; flex-direction: column; line-height: 1.05; }
    .pub-brand-name {
      font-size: 1.28rem;
      font-weight: 800;
      color: var(--primary-color);
      letter-spacing: -0.02em;
    }
    .pub-brand-tag {
      margin-top: 2px;
      font-size: .68rem;
      font-weight: 700;
      letter-spacing: .16em;
      color: #2eb8e8;
    }
    .pub-header-end {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-left: auto;
      flex-shrink: 0;
      z-index: 102;
    }
    .pub-header-actions { display: flex; gap: 8px; flex-wrap: nowrap; }
    .pub-menu-btn {
      display: none;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      padding: 0;
      border: 1px solid rgba(11, 61, 145, 0.15);
      border-radius: 10px;
      background: #fff;
      color: var(--primary-color);
      cursor: pointer;
      font-size: 20px;
      flex-shrink: 0;
    }
    .pub-menu-btn:hover { background: #f4f8fc; }
    .pub-nav-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(11, 31, 63, 0.35);
      z-index: 100;
    }
    .pub-nav {
      display: flex;
      gap: 18px;
      align-items: center;
    }
    .pub-nav a {
      color: rgba(26, 26, 46, .75);
      text-decoration: none;
      font-size: .92rem;
      padding: 4px 0;
    }
    .pub-nav a.active,
    .pub-nav a:hover { color: var(--primary-color); }
    .pub-nav-actions { display: none; }
    .pub-btn-ghost { border-color: var(--primary-color) !important; color: var(--primary-color) !important; }
    .pub-link-btn { text-decoration: none; display: inline-flex; align-items: center; }
    .pub-main { min-height: calc(100vh - 160px); }
    .pub-footer {
      background: #fff;
      border-top: 1px solid rgba(11, 61, 145, .08);
      padding: 32px 24px;
    }
    .pub-footer-grid {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
    .pub-footer-grid div { display: flex; flex-direction: column; gap: 6px; }
    .pub-footer-brand .pub-footer-tagline {
      font-weight: 700;
      color: var(--primary-color);
      margin: 0;
    }
    .pub-footer-desc {
      margin: 0;
      color: rgba(26, 26, 46, .62);
      font-size: .86rem;
      line-height: 1.45;
      max-width: 260px;
    }
    .pub-footer-meta,
    .pub-footer-copy {
      color: rgba(26, 26, 46, .55);
      font-size: .84rem;
    }
    .pub-footer-logo {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(11, 61, 145, .12);
      margin-bottom: 4px;
    }
    .pub-footer-grid a {
      color: rgba(26, 26, 46, .7);
      text-decoration: none;
      font-size: .9rem;
    }
    .pub-footer-grid a:hover { color: var(--primary-color); }
    .pub-whatsapp {
      position: fixed;
      right: max(16px, env(safe-area-inset-right));
      bottom: max(16px, env(safe-area-inset-bottom));
      z-index: 90;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: var(--primary-color);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      text-decoration: none;
      box-shadow: 0 6px 20px rgba(11, 61, 145, .25);
    }

    @media (max-width: 960px) {
      .pub-header { padding: 10px 16px; }
      .pub-header-end { gap: 8px; }
      .pub-header-actions--desktop { display: none; }
      .pub-menu-btn { display: inline-flex; }
      .pub-nav-backdrop {
        display: block;
        position: fixed;
        inset: 0;
      }
      .pub-nav {
        display: none;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(320px, 88vw);
        margin: 0;
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        padding: 88px 20px 24px;
        background: #fff;
        box-shadow: -8px 0 32px rgba(11, 61, 145, .12);
        z-index: 101;
        overflow-y: auto;
      }
      .pub-nav.pub-nav-open { display: flex; }
      .pub-nav a {
        padding: 14px 0;
        font-size: 1rem;
        border-bottom: 1px solid rgba(11, 61, 145, .08);
      }
      .pub-nav-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 20px;
      }
      .pub-nav-actions .pub-link-btn {
        width: 100%;
        justify-content: center;
        min-height: 44px;
      }
      .pub-footer-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
    }

    @media (max-width: 560px) {
      .pub-brand-lockup { padding: 5px 10px 5px 6px; min-height: 46px; }
      .pub-brand-mark { width: 36px; height: 36px; }
      .pub-brand-name { font-size: 1.05rem; }
      .pub-brand-tag { font-size: .58rem; }
      .pub-footer { padding: 28px 16px; }
      .pub-footer-grid { grid-template-columns: 1fr; }
      .pub-whatsapp { width: 48px; height: 48px; font-size: 20px; }
    }
  `]
})
export class PublicLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

  readonly site = SITE;
  readonly media = MEDIA;
  readonly whatsappUrl = `https://wa.me/${SITE.whatsapp}`;
  readonly appLoginUrl = appLoginUrl;

  menuOpen = false;

  ngOnInit(): void {
    this.seo.updateForPath(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.seo.updateForPath((event as NavigationEnd).urlAfterRedirects);
        this.closeMenu();
      });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }
}
