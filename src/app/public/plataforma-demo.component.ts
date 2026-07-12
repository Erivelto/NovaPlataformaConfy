import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MEDIA, PLATFORM_FEATURES, SITE } from './site.constants';
import { appLoginUrl } from './external-links';

@Component({
  selector: 'app-plataforma-demo',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzCardModule, NzIconModule],
  template: `
    <section class="pub-page-hero">
      <div class="pub-container">
        <h1>Conheça a plataforma Contfy</h1>
        <p>
          Antes de liberar o acesso, assista à demonstração e entenda se a solução se encaixa no perfil da sua empresa.
          O cadastro na plataforma é feito pela nossa equipe após análise do seu caso.
        </p>
      </div>
    </section>

    <section class="pub-section">
      <div class="pub-container pub-demo-grid">
        <div class="pub-video-wrap">
          <iframe
            *ngIf="videoEmbedUrl; else videoPlaceholder"
            [src]="videoEmbedUrl"
            title="Demonstração da plataforma Contfy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
          <ng-template #videoPlaceholder>
            <div class="pub-video-placeholder">
              <img [src]="media.startup" alt="Plataforma Contfy" />
              <div class="pub-video-overlay">
                <i nz-icon nzType="play-circle" nzTheme="fill"></i>
                <p>Vídeo demonstrativo em breve</p>
                <small>Enquanto isso, fale com nossa equipe para conhecer a plataforma.</small>
              </div>
            </div>
          </ng-template>
        </div>

        <nz-card class="pub-demo-side">
          <h3>Como funciona o acesso</h3>
          <ul class="pub-demo-steps">
            <li><strong>1.</strong> Assista à demonstração e conheça os recursos.</li>
            <li><strong>2.</strong> Solicite abertura de empresa ou mudança de contador.</li>
            <li><strong>3.</strong> Nossa equipe analisa se o serviço é adequado ao seu perfil.</li>
            <li><strong>4.</strong> Com acesso liberado, entre com o botão <em>Já sou cliente</em>.</li>
          </ul>
          <p class="pub-demo-note">
            Nem toda empresa se encaixa no modelo de contabilidade digital — por isso o primeiro contato é feito com orientação da equipe Contfy.
          </p>
          <div class="pub-demo-actions">
            <a nz-button nzType="default" class="pub-link-btn" [href]="appLoginUrl">Já sou cliente</a>
            <button nz-button nzType="primary" routerLink="/abrir-empresa">Abrir empresa</button>
            <button nz-button routerLink="/mudar-contador">Mudar de contador</button>
          </div>
        </nz-card>
      </div>
    </section>

    <section class="pub-section pub-section-alt">
      <div class="pub-container">
        <h2>O que você encontra na plataforma</h2>
        <div class="pub-features">
          <div *ngFor="let f of features" class="pub-feature-card">
            <strong>{{ f.title }}</strong>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .pub-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .pub-page-hero { padding: 40px 0 20px; background: #eef4fb; }
    .pub-page-hero h1 { color: var(--primary-color); margin: 0 0 8px; }
    .pub-page-hero p { margin: 0; max-width: 720px; color: rgba(26,26,46,.72); line-height: 1.55; }
    .pub-section { padding: 32px 0 48px; }
    .pub-section-alt { background: #fff; }
    .pub-section h2 { color: var(--primary-color); margin-bottom: 24px; }
    .pub-demo-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
      gap: 24px;
      align-items: start;
    }
    .pub-video-wrap {
      border-radius: 12px;
      overflow: hidden;
      background: #0b1f3f;
      box-shadow: 0 12px 36px rgba(11,61,145,.12);
      aspect-ratio: 16 / 9;
    }
    .pub-video-wrap iframe {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }
    .pub-video-placeholder {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 280px;
    }
    .pub-video-placeholder img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: .45;
    }
    .pub-video-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px;
      text-align: center;
      color: #fff;
      background: rgba(11, 61, 145, .55);
    }
    .pub-video-overlay i { font-size: 3rem; }
    .pub-video-overlay p { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .pub-video-overlay small { opacity: .9; max-width: 320px; line-height: 1.4; }
    .pub-demo-side h3 { margin: 0 0 12px; color: var(--primary-color); }
    .pub-demo-steps {
      margin: 0 0 16px;
      padding-left: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
      color: rgba(26,26,46,.82);
      font-size: .92rem;
      line-height: 1.45;
    }
    .pub-demo-note {
      margin: 0 0 16px;
      color: rgba(26,26,46,.65);
      font-size: .88rem;
      line-height: 1.5;
    }
    .pub-demo-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .pub-link-btn { text-decoration: none; display: inline-flex; align-items: center; }
    .pub-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .pub-feature-card { background: #f4f8fc; border-radius: 10px; padding: 16px; border: 1px solid rgba(11,61,145,.08); }
    .pub-feature-card p { margin: 6px 0 0; color: rgba(26,26,46,.65); font-size: .9rem; }
    @media (max-width: 900px) {
      .pub-demo-grid, .pub-features { grid-template-columns: 1fr; }
    }
  `]
})
export class PlataformaDemoComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);

  readonly site = SITE;
  readonly media = MEDIA;
  readonly features = PLATFORM_FEATURES;
  readonly appLoginUrl = appLoginUrl;
  videoEmbedUrl: SafeResourceUrl | null = null;

  ngOnInit(): void {
    const url = SITE.platformDemoVideoEmbedUrl?.trim();
    if (url) {
      this.videoEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }
}
