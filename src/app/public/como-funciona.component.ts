import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { ABERTURA_EMPRESA_FLUXO, MUDAR_CONTADOR_FLUXO } from './site.constants';

type FluxoTipo = 'abertura' | 'mudanca';

@Component({
  selector: 'app-como-funciona',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzCardModule],
  template: `
    <section class="pub-page-hero">
      <div class="pub-container">
        <h1>Como funciona</h1>
        <p>Escolha o serviço e veja o fluxo resumido do processo. A Contfy acompanha você em cada etapa.</p>
      </div>
    </section>

    <section class="pub-section">
      <div class="pub-container">
        <div class="pub-fluxo-picker">
          <button
            type="button"
            class="pub-fluxo-option"
            [class.active]="fluxo === 'abertura'"
            (click)="selecionar('abertura')"
          >
            <strong>Abrir empresa</strong>
            <span>Do planejamento ao CNPJ e emissão de notas</span>
          </button>
          <button
            type="button"
            class="pub-fluxo-option"
            [class.active]="fluxo === 'mudanca'"
            (click)="selecionar('mudanca')"
          >
            <strong>Mudar de contador</strong>
            <span>Rescisão, transferência e regularização fiscal</span>
          </button>
        </div>

        <div class="pub-fluxo-head">
          <h2>{{ tituloFluxo }}</h2>
          <p>{{ descricaoFluxo }}</p>
        </div>

        <div class="pub-fluxo-timeline">
          <article *ngFor="let step of passosAtivos; let i = index" class="pub-fluxo-step">
            <div class="pub-fluxo-step-num">{{ i + 1 }}</div>
            <div class="pub-fluxo-step-body">
              <h3>{{ step.title }}</h3>
              <p *ngIf="step.intro" class="pub-fluxo-intro">{{ step.intro }}</p>
              <ul>
                <li *ngFor="let item of step.items">{{ item }}</li>
              </ul>
            </div>
          </article>
        </div>

        <nz-card class="pub-fluxo-cta">
          <p>{{ textoCta }}</p>
          <div class="pub-fluxo-cta-actions">
            <button nz-button nzType="primary" [routerLink]="ctaLink">{{ ctaLabel }}</button>
            <button nz-button routerLink="/plataforma">Conhecer a plataforma</button>
            <button nz-button routerLink="/contato">Falar com a equipe</button>
          </div>
        </nz-card>
      </div>
    </section>
  `,
  styles: [`
    .pub-container { max-width: 900px; margin: 0 auto; padding: 0 24px; }
    .pub-page-hero { padding: 40px 0 20px; background: #eef4fb; }
    .pub-page-hero h1 { color: var(--primary-color); margin: 0 0 8px; }
    .pub-page-hero p { margin: 0; color: rgba(26,26,46,.72); line-height: 1.55; }
    .pub-section { padding: 32px 0 48px; }
    .pub-fluxo-picker {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }
    .pub-fluxo-option {
      text-align: left;
      border: 2px solid rgba(11,61,145,.12);
      border-radius: 12px;
      padding: 18px 20px;
      background: #fff;
      cursor: pointer;
      transition: border-color .15s, box-shadow .15s;
    }
    .pub-fluxo-option strong {
      display: block;
      color: var(--primary-color);
      font-size: 1rem;
      margin-bottom: 4px;
    }
    .pub-fluxo-option span {
      color: rgba(26,26,46,.65);
      font-size: .88rem;
      line-height: 1.4;
    }
    .pub-fluxo-option.active {
      border-color: var(--primary-color);
      box-shadow: 0 8px 24px rgba(11,61,145,.1);
    }
    .pub-fluxo-head { margin-bottom: 24px; }
    .pub-fluxo-head h2 { margin: 0 0 8px; color: var(--primary-color); font-size: 1.35rem; }
    .pub-fluxo-head p { margin: 0; color: rgba(26,26,46,.7); line-height: 1.5; }
    .pub-fluxo-timeline { display: flex; flex-direction: column; gap: 16px; }
    .pub-fluxo-step {
      display: grid;
      grid-template-columns: 40px 1fr;
      gap: 16px;
      background: #fff;
      border: 1px solid rgba(11,61,145,.1);
      border-radius: 12px;
      padding: 18px 20px;
    }
    .pub-fluxo-step-num {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-color);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }
    .pub-fluxo-step-body h3 { margin: 0 0 8px; font-size: 1rem; color: #1a1a2e; }
    .pub-fluxo-intro { margin: 0 0 8px; color: rgba(26,26,46,.72); font-size: .92rem; line-height: 1.45; }
    .pub-fluxo-step-body ul {
      margin: 0;
      padding-left: 18px;
      color: rgba(26,26,46,.78);
      font-size: .9rem;
      line-height: 1.5;
    }
    .pub-fluxo-step-body li + li { margin-top: 6px; }
    .pub-fluxo-cta { margin-top: 28px; }
    .pub-fluxo-cta p { margin: 0 0 14px; color: rgba(26,26,46,.72); line-height: 1.5; }
    .pub-fluxo-cta-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    @media (max-width: 700px) {
      .pub-container { padding: 0 16px; }
      .pub-fluxo-picker { grid-template-columns: 1fr; }
      .pub-fluxo-option { padding: 16px; }
    }
  `]
})
export class ComoFuncionaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  fluxo: FluxoTipo = 'abertura';

  readonly passosAbertura = ABERTURA_EMPRESA_FLUXO;
  readonly passosMudanca = MUDAR_CONTADOR_FLUXO;

  ngOnInit(): void {
    const tipo = this.route.snapshot.queryParamMap.get('tipo');
    if (tipo === 'mudanca' || tipo === 'abertura') {
      this.fluxo = tipo;
    }
  }

  selecionar(fluxo: FluxoTipo): void {
    this.fluxo = fluxo;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tipo: fluxo },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  get passosAtivos() {
    return this.fluxo === 'abertura' ? this.passosAbertura : this.passosMudanca;
  }

  get tituloFluxo(): string {
    return this.fluxo === 'abertura'
      ? 'Fluxo de abertura de empresa'
      : 'Fluxo de mudança de contador';
  }

  get descricaoFluxo(): string {
    return this.fluxo === 'abertura'
      ? 'Visão geral das etapas legais e fiscais até a empresa estar pronta para operar.'
      : 'Passos para encerrar com o contador atual e transferir a responsabilidade para a Contfy.';
  }

  get textoCta(): string {
    return this.fluxo === 'abertura'
      ? 'Quer abrir sua empresa com acompanhamento da Contfy? Envie sua solicitação e nossa equipe orienta cada fase.'
      : 'Pronto para mudar de contador? Solicite a transição e a Contfy conduz o processo com segurança.';
  }

  get ctaLink(): string {
    return this.fluxo === 'abertura' ? '/abrir-empresa' : '/mudar-contador';
  }

  get ctaLabel(): string {
    return this.fluxo === 'abertura' ? 'Solicitar abertura' : 'Solicitar mudança de contador';
  }
}
