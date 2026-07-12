import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { siteHomeUrl } from './external-links';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';

@Component({
  selector: 'app-contratacao-sucesso',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzResultModule],
  template: `
    <section class="pub-section">
      <div class="pub-container pub-success">
        <nz-result nzStatus="success" nzTitle="Solicitação enviada com sucesso!" [nzSubTitle]="subtitulo">
          <div nz-result-extra>
            <a nz-button nzType="primary" routerLink="/plataforma">Conhecer a plataforma</a>
            <a nz-button [href]="siteHomeUrl">Voltar ao site</a>
          </div>
        </nz-result>
      </div>
    </section>
  `,
  styles: [`
    .pub-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .pub-section { padding: 48px 0; }
    .pub-success { max-width: 640px; }
  `]
})
export class ContratacaoSucessoComponent implements OnInit {
  subtitulo = 'Nossa equipe analisará seus dados e entrará em contato. O acesso à plataforma é liberado após essa análise.';
  readonly siteHomeUrl = siteHomeUrl;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.subtitulo = `Recebemos sua solicitação para ${email}. Quando seu acesso estiver liberado, use o botão Já sou cliente em contabilcontfy.com.br.`;
    }
  }
}
