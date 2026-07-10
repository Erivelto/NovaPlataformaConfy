import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SITE } from './site.constants';
import { appLoginUrl } from './external-links';

@Component({
  selector: 'app-contato',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzCardModule, NzIconModule],
  template: `
    <section class="pub-page-hero">
      <div class="pub-container">
        <h1>Contato</h1>
        <p>Fale com a equipe Contfy pelos canais abaixo.</p>
      </div>
    </section>
    <section class="pub-section">
      <div class="pub-container pub-contact-grid">
        <nz-card>
          <h3><i nz-icon nzType="phone"></i> Telefone / WhatsApp</h3>
          <p>{{ site.whatsappDisplay }}</p>
          <a nz-button nzType="primary" [href]="whatsappUrl" target="_blank" rel="noopener">Chamar no WhatsApp</a>
        </nz-card>
        <nz-card>
          <h3><i nz-icon nzType="mail"></i> E-mail</h3>
          <p>{{ site.email }}</p>
          <p>{{ site.emailSuporte }}</p>
          <a nz-button [href]="'mailto:' + site.email">Enviar e-mail</a>
        </nz-card>
        <nz-card>
          <h3><i nz-icon nzType="user"></i> Plataforma</h3>
          <p>Já é cliente? Acesse sua conta na plataforma digital.</p>
          <a nz-button nzType="primary" [href]="appLoginUrl">Entrar na plataforma</a>
        </nz-card>
      </div>
    </section>
  `,
  styles: [`
    .pub-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .pub-page-hero { padding: 40px 0 20px; background: #eef4fb; }
    .pub-page-hero h1 { color: var(--primary-color); margin: 0 0 8px; }
    .pub-section { padding: 32px 0 48px; }
    .pub-contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 900px) { .pub-contact-grid { grid-template-columns: 1fr; } }
  `]
})
export class ContatoComponent {
  readonly site = SITE;
  readonly whatsappUrl = `https://wa.me/${SITE.whatsapp}`;
  readonly appLoginUrl = appLoginUrl;
}
